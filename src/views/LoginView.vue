<script setup>
// 匯入 ref，建立表單欄位與訊息的響應式狀態。
import { ref } from 'vue';
// 匯入 useRouter，讓登入頁可以導頁到首頁或註冊頁。
import { useRouter } from 'vue-router';
// 匯入登入 API service。
import { login } from '../services/authApi';
// 匯入 session store，登入成功後保存使用者資料。
import { sessionStore } from '../stores/sessionStore';

// 建立 router 實例。
const router = useRouter();
// 帳號輸入值。
const account = ref('');
// 密碼輸入值。
const password = ref('');
// 畫面錯誤或提示訊息。
const message = ref('');
// 送出中狀態，用來避免重複送出。
const isSubmitting = ref(false);

// 登入前端檢核：先檢查空值，再檢查帳號與密碼長度。
function validateCredentials() {
  // 帳號或密碼任一未輸入時，不送 API。
  if (!account.value || !password.value) {
    message.value = '帳密未輸入';
    return false;
  }

  // 帳號與密碼皆需至少 8 碼，通過後才允許送 JSON 電文。
  if (account.value.length < 8 || password.value.length < 8) {
    message.value = '帳號及密碼長度需為 8 碼以上';
    return false;
  }

  // 通過所有前端檢核。
  return true;
}

// 登入送出事件。
async function submitLogin() {
  // 每次送出前先清空舊訊息。
  message.value = '';

  // 前端檢核未通過時直接中止，不呼叫 API。
  if (!validateCredentials()) {
    return;
  }

  // 進入送出中狀態。
  isSubmitting.value = true;

  try {
    // 呼叫登入 API，送出 account/password JSON。
    const user = await login(account.value, password.value);
    // 登入成功後保存使用者資料。
    sessionStore.setUser(user);
    // 導向使用者資訊首頁。
    await router.push({ name: 'home' });
  } catch (error) {
    // 顯示後端錯誤或連線失敗訊息。
    message.value = error.message || '連線失敗或帳密錯誤';
  } finally {
    // 無論成功或失敗，都結束送出中狀態。
    isSubmitting.value = false;
  }
}

// 跳轉到帳密註冊頁。
function goRegister() {
  // 使用命名路由避免硬編碼 URL。
  router.push({ name: 'register' });
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel" aria-labelledby="login-title">
      <p class="eyebrow">Vue3 Account</p>
      <h1 id="login-title">帳密登入</h1>

      <form class="form" @submit.prevent="submitLogin">
        <label class="field">
          <span>帳號</span>
          <input v-model.trim="account" name="account" type="text" autocomplete="username" />
        </label>

        <label class="field">
          <span>密碼</span>
          <input v-model="password" name="password" type="password" autocomplete="current-password" />
        </label>

        <p v-if="message" class="message" role="alert">{{ message }}</p>

        <div class="actions">
          <div class="left-actions">
            <button class="secondary-button" type="button" @click="goRegister">註冊</button>
          </div>
          <button class="primary-button submit-action" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? '送出中...' : '送出' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
