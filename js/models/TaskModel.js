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
            
            // 确保每个任务都有order字段
            this.tasks.forEach((task, index) => {
                if (task.order === undefined) {
                    task.order = index;
                }
            });
        }
        
        if (data && data.counters && data.counters.task !== undefined) {
            this.taskIdCounter = data.counters.task;
        }
    }

    // 创建新任务
    createTask(title, content = '', queueId) {
        // 计算在目标队列中的最大order值
        const tasksInQueue = this.getTasksByQueueId(queueId);
        const maxOrder = tasksInQueue.length > 0 
            ? Math.max(...tasksInQueue.map(t => t.order || 0)) + 1 
            : 0;
        
        const task = {
            id: 'task-' + this.taskIdCounter++,
            title: title,
            content: content,
            queueId: queueId,
            order: maxOrder // 新任务添加到末尾
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
        const taskToDelete = this.getTask(taskId);
        
        if (taskToDelete) {
            // 获取被删除任务的队列和顺序
            const queueId = taskToDelete.queueId;
            const orderToDelete = taskToDelete.order;
            
            // 过滤掉要删除的任务
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            
            // 调整同一队列中其他任务的顺序
            this.tasks.forEach(task => {
                if (String(task.queueId) === String(queueId) && task.order > orderToDelete) {
                    task.order--;
                }
            });
        }
        
        return this.tasks.length !== initialLength;
    }

    // 移动任务到指定队列
    moveTaskToQueue(taskId, targetQueueId) {
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return false;
        
        const task = this.tasks[taskIndex];
        const sourceQueueId = task.queueId;
        
        // 如果是移动到同一队列，不做任何改变
        if (String(sourceQueueId) === String(targetQueueId)) {
            return true;
        }
        
        // 获取目标队列中的最大order值
        const tasksInTargetQueue = this.getTasksByQueueId(targetQueueId);
        const maxOrder = tasksInTargetQueue.length > 0 
            ? Math.max(...tasksInTargetQueue.map(t => t.order || 0)) + 1 
            : 0;
        
        // 调整原队列中其他任务的顺序
        this.tasks.forEach(t => {
            if (String(t.queueId) === String(sourceQueueId) && t.order > task.order) {
                t.order--;
            }
        });
        
        // 更新任务的队列ID和顺序
        task.queueId = targetQueueId;
        task.order = maxOrder;
        
        return true;
    }

    // 重新排序队列中的任务
    reorderTask(taskId, targetQueueId, newOrder) {
        const task = this.getTask(taskId);
        if (!task) return false;
        
        const oldQueueId = task.queueId;
        const oldOrder = task.order;
        
        // 如果移动到不同队列，先处理队列移动
        if (String(oldQueueId) !== String(targetQueueId)) {
            this.moveTaskToQueue(taskId, targetQueueId);
            return true;
        }
        
        // 同一队列内移动
        if (oldOrder === newOrder) return true; // 位置没变，无需调整
        
        // 调整同队列内其他任务的顺序
        if (oldOrder < newOrder) {
            // 向下移动：降低中间任务的顺序
            this.tasks.forEach(t => {
                if (String(t.queueId) === String(targetQueueId) && 
                    t.order > oldOrder && t.order <= newOrder) {
                    t.order--;
                }
            });
        } else {
            // 向上移动：提高中间任务的顺序
            this.tasks.forEach(t => {
                if (String(t.queueId) === String(targetQueueId) && 
                    t.order >= newOrder && t.order < oldOrder) {
                    t.order++;
                }
            });
        }
        
        // 设置任务的新顺序
        task.order = newOrder;
        return true;
    }

    // 获取任务
    getTask(taskId) {
        return this.tasks.find(t => t.id === taskId);
    }

    // 获取指定队列中的所有任务，并按顺序排序
    getTasksByQueueId(queueId) {
        const tasks = this.tasks.filter(task => String(task.queueId) === String(queueId));
        // 按order字段排序
        return tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // 移动队列中的任务到另一个队列
    moveAllTasksFromQueueToQueue(sourceQueueId, targetQueueId) {
        // 获取目标队列中的任务数量
        const tasksInTargetQueue = this.getTasksByQueueId(targetQueueId);
        let nextOrder = tasksInTargetQueue.length;
        
        // 找出所有需要移动的任务
        const tasksToMove = this.tasks.filter(task => 
            String(task.queueId) === String(sourceQueueId)
        );
        
        // 更新这些任务的队列和顺序
        tasksToMove.forEach(task => {
            task.queueId = targetQueueId;
            task.order = nextOrder++;
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