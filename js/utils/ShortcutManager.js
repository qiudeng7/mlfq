// 快捷键管理器 - 处理键盘快捷键

class ShortcutManager {
    constructor(app) {
        this.app = app;
        this.initShortcuts();
    }
    
    // 初始化快捷键
    initShortcuts() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    // 处理键盘事件
    handleKeyDown(event) {
        // Ctrl+S (Windows) 或 Command+S (Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault(); // 阻止默认的保存网页行为
            this.app.saveData();
        }
    }
}

export default ShortcutManager; 