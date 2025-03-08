// 主入口文件 - 初始化应用

import App from './App.js';

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 创建并启动应用
    window.app = new App();
}); 