<script setup>
// 匯入 ref、computed、onMounted 與 reactive；reactive 用來集中管理總額折算狀態。
import { computed, onMounted, reactive, ref } from 'vue';
// 匯入 useRouter，返回首頁時進行程式化導頁。
import { useRouter } from 'vue-router';
// 匯入放款資訊更新與匯率 API。
import { fetchExchangeRates, updateLoans } from '../services/authApi';
// 匯入表格子元件，放款列的輸入控制由子元件透過 props/emit 處理。
import LoanRowsEditor from '../components/LoanRowsEditor.vue';
// 匯入總額摘要元件。
import LoanTotalsSummary from '../components/LoanTotalsSummary.vue';
// 匯入 sessionStore，讀取目前登入使用者與放款資料。
import { sessionStore } from '../stores/sessionStore';
// 匯入幣別清單、總額計算與金額格式化函式。
import { calculateLoanTotals, currencyOptions, formatAmount } from '../utils/currencyTotals';

const router = useRouter();
const message = ref('');
const isSaving = ref(false);
const totalState = reactive({
  targetCurrency: 'TWD',
  exchangeRates: {},
  isLoadingRates: false,
  rateMessage: ''
});

function toDateInputValue(value) {
  if (!/^\d{8}$/.test(String(value ?? ''))) {
    return '';
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function fromDateInputValue(value) {
  return String(value ?? '').replaceAll('-', '');
}

function parseAmount(value) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return '';
  }

  const normalizedValue = rawValue.replaceAll(',', '').replace(/[^\d.]/g, '');
  const [integerPart = '0', decimalPart = ''] = normalizedValue.split('.');
  const limitedDecimalPart = decimalPart.slice(0, 6);
  const amountText = limitedDecimalPart ? `${integerPart}.${limitedDecimalPart}` : integerPart;
  const amount = Number(amountText);

  return Number.isFinite(amount) ? amount : '';
}

// 放款帳號只允許 13 碼數字；輸入時先移除非數字，再截斷超過 13 碼的內容。
function normalizeLoanAccount(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 13);
}

const editableLoans = ref(
  (sessionStore.user?.loans ?? []).map((loan) => ({
    loanAccount: loan.loanAccount,
    currency: loan.currency,
    currentOutstandingAmount: loan.currentOutstandingAmount,
    nextPaymentDate: loan.nextPaymentDate,
    nextPaymentAmount: loan.nextPaymentAmount,
    isPersisted: true
  }))
);
const loanTotals = computed(() =>
  calculateLoanTotals(editableLoans.value, totalState.targetCurrency, totalState.exchangeRates)
);

onMounted(async () => {
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

function addLoan() {
  editableLoans.value.push({
    loanAccount: '',
    currency: '',
    currentOutstandingAmount: '',
    nextPaymentDate: '',
    nextPaymentAmount: '',
    isPersisted: false
  });
}

function removeLoan(index) {
  editableLoans.value.splice(index, 1);
}

function updateLoanField({ index, field, value }) {
  editableLoans.value[index][field] = field === 'loanAccount' ? normalizeLoanAccount(value) : value;
}

function updateAmount({ index, field, value }) {
  editableLoans.value[index][field] = parseAmount(value);
}

function backHome() {
  router.push({ name: 'home' });
}

function validateLoans() {
  const loanAccountSet = new Set();

  for (const [index, loan] of editableLoans.value.entries()) {
    const rowNumber = index + 1;
    const loanAccount = String(loan.loanAccount ?? '').trim();
    const currency = String(loan.currency ?? '').trim();
    const currentOutstandingAmount = loan.currentOutstandingAmount;
    const nextPaymentDate = String(loan.nextPaymentDate ?? '').trim();
    const nextPaymentAmount = loan.nextPaymentAmount;

    if (!loanAccount || !currency || currentOutstandingAmount === '' || currentOutstandingAmount === null) {
      return `第 ${rowNumber} 筆資料未完整輸入`;
    }

    if (!nextPaymentDate || nextPaymentAmount === '' || nextPaymentAmount === null) {
      return `第 ${rowNumber} 筆資料未完整輸入`;
    }

    if (!/^\d{13}$/.test(loanAccount)) {
      return `第 ${rowNumber} 筆放款帳號需為 13 碼數字`;
    }

    if (loanAccountSet.has(loanAccount)) {
      return `第 ${rowNumber} 筆放款帳號不可重複`;
    }

    loanAccountSet.add(loanAccount);

    if (!Number.isFinite(Number(currentOutstandingAmount)) || !Number.isFinite(Number(nextPaymentAmount))) {
      return `第 ${rowNumber} 筆金額格式錯誤`;
    }

    if (Number(currentOutstandingAmount) < Number(nextPaymentAmount)) {
      return `第 ${rowNumber} 筆當前現欠金額必須大於等於下期還款金額`;
    }

    if (!/^\d{8}$/.test(nextPaymentDate)) {
      return `第 ${rowNumber} 筆日期格式需為 yyyymmdd`;
    }
  }

  return '';
}

function buildPayload() {
  return editableLoans.value.map((loan) => ({
    loanAccount: String(loan.loanAccount).trim(),
    currency: String(loan.currency).trim(),
    currentOutstandingAmount: Number(loan.currentOutstandingAmount),
    nextPaymentDate: String(loan.nextPaymentDate).trim(),
    nextPaymentAmount: Number(loan.nextPaymentAmount)
  }));
}

async function saveLoans() {
  message.value = '';

  const validationMessage = validateLoans();

  if (validationMessage) {
    message.value = validationMessage;
    return;
  }

  isSaving.value = true;

  try {
    const user = await updateLoans(sessionStore.user.account, buildPayload());
    sessionStore.setUser(user);
    message.value = '存檔成功';
  } catch (error) {
    message.value = error.message || '存檔失敗';
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <main class="home-page">
    <section class="home-shell loan-editor-shell" aria-labelledby="loan-editor-title">
      <div class="home-header">
        <div>
          <p class="eyebrow">Loan Editor</p>
          <h1 id="loan-editor-title">放款資訊更新</h1>
        </div>
        <div class="left-actions">
          <button class="secondary-button" type="button" @click="backHome">返回</button>
          <button class="primary-button" type="button" :disabled="isSaving" @click="saveLoans">
            {{ isSaving ? '存檔中...' : '存檔' }}
          </button>
        </div>
      </div>

      <dl class="profile-summary">
        <div>
          <dt>使用者帳號</dt>
          <dd>{{ sessionStore.user.account }}</dd>
        </div>
        <div>
          <dt>使用者名稱</dt>
          <dd>{{ sessionStore.user.userName }}</dd>
        </div>
      </dl>

      <p v-if="message" class="message" role="status">{{ message }}</p>

      <LoanTotalsSummary
        v-model:target-currency="totalState.targetCurrency"
        :currency-options="currencyOptions"
        :totals="loanTotals"
        :is-loading="totalState.isLoadingRates"
        :message="totalState.rateMessage"
      />

      <LoanRowsEditor
        :loans="editableLoans"
        :currency-options="currencyOptions"
        :format-amount="formatAmount"
        :to-date-input-value="toDateInputValue"
        :from-date-input-value="fromDateInputValue"
        @add="addLoan"
        @remove="removeLoan"
        @update-field="updateLoanField"
        @update-amount="updateAmount"
      />
    </section>
  </main>
</template>
