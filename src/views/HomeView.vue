<script setup>
// 匯入 computed，讓首頁畫面可依 sessionStore 內容自動更新。
import { computed } from 'vue';
// 匯入 useRouter，處理登出與前往放款資訊更新頁。
import { useRouter } from 'vue-router';
// 匯入 sessionStore，取得目前登入使用者資料。
import { sessionStore } from '../stores/sessionStore';

// 建立 router 實例。
const router = useRouter();
// 建立金額格式化工具，顯示千分位逗點並保留最多 6 位小數。
const amountFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6
});
// 若尚未登入，提供空資料避免畫面讀取 undefined。
const user = computed(() => sessionStore.user ?? { account: '', userName: '', loans: [], loanChangeLogs: [] });
// 放款資訊陣列。
const loans = computed(() => (Array.isArray(user.value.loans) ? user.value.loans : []));
// 放款資訊異動紀錄陣列。
const loanChangeLogs = computed(() =>
  Array.isArray(user.value.loanChangeLogs) ? user.value.loanChangeLogs : []
);

// 格式化金額欄位。
function formatAmount(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return '';
  }

  return amountFormatter.format(numberValue);
}

// 將空值轉成畫面可讀的短橫線，避免表格看起來像漏資料。
function formatChangeValue(value) {
  if (value === '' || value === null || value === undefined) {
    return '-';
  }

  return value;
}

// 登出並回到登入頁。
function logout() {
  sessionStore.clear();
  router.push({ name: 'login' });
}

// 前往放款資訊更新頁。
function goUpdateLoans() {
  router.push({ name: 'updateLoans' });
}
</script>

<template>
  <main class="home-page">
    <section class="home-shell" aria-labelledby="home-title">
      <div class="home-header">
        <div>
          <p class="eyebrow">User Profile</p>
          <h1 id="home-title">使用者資訊首頁</h1>
        </div>
        <div class="left-actions">
          <button class="secondary-button" type="button" @click="goUpdateLoans">放款資訊更新</button>
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

      <h2 class="section-title">放款資訊</h2>
      <div class="table-wrap">
        <table class="loan-table">
          <thead>
            <tr>
              <th scope="col">序列</th>
              <th scope="col">放款帳號</th>
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

      <h2 class="section-title">放款資訊異動紀錄</h2>
      <div class="table-wrap">
        <table class="loan-table change-log-table">
          <thead>
            <tr>
              <th scope="col">序列</th>
              <th scope="col">異動時間</th>
              <th scope="col">異動者姓名</th>
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
                      <th scope="col">放款帳號</th>
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
