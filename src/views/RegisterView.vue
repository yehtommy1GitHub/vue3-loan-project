<script setup>
// 匯入 onUnmounted 清理計時器，匯入 ref 建立表單狀態。
import { onUnmounted, ref } from 'vue';
// 匯入 useRouter，讓註冊頁可以導頁。
import { useRouter } from 'vue-router';
// 匯入註冊 API service。
import { register } from '../services/authApi';
// 匯入 session store，註冊成功後保存使用者資料。
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
// 訊息自動消失用的 timer id。
let messageTimer = null;

// 清除目前的訊息 timer。
function clearMessageTimer() {
  // 若 timer 存在，先取消避免重複計時。
  if (messageTimer) {
    window.clearTimeout(messageTimer);
    messageTimer = null;
  }
}

// 顯示訊息，必要時 5 秒後自動清除。
function showMessage(text, shouldAutoHide = false) {
  // 顯示新訊息前先清掉舊 timer。
  clearMessageTimer();
  // 設定畫面訊息文字。
  message.value = text;

  // 若需要自動消失，建立 5 秒 timer。
  if (shouldAutoHide) {
    messageTimer = window.setTimeout(() => {
      message.value = '';
      messageTimer = null;
    }, 5000);
  }
}

// 註冊前端檢核：先檢查空值，再檢查帳號與密碼長度。
function validateCredentials() {
  // 帳號或密碼任一未輸入時，不送 API。
  if (!account.value || !password.value) {
    showMessage('帳密未輸入');
    return false;
  }

  // 帳號與密碼皆需至少 8 碼，通過後才允許送 JSON 電文。
  if (account.value.length < 8 || password.value.length < 8) {
    showMessage('帳號及密碼長度需為 8 碼以上', true);
    return false;
  }

  // 通過所有前端檢核。
  return true;
}

// 註冊送出事件。
async function submitRegister() {
  // 每次送出前先清空舊訊息。
  message.value = '';

  // 前端檢核未通過時直接中止，不呼叫 API。
  if (!validateCredentials()) {
    return;
  }

  // 進入送出中狀態。
  isSubmitting.value = true;

  try {
    // 呼叫註冊 API，送出 account/password JSON。
    const user = await register(account.value, password.value);
    // 註冊成功後保存使用者資料。
    sessionStore.setUser(user);
    // 導向使用者資訊首頁。
    await router.push({ name: 'home' });
  } catch (error) {
    // 顯示後端錯誤或註冊失敗訊息。
    showMessage(error.message || '連線失敗或註冊失敗');
  } finally {
    // 無論成功或失敗，都結束送出中狀態。
    isSubmitting.value = false;
  }
}

// 清除表單欄位與提示訊息。
function clearForm() {
  // 清空帳號。
  account.value = '';
  // 清空密碼。
  password.value = '';
  // 清空訊息。
  message.value = '';
  // 清掉可能存在的自動消失 timer。
  clearMessageTimer();
}

// 返回登入頁。
function goLogin() {
  // 使用命名路由避免硬編碼 URL。
  router.push({ name: 'login' });
}

// 元件卸載時清理 timer，避免記憶體洩漏。
onUnmounted(() => {
  clearMessageTimer();
});
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel" aria-labelledby="register-title">
      <p class="eyebrow">Create Account</p>
      <h1 id="register-title">帳密註冊</h1>

      <form class="form" @submit.prevent="submitRegister">
        <label class="field">
          <span>帳號</span>
          <input v-model.trim="account" name="account" type="text" autocomplete="username" />
        </label>

        <label class="field">
          <span>密碼</span>
          <input v-model="password" name="password" type="password" autocomplete="new-password" />
        </label>

        <p v-if="message" class="message" role="alert">{{ message }}</p>

        <div class="actions">
          <div class="left-actions">
            <button class="secondary-button" type="button" @click="clearForm">清除</button>
            <button class="secondary-button" type="button" @click="goLogin">返回登入</button>
          </div>
          <button class="primary-button submit-action" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? '送出中...' : '送出' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
