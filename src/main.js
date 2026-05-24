// 匯入 createApp，用來建立 Vue 應用程式實例。
import { createApp } from 'vue';
// 匯入根元件 App。
import App from './App.vue';
// 匯入路由設定，提供 login/register/home/updateLoans 頁面切換。
import router from './router';
// 匯入 Vuex store，讓所有頁面共用登入後使用者狀態。
import { store } from './store';
// 匯入 vue-next-select 預設樣式，讓幣別下拉元件正常呈現。
import 'vue-next-select/dist/index.css';
// 匯入專案共用樣式。
import './styles/main.css';

// 建立 Vue app，依序掛載 Vuex 與 Router，最後綁定到 index.html 的 #app。
createApp(App).use(store).use(router).mount('#app');
