<script setup>
// 匯入 vue-next-select，讓總額摘要旁的折算幣別與放款列幣別一致。
import VueNextSelect from 'vue-next-select';
// 匯入 RouterLink，讓使用者可從總額區直接查看目前本位幣的匯率明細。
import { RouterLink } from 'vue-router';
// 匯入共用金額格式化函式。
import { formatAmount } from '../utils/currencyTotals';

defineProps({
  targetCurrency: {
    type: String,
    required: true
  },
  currencyOptions: {
    type: Array,
    required: true
  },
  totals: {
    type: Object,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
});

// 父層使用 reactive 保存 targetCurrency，子元件透過 emit 回寫選擇結果。
const emit = defineEmits(['update:targetCurrency']);
</script>

<template>
  <section class="loan-total-summary" aria-label="放款總額摘要">
    <div class="loan-total-header">
      <h2 class="section-title">放款總額</h2>
      <label class="summary-currency-field">
        <span>折算幣別</span>
        <span class="summary-currency-actions">
          <VueNextSelect
            class="currency-select summary-currency-select"
            role="combobox"
            aria-label="折算幣別"
            :model-value="targetCurrency"
            :options="currencyOptions"
            placeholder="請選擇"
            search-placeholder="搜尋幣別"
            @update:model-value="emit('update:targetCurrency', $event)"
          />
          <RouterLink
            :to="{ name: 'exchangeRates', query: { baseCurrency: targetCurrency } }"
            class="rate-info-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            當前匯率資訊
          </RouterLink>
        </span>
      </label>
    </div>

    <dl class="total-summary-grid">
      <div>
        <dt>總現欠金額</dt>
        <dd>{{ formatAmount(totals.currentOutstandingAmount) }} {{ targetCurrency }}</dd>
      </div>
      <div>
        <dt>下期總還款金額</dt>
        <dd>{{ formatAmount(totals.nextPaymentAmount) }} {{ targetCurrency }}</dd>
      </div>
    </dl>

    <p v-if="isLoading" class="hint">匯率讀取中...</p>
    <p v-if="message" class="message" role="status">{{ message }}</p>
  </section>
</template>
