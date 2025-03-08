// UI管理器 - 管理界面渲染和用户交互

class UIManager {
    constructor(app) {
        this.app = app;
        this.editingQueueId = null;
        this.editingTaskId = null;
        
        // 缓存DOM元素
        this.elements = {
            taskNameInput: document.getElementById('taskName'),
            addTaskButton: document.getElementById('addTask'),
            addQueueButton: document.getElementById('addQueue'),
            removeQueueButton: document.getElementById('removeQueue'),
            queuesContainer: document.getElementById('queues-container'),
            taskDrawer: document.getElementById('taskDrawer'),
            overlay: document.getElementById('overlay'),
            closeDrawerButton: document.getElementById('closeDrawer'),
            editTaskTitleInput: document.getElementById('editTaskTitle'),
            editTaskContentInput: document.getElementById('editTaskContent'),
            saveTaskChangesButton: document.getElementById('saveTaskChanges'),
            deleteTaskButton: document.getElementById('deleteTask')
        };
        
        // 初始化事件监听
        this.initEventListeners();
    }
    
    // 初始化事件监听器
    initEventListeners() {
        // 基本UI交互
        this.elements.addTaskButton.addEventListener('click', () => this.handleAddTask());
        this.elements.addQueueButton.addEventListener('click', () => this.app.addQueue());
        this.elements.removeQueueButton.addEventListener('click', () => this.app.removeQueue());
        this.elements.closeDrawerButton.addEventListener('click', () => this.closeDrawer());
        this.elements.overlay.addEventListener('click', () => this.closeDrawer());
        this.elements.saveTaskChangesButton.addEventListener('click', () => this.saveTaskChanges());
        this.elements.deleteTaskButton.addEventListener('click', () => this.deleteTask());
        
        // 全局事件
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    }
    
    // 处理添加任务
    handleAddTask() {
        const name = this.elements.taskNameInput.value.trim();
        
        if (!name) {
            alert('请输入任务名称！');
            return;
        }
        
        this.app.addTask(name);
        
        // 清空输入
        this.elements.taskNameInput.value = '';
    }
    
    // 渲染所有队列
    renderQueues(queues, tasks) {
        const queuesContainer = this.elements.queuesContainer;
        queuesContainer.innerHTML = '';
        
        if (queues.length === 0) {
            this.renderEmptyMessage(queuesContainer);
            return;
        }
        
        queues.forEach((queue, index) => {
            const queueElement = this.createQueueElement(queue, index);
            
            // 获取并按顺序排序队列中的任务
            const queueTasks = this.app.taskModel.getTasksByQueueId(queue.id);
            
            this.renderQueueTasks(queueElement.querySelector('.queue-items'), queueTasks);
            queuesContainer.appendChild(queueElement);
        });
    }
    
    // 创建队列元素
    createQueueElement(queue, index) {
        const queueElement = document.createElement('div');
        queueElement.className = 'queue';
        queueElement.id = `queue-${queue.id}`;
        queueElement.dataset.queueId = queue.id;
        
        const queueHeader = document.createElement('div');
        queueHeader.className = 'queue-header';
        
        const queueInfo = document.createElement('div');
        queueInfo.className = 'queue-title';
        
        const title = document.createElement('h2');
        title.textContent = queue.name;
        
        // 添加点击事件
        title.addEventListener('click', (event) => this.handleQueueTitleClick(queue.id, title, event));
        
        queueInfo.appendChild(title);
        queueHeader.appendChild(queueInfo);
        
        const queueItems = document.createElement('div');
        queueItems.className = 'queue-items';
        queueItems.dataset.queueId = queue.id;
        
        queueElement.appendChild(queueHeader);
        queueElement.appendChild(queueItems);
        
        return queueElement;
    }
    
    // 渲染队列任务
    renderQueueTasks(queueItemsContainer, queueTasks) {
        if (queueTasks.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-queue-message';
            emptyMessage.textContent = '队列为空';
            queueItemsContainer.appendChild(emptyMessage);
            return;
        }
        
        queueTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            queueItemsContainer.appendChild(taskElement);
        });
    }
    
    // 创建任务元素
    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.id = task.id;
        taskElement.draggable = true;
        taskElement.dataset.order = task.order || 0;
        
        // 截取内容的前100个字符作为预览
        const contentPreview = task.content ? task.content.substring(0, 100) + (task.content.length > 100 ? '...' : '') : '';
        
        taskElement.innerHTML = `
            <h3>${task.title}</h3>
            <p>${contentPreview || '无描述'}</p>
        `;
        
        // 添加点击事件
        taskElement.addEventListener('click', () => this.openTaskDrawer(task.id));
        
        return taskElement;
    }
    
    // 渲染空消息
    renderEmptyMessage(container) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-queue-message';
        emptyMessage.textContent = '请添加队列来开始管理任务';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '20px';
        container.appendChild(emptyMessage);
    }
    
    // 处理队列标题点击
    handleQueueTitleClick(queueId, titleElement, event) {
        if (event) event.stopPropagation();
        
        // 如果已有正在编辑的队列名称，先保存它
        if (this.editingQueueId !== null) {
            const currentEditingInput = document.querySelector('.queue-title-input');
            if (currentEditingInput) {
                this.saveQueueTitle(this.editingQueueId, currentEditingInput.value);
            }
        }
        
        this.editingQueueId = queueId;
        const queue = this.app.getQueue(queueId);
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
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveQueueTitle(queueId, input.value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelQueueEdit();
            }
        });
        
        // 防止点击输入框时触发保存
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // 保存队列标题
    saveQueueTitle(queueId, newTitle) {
        newTitle = newTitle.trim();
        if (!newTitle) {
            // 如果标题为空，获取队列索引并使用默认标题
            const queues = this.app.getAllQueues();
            const queueIndex = queues.findIndex(q => String(q.id) === String(queueId));
            newTitle = `队列 ${queueIndex + 1}`;
        }
        
        // 更新队列名称
        this.app.updateQueueName(queueId, newTitle);
        
        // 更新UI，但不完全重新渲染，只更新标题
        const input = document.querySelector(`.queue-title-input[data-queue-id="${queueId}"]`);
        if (input) {
            const h2 = document.createElement('h2');
            h2.textContent = newTitle;
            
            // 确保正确添加点击事件
            h2.addEventListener('click', (event) => this.handleQueueTitleClick(queueId, h2, event));
            
            input.parentNode.replaceChild(h2, input);
        }
        
        this.editingQueueId = null;
    }
    
    // 取消队列编辑
    cancelQueueEdit() {
        if (this.editingQueueId === null) return;
        
        const input = document.querySelector(`.queue-title-input[data-queue-id="${this.editingQueueId}"]`);
        if (input) {
            const queue = this.app.getQueue(this.editingQueueId);
            if (queue) {
                const h2 = document.createElement('h2');
                h2.textContent = queue.name;
                
                // 确保正确添加点击事件
                h2.addEventListener('click', (event) => this.handleQueueTitleClick(this.editingQueueId, h2, event));
                
                input.parentNode.replaceChild(h2, input);
            }
        }
        
        this.editingQueueId = null;
    }
    
    // 处理全局点击，用于保存编辑中的队列名称
    handleGlobalClick(event) {
        // 如果点击的不是正在编辑的输入框，保存队列标题
        if (this.editingQueueId !== null && !event.target.classList.contains('queue-title-input')) {
            const input = document.querySelector(`.queue-title-input[data-queue-id="${this.editingQueueId}"]`);
            if (input) {
                this.saveQueueTitle(this.editingQueueId, input.value);
            }
        }
    }
    
    // 处理全局按键
    handleGlobalKeydown(event) {
        if (this.editingQueueId !== null && event.key === 'Escape') {
            this.cancelQueueEdit();
        }
    }
    
    // 打开任务抽屉
    openTaskDrawer(taskId) {
        const task = this.app.getTask(taskId);
        if (!task) return;
        
        this.editingTaskId = taskId;
        
        // 填充表单数据
        this.elements.editTaskTitleInput.value = task.title;
        this.elements.editTaskContentInput.value = task.content || '';
        
        // 打开抽屉
        this.elements.taskDrawer.classList.add('open');
        this.elements.overlay.classList.add('active');
    }
    
    // 关闭任务抽屉
    closeDrawer() {
        this.elements.taskDrawer.classList.remove('open');
        this.elements.overlay.classList.remove('active');
        this.editingTaskId = null;
    }
    
    // 保存任务更改
    saveTaskChanges() {
        if (!this.editingTaskId) return;
        
        const title = this.elements.editTaskTitleInput.value.trim();
        const content = this.elements.editTaskContentInput.value.trim();
        
        if (!title) {
            alert('任务标题不能为空！');
            return;
        }
        
        // 更新任务
        this.app.updateTask(this.editingTaskId, title, content);
        this.closeDrawer();
    }
    
    // 删除任务
    deleteTask() {
        if (!this.editingTaskId) return;
        
        if (confirm('确定要删除此任务吗？')) {
            this.app.deleteTask(this.editingTaskId);
            this.closeDrawer();
        }
    }
    
    // 显示保存成功通知
    showSaveNotification() {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.textContent = '数据已保存';
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 应用动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 一段时间后移除通知
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
}

export default UIManager; 