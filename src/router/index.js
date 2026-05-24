// 匯入 Vue Router 建立路由器所需的 API。
import { createRouter, createWebHistory } from 'vue-router';
// 匯入簡易 session store，路由守衛會用它判斷是否已登入。
import { sessionStore } from '../stores/sessionStore';
// 匯入帳密登入頁。
import LoginView from '../views/LoginView.vue';
// 匯入使用者資訊首頁。
import HomeView from '../views/HomeView.vue';
// 匯入帳密註冊頁。
import RegisterView from '../views/RegisterView.vue';
// 匯入放款資訊更新頁。
import UpdateLoansView from '../views/UpdateLoansView.vue';
// 匯入當前匯率資訊頁。
import ExchangeRatesView from '../views/ExchangeRatesView.vue';

// 建立 Vue Router 實例。
const router = createRouter({
  // 使用 HTML5 history 模式，URL 較乾淨。
  history: createWebHistory(),
  // 定義本系統所有前端頁面路由。
  routes: [
    {
      // 根路徑顯示登入頁。
      path: '/',
      // 路由名稱，程式跳轉時使用。
      name: 'login',
      // 對應帳密登入元件。
      component: LoginView
    },
    {
      // 使用者資訊首頁路徑。
      path: '/home',
      // 路由名稱，登入成功後會跳到此頁。
      name: 'home',
      // 對應首頁元件。
      component: HomeView,
      // requiresAuth 代表進入此頁前必須已登入。
      meta: { requiresAuth: true }
    },
    {
      // 放款資訊更新頁路徑。
      path: '/loans',
      // 路由名稱，首頁按鈕會跳到此頁。
      name: 'updateLoans',
      // 對應放款資訊更新元件。
      component: UpdateLoansView,
      // 此頁必須有登入後的使用者資料。
      meta: { requiresAuth: true }
    },
    {
      // 當前匯率資訊頁路徑。
      path: '/exchange-rates',
      // 路由名稱，放款總額區的「當前匯率資訊」按鈕會跳到此頁。
      name: 'exchangeRates',
      // 對應匯率資訊元件。
      component: ExchangeRatesView,
      // 此頁屬於登入後輔助查詢頁，仍需登入後才能查看。
      meta: { requiresAuth: true }
    },
    {
      // 註冊頁路徑。
      path: '/register',
      // 路由名稱，登入頁註冊按鈕會跳到此頁。
      name: 'register',
      // 對應註冊元件。
      component: RegisterView
    }
  ]
});

// 註冊全域路由守衛。
router.beforeEach((to) => {
  // 若目標頁需要登入，但 sessionStore 沒有使用者資料，則導回登入頁。
  if (to.meta.requiresAuth && !sessionStore.user) {
    return { name: 'login' };
  }

  // 其他情境允許路由繼續前進。
  return true;
});

// 匯出 router，供 main.js 掛載到 Vue app。
export default router;
