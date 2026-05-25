// 匯入 Vuex store，sessionStore 保留原本呼叫介面，降低既有頁面重構成本。
import { store } from '../store';
import type { UserProfile } from '../types/loan';

// 匯出 session store facade，讓既有頁面不用一次全面改寫 Vuex commit/getter。
export const sessionStore = {
  // 以 getter 取得目前使用者資料。
  get user() {
    return store.getters.user as UserProfile | null;
  },
  // 登入、註冊或放款更新成功後，保存最新使用者資料。
  setUser(user: UserProfile) {
    store.commit('setUser', user);
  },
  // 登出時清空使用者資料。
  clear() {
    store.commit('clearUser');
  }
};
