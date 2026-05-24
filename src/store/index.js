// 匯入 Vuex 的 createStore，建立專案級集中狀態管理容器。
import { createStore } from 'vuex';

// 建立全域 store；目前先集中管理登入後的使用者資料，未來功能變多時可再拆 module。
export const store = createStore({
  // state 使用函式回傳，避免測試或多實例環境共用同一份初始物件。
  state() {
    return {
      // user 為 null 代表尚未登入；登入、註冊、更新放款後會寫入完整使用者資料。
      user: null
    };
  },
  getters: {
    // 提供一致的讀取入口，讓畫面不直接碰 state 結構。
    user: (state) => state.user
  },
  mutations: {
    // 寫入登入後使用者資訊。
    setUser(state, user) {
      state.user = user;
    },
    // 登出時清空 session。
    clearUser(state) {
      state.user = null;
    }
  }
});
