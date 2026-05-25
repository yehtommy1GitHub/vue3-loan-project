<script setup lang="ts">
// 匯入 ref，保存登入表單輸入值與畫面訊息。
import { ref } from 'vue';
// 匯入 RouterLink 與 useRouter；RouterLink 負責註冊頁導覽，useRouter 負責登入成功後導頁。
import { RouterLink, useRouter } from 'vue-router';
// 匯入登入 API service。
import { login } from '../services/authApi';
// 匯入 session store，登入成功後保存使用者資料。
import { sessionStore } from '../stores/sessionStore';

const router = useRouter();
const account = ref('');
const password = ref('');
const message = ref('');
const isSubmitting = ref(false);

function validateCredentials() {
  if (!account.value || !password.value) {
    message.value = '帳密未輸入';
    return false;
  }

  if (account.value.length < 8 || password.value.length < 8) {
    message.value = '帳號及密碼長度需為 8 碼以上';
    return false;
  }

  return true;
}

async function submitLogin() {
  message.value = '';

  if (!validateCredentials()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const user = await login(account.value, password.value);
    sessionStore.setUser(user);
    await router.push({ name: 'home' });
  } catch (error) {
    message.value = error instanceof Error ? error.message : '登入失敗，請確認帳密';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-panel" aria-labelledby="login-title">
      <p class="eyebrow">Vue3發票登入平台</p>
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
            <RouterLink :to="{ name: 'register' }" custom v-slot="{ navigate }">
              <button class="secondary-button" type="button" @click="navigate">註冊</button>
            </RouterLink>
          </div>
          <button class="primary-button submit-action" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? '送出中...' : '送出' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
