// 匯入 reactive，建立跨元件可共用的響應式狀態。
import { reactive } from 'vue';

// 定義登入階段會使用的 session 狀態。
const state = reactive({
  // user 為目前登入使用者；未登入時為 null。
  user: null
});

// 匯出簡易 session store，讓頁面與路由守衛共用。
export const sessionStore = {
  // 以 getter 暴露目前使用者資料。
  get user() {
    return state.user;
  },
  // 登入、註冊或放款更新成功後，使用此方法覆蓋使用者資料。
  setUser(user) {
    state.user = user;
  },
  // 登出時清空使用者資料。
  clear() {
    state.user = null;
  }
};
