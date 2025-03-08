// 主应用类 - 协调所有模块工作

import TaskModel from './models/TaskModel.js';
import QueueModel from './models/QueueModel.js';
import StorageService from './storage/StorageService.js';
import UIManager from './ui/UIManager.js';
import DragDropManager from './utils/DragDropManager.js';
import ShortcutManager from './utils/ShortcutManager.js';

class App {
    constructor() {
        // 初始化模型
        this.taskModel = new TaskModel();
        this.queueModel = new QueueModel();
        this.storageService = new StorageService();
        
        // 加载数据
        this.loadData();
        
        // 初始化UI
        this.uiManager = new UIManager(this);
        
        // 初始化工具
        this.dragDropManager = new DragDropManager(this);
        this.shortcutManager = new ShortcutManager(this);
        
        // 渲染初始UI
        this.renderUI();
    }
    
    // 加载数据
    loadData() {
        const data = this.storageService.loadData();
        if (data) {
            this.taskModel.loadFromData(data);
            this.queueModel.loadFromData(data);
        } else {
            // 如果没有数据，初始化默认队列
            this.queueModel.createDefaultQueues();
        }
    }
    
    // 保存数据
    saveData() {
        const data = {
            tasks: this.taskModel.tasks,
            queues: this.queueModel.queues,
            counters: {
                task: this.taskModel.taskIdCounter,
                queue: this.queueModel.queueIdCounter
            }
        };
        
        const result = this.storageService.saveData(data);
        if (result) {
            this.uiManager.showSaveNotification();
        }
        
        return result;
    }
    
    // 渲染UI
    renderUI() {
        this.uiManager.renderQueues(
            this.queueModel.getAllQueues(),
            this.taskModel.tasks
        );
    }
    
    // 添加任务
    addTask(title, content = '') {
        const highestPriorityQueueId = this.queueModel.getHighestPriorityQueueId();
        if (!highestPriorityQueueId) {
            alert('请先添加至少一个队列！');
            return false;
        }
        
        this.taskModel.createTask(title, content, highestPriorityQueueId);
        this.saveData();
        this.renderUI();
        return true;
    }
    
    // 添加队列
    addQueue() {
        this.queueModel.addQueue();
        this.saveData();
        this.renderUI();
    }
    
    // 移除队列
    removeQueue() {
        const result = this.queueModel.removeLastQueue();
        if (!result) {
            alert('至少保留一个队列！');
            return false;
        }
        
        this.taskModel.moveAllTasksFromQueueToQueue(
            result.removedQueue.id,
            result.previousQueueId
        );
        
        this.saveData();
        this.renderUI();
        return true;
    }
    
    // 更新队列名称
    updateQueueName(queueId, newName) {
        const success = this.queueModel.updateQueueName(queueId, newName);
        if (success) {
            this.saveData();
        }
        return success;
    }
    
    // 更新任务
    updateTask(taskId, title, content) {
        const success = this.taskModel.updateTask(taskId, title, content);
        if (success) {
            this.saveData();
            this.renderUI();
        }
        return success;
    }
    
    // 删除任务
    deleteTask(taskId) {
        const success = this.taskModel.deleteTask(taskId);
        if (success) {
            this.saveData();
            this.renderUI();
        }
        return success;
    }
    
    // 移动任务到队列
    moveTaskToQueue(taskId, targetQueueId) {
        const success = this.taskModel.moveTaskToQueue(taskId, targetQueueId);
        if (success) {
            this.saveData();
            this.renderUI();
        }
        return success;
    }
    
    // 获取任务
    getTask(taskId) {
        return this.taskModel.getTask(taskId);
    }
    
    // 获取队列
    getQueue(queueId) {
        return this.queueModel.getQueue(queueId);
    }
    
    // 获取所有队列
    getAllQueues() {
        return this.queueModel.getAllQueues();
    }
}

export default App; 