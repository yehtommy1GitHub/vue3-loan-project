<script setup lang="ts">
// 匯入 onUnmounted 清理提示訊息 timer。
import { onUnmounted, ref } from 'vue';
// 匯入 vee-validate，集中管理註冊表單欄位與驗證流程。
import { useField, useForm } from 'vee-validate';
// 匯入 router-link 與 useRouter；RouterLink 用於返回登入，useRouter 用於註冊成功後導頁。
import { RouterLink, useRouter } from 'vue-router';
// 匯入共用表單欄位元件，示範 props 與 emit 的實務用法。
import FormField from '../components/FormField.vue';
// 匯入註冊 API service。
import { register } from '../services/authApi';
// 匯入 session store，註冊成功後保存使用者資料。
import { sessionStore } from '../stores/sessionStore';

const router = useRouter();
const message = ref('');
const isSubmitting = ref(false);
let messageTimer: number | null = null;

// 建立 vee-validate 表單，初始欄位與畫面 v-model 對應。
const { handleSubmit, resetForm } = useForm({
  initialValues: {
    account: '',
    userName: '',
    password: ''
  }
});

// 帳號欄位驗證：必填且至少 8 碼。
const { value: account } = useField<string>('account', (value) => {
  const text = String(value ?? '').trim();

  if (!text) {
    return '帳密未輸入';
  }

  return text.length >= 8 ? true : '帳號及密碼長度需為 8 碼以上';
});

// 使用者名稱欄位驗證：至少 2 個字，避免新增帳號時出現預設名稱。
const { value: userName } = useField<string>('userName', (value) => {
  return String(value ?? '').trim().length >= 2 ? true : '使用者名稱必須大於2長';
});

// 密碼欄位驗證：必填且至少 8 碼。
const { value: password } = useField<string>('password', (value) => {
  const text = String(value ?? '');

  if (!text) {
    return '帳密未輸入';
  }

  return text.length >= 8 ? true : '帳號及密碼長度需為 8 碼以上';
});

function clearMessageTimer() {
  if (messageTimer) {
    window.clearTimeout(messageTimer);
    messageTimer = null;
  }
}

function showMessage(text: string, shouldAutoHide = false) {
  clearMessageTimer();
  message.value = text;

  if (shouldAutoHide) {
    messageTimer = window.setTimeout(() => {
      message.value = '';
      messageTimer = null;
    }, 5000);
  }
}

// handleSubmit 會先執行 vee-validate 規則；驗證成功才會呼叫 API。
const submitRegister = handleSubmit(
  async () => {
    message.value = '';
    isSubmitting.value = true;

    try {
      const normalizedAccount = String(account.value).trim();
      const normalizedUserName = String(userName.value).trim();
      const user = await register(normalizedAccount, String(password.value), normalizedUserName);

      sessionStore.setUser(user);
      await router.push({ name: 'home' });
    } catch (error) {
      showMessage(error instanceof Error ? error.message : '註冊失敗，請稍後再試');
    } finally {
      isSubmitting.value = false;
    }
  },
  ({ errors }) => {
    const firstMessage = errors.account || errors.userName || errors.password || '表單資料有誤';
    showMessage(firstMessage, firstMessage === '帳號及密碼長度需為 8 碼以上');
  }
);

function clearForm() {
  resetForm();
  message.value = '';
  clearMessageTimer();
}

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
        <FormField v-model="account" label="帳號" name="account" autocomplete="username" />
        <FormField v-model="userName" label="使用者名稱" name="userName" autocomplete="name" />
        <FormField
          v-model="password"
          label="密碼"
          name="password"
          type="password"
          autocomplete="new-password"
        />

        <p v-if="message" class="message" role="alert">{{ message }}</p>

        <div class="actions">
          <div class="left-actions">
            <button class="secondary-button" type="button" @click="clearForm">清除</button>
            <RouterLink :to="{ name: 'login' }" custom v-slot="{ navigate }">
              <button class="secondary-button" type="button" @click="navigate">返回</button>
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
