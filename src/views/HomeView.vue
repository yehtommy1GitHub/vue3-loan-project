<script setup lang="ts">
// 匯入 computed、onMounted 與 reactive；computed 整理畫面資料，reactive 管理總額折算狀態。
import { computed, onMounted, reactive } from 'vue';
// 匯入 RouterLink 與 useRouter；RouterLink 用於頁面導覽，useRouter 用於登出後導回登入頁。
import { RouterLink, useRouter } from 'vue-router';
// 匯入使用者查詢與匯率 API，首頁載入時同步最新放款、異動紀錄與折算匯率。
import { fetchExchangeRates, fetchUser } from '../services/authApi';
// 匯入總額摘要元件。
import LoanTotalsSummary from '../components/LoanTotalsSummary.vue';
// 匯入 sessionStore，讀取與更新登入後使用者狀態。
import { sessionStore } from '../stores/sessionStore';
// 匯入幣別清單、總額計算與金額格式化函式。
import { calculateLoanTotals, currencyOptions, formatAmount } from '../utils/currencyTotals';
import type { UserProfile } from '../types/loan';

const router = useRouter();
const totalState = reactive({
  targetCurrency: 'TWD',
  exchangeRates: {} as Record<string, number>,
  isLoadingRates: false,
  rateMessage: ''
});

const emptyUser: UserProfile = { account: '', userName: '', loans: [], loanChangeLogs: [] };
const user = computed(() => sessionStore.user ?? emptyUser);
const loans = computed(() => (Array.isArray(user.value.loans) ? user.value.loans : []));
const loanChangeLogs = computed(() =>
  Array.isArray(user.value.loanChangeLogs) ? user.value.loanChangeLogs : []
);
const loanTotals = computed(() =>
  calculateLoanTotals(loans.value, totalState.targetCurrency, totalState.exchangeRates)
);

// 首頁載入後以 account 再向 API 取最新資料；若 API 暫時失敗，保留既有 session 畫面。
onMounted(async () => {
  if (!sessionStore.user?.account) {
    return;
  }

  const account = sessionStore.user.account;

  try {
    const latestUser = await fetchUser(account);

    if (sessionStore.user?.account === account) {
      sessionStore.setUser(latestUser);
    }
  } catch {
    // 首頁不是強制刷新頁，短暫連線失敗時不清空既有登入資料。
  }

  totalState.isLoadingRates = true;
  totalState.rateMessage = '';

  try {
    const exchangeRateData = await fetchExchangeRates();
    totalState.exchangeRates = exchangeRateData.rates;
  } catch {
    totalState.rateMessage = '匯率讀取失敗，暫時無法折算總金額';
  } finally {
    totalState.isLoadingRates = false;
  }
});

function formatChangeValue(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return '-';
  }

  return value;
}

function logout() {
  sessionStore.clear();
  void router.push({ name: 'login' });
}
</script>

<template>
  <main class="home-page">
    <section class="home-shell" aria-labelledby="home-title">
      <div class="home-header">
        <div>
          <h1 id="home-title">使用者資訊</h1>
        </div>
        <div class="left-actions">
          <RouterLink :to="{ name: 'updateLoans' }" custom v-slot="{ navigate }">
            <button class="secondary-button" type="button" @click="navigate">發票放款資訊更新</button>
          </RouterLink>
          <button class="secondary-button" type="button" @click="logout">退出</button>
        </div>
      </div>

      <dl class="profile-summary">
        <div>
          <dt>使用者帳號</dt>
          <dd>{{ user.account }}</dd>
        </div>
        <div>
          <dt>使用者名稱</dt>
          <dd>{{ user.userName }}</dd>
        </div>
      </dl>

      <LoanTotalsSummary
        v-model:target-currency="totalState.targetCurrency"
        :currency-options="currencyOptions"
        :totals="loanTotals"
        :is-loading="totalState.isLoadingRates"
        :message="totalState.rateMessage"
      />

      <h2 class="section-title">發票放款資訊</h2>

      <div class="table-wrap">
        <table class="loan-table">
          <thead>
            <tr>
              <th scope="col">序列</th>
              <th scope="col">發票號碼</th>
              <th scope="col">幣別</th>
              <th scope="col">當前現欠金額</th>
              <th scope="col">下期還款日期</th>
              <th scope="col">下期還款金額</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(loan, index) in loans" :key="`${loan.loanAccount}-${index}`">
              <td>{{ index + 1 }}</td>
              <td>{{ loan.loanAccount }}</td>
              <td>{{ loan.currency }}</td>
              <td>{{ formatAmount(loan.currentOutstandingAmount) }}</td>
              <td>{{ loan.nextPaymentDate }}</td>
              <td>{{ formatAmount(loan.nextPaymentAmount) }}</td>
            </tr>
            <tr v-if="loans.length === 0">
              <td class="empty-table" colspan="6">目前沒有放款資料</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">發票放款資訊異動紀錄</h2>
      <div class="table-wrap">
        <table class="loan-table change-log-table">
          <thead>
            <tr>
              <th scope="col">序列</th>
              <th scope="col">異動時間</th>
              <th scope="col">異動人員</th>
              <th scope="col">異動項目</th>
              <th scope="col">異動資料</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, index) in loanChangeLogs" :key="`${log.changedAt}-${index}`">
              <td>{{ index + 1 }}</td>
              <td>{{ log.changedAt }}</td>
              <td>{{ log.changedBy }}</td>
              <td>{{ log.changeItem }}</td>
              <td>
                <table class="change-detail-table">
                  <thead>
                    <tr>
                      <th scope="col">發票號碼</th>
                      <th scope="col">欄位</th>
                      <th scope="col">修改前</th>
                      <th scope="col">修改後</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, itemIndex) in log.changeData" :key="`${item.field}-${itemIndex}`">
                      <td>{{ item.loanAccount }}</td>
                      <td>{{ item.fieldName }}</td>
                      <td>{{ formatChangeValue(item.oldValue) }}</td>
                      <td>{{ formatChangeValue(item.newValue) }}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr v-if="loanChangeLogs.length === 0">
              <td class="empty-table" colspan="5">目前沒有異動紀錄</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

