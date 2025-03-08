// 拖放管理器 - 处理任务拖放功能

class DragDropManager {
    constructor(app) {
        this.app = app;
        this.draggedTaskId = null;
        this.setupDragAndDrop();
    }
    
    // 设置拖放功能
    setupDragAndDrop() {
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
    }
    
    // 处理拖拽开始
    handleDragStart(event) {
        if (event.target.classList.contains('task-item')) {
            this.draggedTaskId = event.target.id;
            event.dataTransfer.setData('text/plain', event.target.id);
            event.target.classList.add('dragging');
            
            // 设置拖拽图像
            event.dataTransfer.effectAllowed = 'move';
        }
    }
    
    // 处理拖拽结束
    handleDragEnd(event) {
        if (event.target.classList.contains('task-item')) {
            event.target.classList.remove('dragging');
        }
        
        // 清除所有队列的dragover效果
        document.querySelectorAll('.queue').forEach(queue => {
            queue.classList.remove('dragover');
        });
        
        document.querySelectorAll('.insert-marker').forEach(marker => {
            marker.remove();
        });
        
        this.draggedTaskId = null;
    }
    
    // 处理拖拽进入
    handleDragEnter(event) {
        const queueElement = event.target.closest('.queue');
        if (queueElement) {
            queueElement.classList.add('dragover');
        }
    }
    
    // 处理拖拽离开
    handleDragLeave(event) {
        // 当鼠标离开队列元素时移除高亮效果
        // 需要检查是否真的离开了队列，而不是进入了队列的子元素
        if (event.target.classList.contains('queue') || !event.target.closest('.queue')) {
            const queueElement = event.target.closest('.queue');
            if (queueElement && !queueElement.contains(event.relatedTarget)) {
                queueElement.classList.remove('dragover');
            }
        }
    }
    
    // 处理拖拽悬停
    handleDragOver(event) {
        // 检查目标是否是队列或其子元素
        const queueElement = event.target.closest('.queue');
        if (queueElement) {
            event.preventDefault(); // 允许放置
            
            // 如果拖动到了任务项上，根据鼠标位置决定插入位置
            const taskElement = event.target.closest('.task-item');
            if (taskElement && taskElement.id !== this.draggedTaskId) {
                this.showInsertMarker(event, taskElement, queueElement);
            } 
            // 如果拖动到了空白区域，则显示在末尾
            else if (event.target.classList.contains('queue-items') || 
                     event.target.classList.contains('empty-queue-message')) {
                this.showInsertMarkerAtEnd(queueElement);
            }
        }
    }
    
    // 在任务项之间显示插入标记
    showInsertMarker(event, targetTaskElement, queueElement) {
        // 移除所有现有的插入标记
        document.querySelectorAll('.insert-marker').forEach(marker => {
            marker.remove();
        });
        
        // 创建插入标记
        const marker = document.createElement('div');
        marker.className = 'insert-marker';
        
        const rect = targetTaskElement.getBoundingClientRect();
        const offsetY = event.clientY - rect.top;
        
        // 根据鼠标在目标任务的位置决定是插入到上方还是下方
        if (offsetY < rect.height / 2) {
            // 插入到目标任务的上方
            targetTaskElement.insertAdjacentElement('beforebegin', marker);
            marker.dataset.position = 'before';
            marker.dataset.targetId = targetTaskElement.id;
        } else {
            // 插入到目标任务的下方
            targetTaskElement.insertAdjacentElement('afterend', marker);
            marker.dataset.position = 'after';
            marker.dataset.targetId = targetTaskElement.id;
        }
    }
    
    // 显示插入标记在队列末尾
    showInsertMarkerAtEnd(queueElement) {
        // 移除所有现有的插入标记
        document.querySelectorAll('.insert-marker').forEach(marker => {
            marker.remove();
        });
        
        // 创建插入标记
        const marker = document.createElement('div');
        marker.className = 'insert-marker';
        marker.dataset.position = 'end';
        
        // 找到这个队列的任务容器
        const queueItems = queueElement.querySelector('.queue-items');
        
        // 如果队列为空，只有空消息，则清除空消息并添加标记
        const emptyMessage = queueItems.querySelector('.empty-queue-message');
        if (emptyMessage) {
            queueItems.innerHTML = '';
        }
        
        // 将标记添加到队列末尾
        queueItems.appendChild(marker);
    }
    
    // 处理放置
    handleDrop(event) {
        // 检查目标是否是队列或其子元素
        const queueElement = event.target.closest('.queue');
        if (queueElement) {
            event.preventDefault();
            
            // 移除高亮效果
            queueElement.classList.remove('dragover');
            
            const taskId = event.dataTransfer.getData('text/plain');
            const targetQueueId = queueElement.dataset.queueId;
            
            // 检查是否有插入标记
            const marker = document.querySelector('.insert-marker');
            if (marker) {
                // 获取任务在队列中的位置
                const position = marker.dataset.position;
                
                // 计算新的排序位置
                let newOrder = 0;
                
                if (position === 'end') {
                    // 插入到队列末尾
                    const tasksInQueue = this.app.taskModel.getTasksByQueueId(targetQueueId);
                    newOrder = tasksInQueue.length > 0 ? tasksInQueue.length : 0;
                } else {
                    // 插入到指定任务前后
                    const targetTaskId = marker.dataset.targetId;
                    const targetTask = this.app.taskModel.getTask(targetTaskId);
                    
                    if (targetTask) {
                        newOrder = position === 'before' ? targetTask.order : targetTask.order + 1;
                    }
                }
                
                // 重新排序任务
                this.app.taskModel.reorderTask(taskId, targetQueueId, newOrder);
                this.app.saveData();
                this.app.renderUI();
                
                // 移除标记
                marker.remove();
            } else {
                // 如果没有插入标记，默认移动到队列
                this.app.moveTaskToQueue(taskId, targetQueueId);
            }
        }
    }
}

export default DragDropManager; 