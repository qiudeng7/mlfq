document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let queues = [];
    let tasks = [];
    let editingTaskId = null;
    let editingQueueId = null;
    let queueIdCounter = 0;
    let taskIdCounter = 0;
    
    // 获取DOM元素
    const taskNameInput = document.getElementById('taskName');
    const addTaskButton = document.getElementById('addTask');
    const addQueueButton = document.getElementById('addQueue');
    const removeQueueButton = document.getElementById('removeQueue');
    const queuesContainer = document.getElementById('queues-container');
    const taskDrawer = document.getElementById('taskDrawer');
    const overlay = document.getElementById('overlay');
    const closeDrawerButton = document.getElementById('closeDrawer');
    const editTaskTitleInput = document.getElementById('editTaskTitle');
    const editTaskContentInput = document.getElementById('editTaskContent');
    const saveTaskChangesButton = document.getElementById('saveTaskChanges');
    const deleteTaskButton = document.getElementById('deleteTask');
    
    // 从localStorage加载数据
    loadFromLocalStorage();
    
    // 初始化界面
    renderQueues();
    
    // 事件监听
    addTaskButton.addEventListener('click', addTask);
    addQueueButton.addEventListener('click', addQueue);
    removeQueueButton.addEventListener('click', removeQueue);
    closeDrawerButton.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    saveTaskChangesButton.addEventListener('click', saveTaskChanges);
    deleteTaskButton.addEventListener('click', deleteTask);
    
    // 添加全局点击事件，处理队列名称编辑完成
    document.addEventListener('click', handleGlobalClick);
    
    // 添加全局按键事件，处理队列名称编辑的回车和Esc键
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // 设置拖拽功能
    setupDragAndDrop();
    
    // 添加新任务
    function addTask() {
        const name = taskNameInput.value.trim();
        
        if (!name) {
            alert('请输入任务名称！');
            return;
        }
        
        if (queues.length === 0) {
            alert('请先添加至少一个队列！');
            return;
        }
        
        // 任务始终进入第一个队列（最高优先级）
        const task = {
            id: 'task-' + taskIdCounter++,
            title: name,
            content: '',
            queueId: queues[0].id // 添加到最高优先级队列
        };
        
        tasks.push(task);
        saveToLocalStorage();
        
        // 清空输入
        taskNameInput.value = '';
        
        // 更新界面
        renderQueues();
    }
    
    // 添加新队列
    function addQueue() {
        const newQueueId = queueIdCounter++;
        
        const newQueue = {
            id: newQueueId,
            name: `队列 ${queues.length + 1}`
        };
        
        queues.push(newQueue);
        saveToLocalStorage();
        renderQueues();
    }
    
    // 减少队列（删除最后一个）
    function removeQueue() {
        if (queues.length <= 1) {
            alert('至少保留一个队列！');
            return;
        }
        
        // 获取最后一个队列
        const lastQueue = queues[queues.length - 1];
        
        // 将该队列中的任务移动到前一个队列
        const previousQueueId = queues[queues.length - 2].id;
        
        tasks.forEach(task => {
            if (task.queueId === lastQueue.id) {
                task.queueId = previousQueueId;
            }
        });
        
        // 删除最后一个队列
        queues.pop();
        
        saveToLocalStorage();
        renderQueues();
    }
    
    // 处理队列标题点击事件
    function handleQueueTitleClick(queueId, titleElement, event) {
        // 防止事件冒泡，避免触发全局点击事件处理
        if (event) event.stopPropagation();
        
        // 如果已有正在编辑的队列名称，先保存它
        if (editingQueueId !== null) {
            const currentEditingInput = document.querySelector('.queue-title-input');
            if (currentEditingInput) {
                saveQueueTitle(editingQueueId, currentEditingInput.value);
            }
        }
        
        editingQueueId = queueId;
        const queue = queues.find(q => q.id === queueId);
        if (!queue) return;
        
        // 创建输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'queue-title-input';
        input.value = queue.name;
        input.setAttribute('data-queue-id', queueId);
        
        // 替换标题为输入框
        titleElement.parentNode.replaceChild(input, titleElement);
        
        // 聚焦并选中文本
        input.focus();
        input.select();
        
        // 添加输入框的按键监听
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveQueueTitle(queueId, input.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelQueueEdit();
            }
        });
        
        // 防止点击输入框时触发保存
        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // 保存队列标题
    function saveQueueTitle(queueId, newTitle) {
        newTitle = newTitle.trim();
        if (!newTitle) {
            // 如果标题为空，使用默认标题
            const queueIndex = queues.findIndex(q => q.id === queueId);
            newTitle = `队列 ${queueIndex + 1}`;
        }
        
        const queueIndex = queues.findIndex(q => q.id === queueId);
        if (queueIndex !== -1) {
            queues[queueIndex].name = newTitle;
            saveToLocalStorage();
            
            // 更新UI，但不完全重新渲染，只更新标题
            const input = document.querySelector(`.queue-title-input[data-queue-id="${queueId}"]`);
            if (input) {
                const h2 = document.createElement('h2');
                h2.textContent = newTitle;
                
                // 确保正确添加点击事件
                h2.addEventListener('click', function(event) {
                    handleQueueTitleClick(queueId, h2, event);
                });
                
                input.parentNode.replaceChild(h2, input);
            }
        }
        
        editingQueueId = null;
    }
    
    // 取消队列编辑
    function cancelQueueEdit() {
        if (editingQueueId === null) return;
        
        const input = document.querySelector(`.queue-title-input[data-queue-id="${editingQueueId}"]`);
        if (input) {
            const queue = queues.find(q => q.id === editingQueueId);
            if (queue) {
                const h2 = document.createElement('h2');
                h2.textContent = queue.name;
                
                // 确保正确添加点击事件
                h2.addEventListener('click', function(event) {
                    handleQueueTitleClick(editingQueueId, h2, event);
                });
                
                input.parentNode.replaceChild(h2, input);
            }
        }
        
        editingQueueId = null;
    }
    
    // 处理全局点击事件，用于保存编辑中的队列名称
    function handleGlobalClick(event) {
        // 如果点击的不是正在编辑的输入框，保存队列标题
        if (editingQueueId !== null && !event.target.classList.contains('queue-title-input')) {
            const input = document.querySelector(`.queue-title-input[data-queue-id="${editingQueueId}"]`);
            if (input) {
                saveQueueTitle(editingQueueId, input.value);
            }
        }
    }
    
    // 处理全局按键事件
    function handleGlobalKeydown(event) {
        if (editingQueueId !== null && event.key === 'Escape') {
            cancelQueueEdit();
        }
    }
    
    // 渲染所有队列
    function renderQueues() {
        queuesContainer.innerHTML = '';
        
        queues.forEach(queue => {
            const queueElement = document.createElement('div');
            queueElement.className = 'queue';
            queueElement.id = `queue-${queue.id}`;
            queueElement.dataset.queueId = queue.id; // 为整个队列元素添加数据属性
            
            const queueHeader = document.createElement('div');
            queueHeader.className = 'queue-header';
            
            const queueInfo = document.createElement('div');
            queueInfo.className = 'queue-title';
            
            const title = document.createElement('h2');
            title.textContent = queue.name;
            
            // 增强点击事件监听器，确保参数和event对象正确传递
            title.addEventListener('click', function(event) {
                handleQueueTitleClick(queue.id, title, event);
            });
            
            queueInfo.appendChild(title);
            queueHeader.appendChild(queueInfo);
            
            const queueItems = document.createElement('div');
            queueItems.className = 'queue-items';
            queueItems.dataset.queueId = queue.id;
            
            // 过滤属于该队列的任务
            const queueTasks = tasks.filter(task => task.queueId === queue.id);
            
            if (queueTasks.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'empty-queue-message';
                emptyMessage.textContent = '队列为空';
                queueItems.appendChild(emptyMessage);
            } else {
                queueTasks.forEach(task => {
                    const taskElement = createTaskElement(task);
                    queueItems.appendChild(taskElement);
                });
            }
            
            queueElement.appendChild(queueHeader);
            queueElement.appendChild(queueItems);
            queuesContainer.appendChild(queueElement);
        });
        
        if (queues.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-queue-message';
            emptyMessage.textContent = '请添加队列来开始管理任务';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '20px';
            queuesContainer.appendChild(emptyMessage);
        }
    }
    
    // 创建任务元素
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.id = task.id;
        taskElement.draggable = true;
        
        // 截取内容的前100个字符作为预览
        const contentPreview = task.content ? task.content.substring(0, 100) + (task.content.length > 100 ? '...' : '') : '';
        
        taskElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${contentPreview || '无描述'}</p>
        `;
        
        // 添加点击事件
        taskElement.addEventListener('click', () => openTaskDrawer(task.id));
        
        return taskElement;
    }
    
    // 打开任务抽屉
    function openTaskDrawer(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        editingTaskId = taskId;
        
        // 填充表单数据
        editTaskTitleInput.value = task.title;
        editTaskContentInput.value = task.content || '';
        
        // 打开抽屉
        taskDrawer.classList.add('open');
        overlay.classList.add('active');
    }
    
    // 关闭任务抽屉
    function closeDrawer() {
        taskDrawer.classList.remove('open');
        overlay.classList.remove('active');
        editingTaskId = null;
    }
    
    // 保存任务更改
    function saveTaskChanges() {
        if (!editingTaskId) return;
        
        const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
        if (taskIndex === -1) return;
        
        const title = editTaskTitleInput.value.trim();
        const content = editTaskContentInput.value.trim();
        
        if (!title) {
            alert('任务标题不能为空！');
            return;
        }
        
        // 更新任务
        tasks[taskIndex].title = title;
        tasks[taskIndex].content = content;
        
        saveToLocalStorage();
        renderQueues();
        closeDrawer();
    }
    
    // 删除任务
    function deleteTask() {
        if (!editingTaskId) return;
        
        if (confirm('确定要删除此任务吗？')) {
            tasks = tasks.filter(t => t.id !== editingTaskId);
            saveToLocalStorage();
            renderQueues();
            closeDrawer();
        }
    }
    
    // 设置拖放功能
    function setupDragAndDrop() {
        document.addEventListener('dragstart', function(event) {
            if (event.target.classList.contains('task-item')) {
                event.dataTransfer.setData('text/plain', event.target.id);
                event.target.classList.add('dragging');
            }
        });
        
        document.addEventListener('dragend', function(event) {
            if (event.target.classList.contains('task-item')) {
                event.target.classList.remove('dragging');
            }
            
            // 清除所有队列的dragover效果
            document.querySelectorAll('.queue').forEach(queue => {
                queue.classList.remove('dragover');
            });
        });
        
        // 添加dragenter和dragleave事件以提供视觉反馈
        document.addEventListener('dragenter', function(event) {
            const queueElement = event.target.closest('.queue');
            if (queueElement) {
                queueElement.classList.add('dragover');
            }
        });
        
        document.addEventListener('dragleave', function(event) {
            // 当鼠标离开队列元素时移除高亮效果
            // 需要检查是否真的离开了队列，而不是进入了队列的子元素
            if (event.target.classList.contains('queue') || !event.target.closest('.queue')) {
                const queueElement = event.target.closest('.queue');
                if (queueElement && !queueElement.contains(event.relatedTarget)) {
                    queueElement.classList.remove('dragover');
                }
            }
        });
        
        // 使用事件委托处理拖放事件 - 现在针对整个队列元素
        document.addEventListener('dragover', function(event) {
            // 检查目标是否是队列或其子元素
            const queueElement = event.target.closest('.queue');
            if (queueElement) {
                event.preventDefault();
            }
        });
        
        document.addEventListener('drop', function(event) {
            // 检查目标是否是队列或其子元素
            const queueElement = event.target.closest('.queue');
            if (queueElement) {
                event.preventDefault();
                
                // 移除高亮效果
                queueElement.classList.remove('dragover');
                
                const taskId = event.dataTransfer.getData('text/plain');
                const targetQueueId = parseInt(queueElement.dataset.queueId);
                
                // 更新任务队列级别
                const taskIndex = tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex].queueId = targetQueueId;
                    
                    saveToLocalStorage();
                    renderQueues();
                }
            }
        });
    }
    
    // 保存到localStorage
    function saveToLocalStorage() {
        const data = {
            queues: queues,
            tasks: tasks,
            counters: {
                queue: queueIdCounter,
                task: taskIdCounter
            }
        };
        
        localStorage.setItem('mlfqTaskManager', JSON.stringify(data));
    }
    
    // 从localStorage加载数据
    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('mlfqTaskManager');
        
        if (savedData) {
            const data = JSON.parse(savedData);
            
            queues = data.queues || [];
            tasks = data.tasks || [];
            
            if (data.counters) {
                queueIdCounter = data.counters.queue || 0;
                taskIdCounter = data.counters.task || 0;
            }
        }
        
        // 如果没有队列，创建默认的3个队列
        if (queues.length === 0) {
            queues = [
                { id: queueIdCounter++, name: '高优先级队列' },
                { id: queueIdCounter++, name: '中优先级队列' },
                { id: queueIdCounter++, name: '低优先级队列' }
            ];
            
            saveToLocalStorage();
        }
    }
}); 