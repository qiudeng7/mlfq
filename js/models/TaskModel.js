// 任务模型类 - 负责管理所有任务相关的逻辑

class TaskModel {
    constructor() {
        this.tasks = [];
        this.taskIdCounter = 0;
    }

    // 从存储中加载任务
    loadFromData(data) {
        if (data && data.tasks) {
            this.tasks = data.tasks;
        }
        
        if (data && data.counters && data.counters.task !== undefined) {
            this.taskIdCounter = data.counters.task;
        }
    }

    // 创建新任务
    createTask(title, content = '', queueId) {
        const task = {
            id: 'task-' + this.taskIdCounter++,
            title: title,
            content: content,
            queueId: queueId
        };
        
        this.tasks.push(task);
        return task;
    }

    // 更新任务
    updateTask(taskId, title, content) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return false;
        
        this.tasks[taskIndex].title = title;
        this.tasks[taskIndex].content = content;
        return true;
    }

    // 删除任务
    deleteTask(taskId) {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        return this.tasks.length !== initialLength;
    }

    // 移动任务到指定队列
    moveTaskToQueue(taskId, targetQueueId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return false;
        
        this.tasks[taskIndex].queueId = targetQueueId;
        return true;
    }

    // 获取任务
    getTask(taskId) {
        return this.tasks.find(t => t.id === taskId);
    }

    // 获取指定队列中的所有任务
    getTasksByQueueId(queueId) {
        return this.tasks.filter(task => task.queueId === queueId);
    }

    // 移动队列中的任务到另一个队列
    moveAllTasksFromQueueToQueue(sourceQueueId, targetQueueId) {
        this.tasks.forEach(task => {
            if (task.queueId === sourceQueueId) {
                task.queueId = targetQueueId;
            }
        });
    }

    // 获取导出数据
    getExportData() {
        return {
            tasks: this.tasks,
            taskIdCounter: this.taskIdCounter
        };
    }
}

export default TaskModel; 