// 队列模型类 - 负责管理所有队列相关的逻辑

class QueueModel {
    constructor() {
        this.queues = [];
        this.queueIdCounter = 0;
    }

    // 从存储中加载队列
    loadFromData(data) {
        if (data && data.queues) {
            this.queues = data.queues;
        }
        
        if (data && data.counters && data.counters.queue !== undefined) {
            this.queueIdCounter = data.counters.queue;
        }
        
        // 如果没有队列，创建默认队列
        if (this.queues.length === 0) {
            this.createDefaultQueues();
        }
    }

    // 创建默认队列
    createDefaultQueues() {
        this.queues = [
            { id: this.queueIdCounter++, name: '高优先级队列' },
            { id: this.queueIdCounter++, name: '中优先级队列' },
            { id: this.queueIdCounter++, name: '低优先级队列' }
        ];
    }

    // 添加新队列
    addQueue() {
        const newQueueId = this.queueIdCounter++;
        
        const newQueue = {
            id: newQueueId,
            name: `队列 ${this.queues.length + 1}`
        };
        
        this.queues.push(newQueue);
        return newQueue;
    }

    // 移除最后一个队列
    removeLastQueue() {
        if (this.queues.length <= 1) {
            return null;
        }
        
        const lastQueue = this.queues.pop();
        return {
            removedQueue: lastQueue,
            previousQueueId: this.queues[this.queues.length - 1].id
        };
    }

    // 获取队列
    getQueue(queueId) {
        return this.queues.find(q => String(q.id) === String(queueId));
    }

    // 更新队列名称
    updateQueueName(queueId, newName) {
        const queue = this.getQueue(queueId);
        if (!queue) return false;
        
        queue.name = newName;
        return true;
    }

    // 获取最高优先级队列ID
    getHighestPriorityQueueId() {
        if (this.queues.length === 0) return null;
        return this.queues[0].id;
    }

    // 判断队列是否存在
    hasQueue(queueId) {
        return this.queues.some(q => String(q.id) === String(queueId));
    }

    // 获取所有队列
    getAllQueues() {
        return [...this.queues];
    }

    // 获取导出数据
    getExportData() {
        return {
            queues: this.queues,
            queueIdCounter: this.queueIdCounter
        };
    }
}

export default QueueModel; 