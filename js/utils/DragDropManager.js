// 拖放管理器 - 处理任务拖放功能

class DragDropManager {
    constructor(app) {
        this.app = app;
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
            event.dataTransfer.setData('text/plain', event.target.id);
            event.target.classList.add('dragging');
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
        }
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
            const targetQueueId = parseInt(queueElement.dataset.queueId);
            
            // 移动任务到新队列
            this.app.moveTaskToQueue(taskId, targetQueueId);
        }
    }
}

export default DragDropManager; 