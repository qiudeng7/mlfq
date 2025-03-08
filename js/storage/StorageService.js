// 存储服务 - 处理本地存储相关操作

class StorageService {
    constructor(storageKey = 'mlfqTaskManager') {
        this.storageKey = storageKey;
    }
    
    // 保存数据到本地存储
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据到localStorage时出错:', error);
            return false;
        }
    }
    
    // 从本地存储加载数据
    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                return JSON.parse(savedData);
            }
            return null;
        } catch (error) {
            console.error('从localStorage加载数据时出错:', error);
            return null;
        }
    }
    
    // 清除存储数据
    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('清除localStorage数据时出错:', error);
            return false;
        }
    }
}

export default StorageService; 