// 匯入 createApp，用來建立 Vue 應用程式實例。
import { createApp } from 'vue';
// 匯入根元件 App。
import App from './App.vue';
// 匯入前端路由設定。
import router from './router';
// 匯入全站樣式。
import './styles/main.css';

// 建立 Vue app，掛載 router，並渲染到 index.html 的 #app。
createApp(App).use(router).mount('#app');
