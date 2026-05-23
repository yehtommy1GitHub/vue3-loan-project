<script setup>
// 匯入 ref，建立可被畫面雙向綁定的響應式資料。
import { ref } from 'vue';
// 匯入 useRouter，讓返回按鈕可導回首頁。
import { useRouter } from 'vue-router';
// 匯入放款資訊更新 API。
import { updateLoans } from '../services/authApi';
// 匯入登入狀態 store，取得目前使用者與既有放款資料。
import { sessionStore } from '../stores/sessionStore';

// 建立 router 實例。
const router = useRouter();
// 幣別下拉選單內容。
const currencyOptions = ['USD', 'TWD', 'JPY', 'SGD', 'EUR', 'GBP', 'AUD', 'CAD', 'CNY', 'HKD'];
// 金額顯示格式，最多保留小數點後 6 碼，並使用千分位逗點。
const amountFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6
});
// 畫面訊息，顯示驗證錯誤、API 錯誤或存檔成功。
const message = ref('');
// 存檔中狀態，用來防止重複按下存檔。
const isSaving = ref(false);

// 將 yyyymmdd 轉成 date input 可讀取的 yyyy-mm-dd。
function toDateInputValue(value) {
  if (!/^\d{8}$/.test(String(value ?? ''))) {
    return '';
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

// 將 date input 的 yyyy-mm-dd 轉成 API 使用的 yyyymmdd。
function fromDateInputValue(value) {
  return String(value ?? '').replaceAll('-', '');
}

// 將數字金額格式化成國際標準千分位格式。
function formatAmount(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return '';
  }

  return amountFormatter.format(numberValue);
}

// 將使用者輸入的金額字串轉成數字；空值維持空字串，才能讓必填檢核正確運作。
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

// 更新指定金額欄位。
function updateAmount(loan, field, value) {
  loan[field] = parseAmount(value);
}

// 複製 sessionStore 內的放款資料，既有資料加上 isPersisted 以鎖定放款帳號。
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

// 新增一筆空白放款資料，新增列的放款帳號可輸入，存檔後再次進入頁面就會被鎖定。
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

// 刪除指定列的放款資料；若要調整既有放款帳號，必須刪除後重新新增。
function removeLoan(index) {
  editableLoans.value.splice(index, 1);
}

// 回到使用者資訊首頁，不觸發存檔。
function backHome() {
  router.push({ name: 'home' });
}

// 存檔前檢核每一筆放款資料，確保必填與格式符合需求。
function validateLoans() {
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

    if (!/^\d{13,}$/.test(loanAccount)) {
      return `第 ${rowNumber} 筆放款帳號需為 13 碼以上數字`;
    }

    if (!Number.isFinite(Number(currentOutstandingAmount)) || !Number.isFinite(Number(nextPaymentAmount))) {
      return `第 ${rowNumber} 筆金額格式錯誤`;
    }

    if (!/^\d{8}$/.test(nextPaymentDate)) {
      return `第 ${rowNumber} 筆下期還款日期格式需為 yyyymmdd`;
    }
  }

  return '';
}

// 組成 API 上行資料，移除畫面專用 isPersisted 欄位。
function buildPayload() {
  return editableLoans.value.map((loan) => ({
    loanAccount: String(loan.loanAccount).trim(),
    currency: String(loan.currency).trim(),
    currentOutstandingAmount: Number(loan.currentOutstandingAmount),
    nextPaymentDate: String(loan.nextPaymentDate).trim(),
    nextPaymentAmount: Number(loan.nextPaymentAmount)
  }));
}

// 存檔放款資訊。
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

      <div class="table-wrap">
        <table class="loan-table editable-loan-table">
          <thead>
            <tr>
              <th scope="col">序列</th>
              <th scope="col">放款帳號</th>
              <th scope="col">幣別</th>
              <th scope="col">當前現欠金額</th>
              <th scope="col">下期還款日期</th>
              <th scope="col">下期還款金額</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(loan, index) in editableLoans" :key="index">
              <td>{{ index + 1 }}</td>
              <td>
                <input
                  v-model.trim="loan.loanAccount"
                  aria-label="放款帳號"
                  inputmode="numeric"
                  :disabled="loan.isPersisted"
                  :title="loan.isPersisted ? '既有放款帳號不可修改，請刪除後重新新增' : ''"
                />
              </td>
              <td>
                <select v-model="loan.currency" aria-label="幣別" class="currency-select">
                  <option value="">請選擇</option>
                  <option v-for="currency in currencyOptions" :key="currency" :value="currency">
                    {{ currency }}
                  </option>
                </select>
              </td>
              <td>
                <input
                  :value="formatAmount(loan.currentOutstandingAmount)"
                  aria-label="當前現欠金額"
                  inputmode="decimal"
                  @input="updateAmount(loan, 'currentOutstandingAmount', $event.target.value)"
                />
              </td>
              <td>
                <input
                  :value="toDateInputValue(loan.nextPaymentDate)"
                  aria-label="下期還款日期"
                  type="date"
                  @input="loan.nextPaymentDate = fromDateInputValue($event.target.value)"
                />
              </td>
              <td>
                <input
                  :value="formatAmount(loan.nextPaymentAmount)"
                  aria-label="下期還款金額"
                  inputmode="decimal"
                  @input="updateAmount(loan, 'nextPaymentAmount', $event.target.value)"
                />
              </td>
              <td>
                <button class="secondary-button compact-button" type="button" @click="removeLoan(index)">
                  刪除
                </button>
              </td>
            </tr>
            <tr v-if="editableLoans.length === 0">
              <td class="empty-table" colspan="7">目前沒有放款資料</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions">
        <div class="left-actions">
          <button class="secondary-button" type="button" @click="addLoan">新增</button>
        </div>
      </div>
    </section>
  </main>
</template>
