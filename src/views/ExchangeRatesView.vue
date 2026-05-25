<script setup lang="ts">
// 匯入 computed、onMounted 與 reactive；本頁用 reactive 集中管理本位幣、匯率資料與載入狀態。
import { computed, onMounted, reactive, watch } from 'vue';
// 匯入 RouterLink、useRoute 與 useRouter，支援從總額區帶入目前選擇的本位幣。
import { RouterLink, useRoute, useRouter } from 'vue-router';
// 匯入 vue-next-select，讓本位幣選擇體驗與發票放款總額區一致。
import VueNextSelect from 'vue-next-select';
// 匯入 mock 匯率 API。
import { fetchExchangeRates } from '../services/authApi';
// 匯入幣別清單、匯率比值列與金額格式化工具。
import { buildExchangeRateRows, currencyOptions, formatAmount } from '../utils/currencyTotals';

const route = useRoute();
const router = useRouter();

function normalizeBaseCurrency(value: unknown) {
  const candidate = String(value ?? '').toUpperCase();

  return currencyOptions.includes(candidate) ? candidate : 'TWD';
}

const rateState = reactive({
  baseCurrency: normalizeBaseCurrency(route.query.baseCurrency),
  updatedAt: '',
  rates: {} as Record<string, number>,
  isLoading: false,
  message: ''
});

const exchangeRateRows = computed(() =>
  buildExchangeRateRows(rateState.baseCurrency, rateState.rates, currencyOptions)
);

// 本位幣切換時同步網址 query，方便使用者分享或重新整理後維持目前匯率視角。
watch(
  () => rateState.baseCurrency,
  (baseCurrency) => {
    router.replace({ name: 'exchangeRates', query: { baseCurrency } });
  }
);

onMounted(async () => {
  rateState.isLoading = true;
  rateState.message = '';

  try {
    const exchangeRateData = await fetchExchangeRates();
    rateState.updatedAt = exchangeRateData.updatedAt;
    rateState.rates = exchangeRateData.rates;
  } catch {
    rateState.message = '匯率讀取失敗，請稍後再試';
  } finally {
    rateState.isLoading = false;
  }
});
</script>

<template>
  <main class="home-page">
    <section class="home-shell" aria-labelledby="exchange-rates-title">
      <div class="home-header">
        <div>
          <p class="eyebrow">Exchange Rates</p>
          <h1 id="exchange-rates-title">當前匯率資訊</h1>
        </div>
        <RouterLink :to="{ name: 'home' }" custom v-slot="{ navigate }">
          <button class="secondary-button" type="button" @click="navigate">返回</button>
        </RouterLink>
      </div>

      <div class="rate-control-row">
        <label class="summary-currency-field">
          <span>本位幣幣別</span>
          <VueNextSelect
            class="currency-select summary-currency-select"
            role="combobox"
            aria-label="本位幣幣別"
            v-model="rateState.baseCurrency"
            :options="currencyOptions"
            placeholder="請選擇"
            search-placeholder="搜尋幣別"
          />
        </label>
        <dl class="rate-updated-info">
          <div>
            <dt>匯率更新時間</dt>
            <dd>{{ rateState.updatedAt || '-' }}</dd>
          </div>
        </dl>
      </div>

      <p v-if="rateState.isLoading" class="hint">匯率讀取中...</p>
      <p v-if="rateState.message" class="message" role="status">{{ rateState.message }}</p>

      <div class="table-wrap">
        <table class="loan-table exchange-rate-table">
          <thead>
            <tr>
              <th scope="col">序列</th>
              <th scope="col">幣別</th>
              <th scope="col">1 {{ rateState.baseCurrency }} 可折合</th>
              <th scope="col">1 該幣別可折合 {{ rateState.baseCurrency }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in exchangeRateRows" :key="row.currency">
              <td>{{ index + 1 }}</td>
              <td>{{ row.currency }}</td>
              <td>{{ formatAmount(row.baseToCurrency) }} {{ row.currency }}</td>
              <td>{{ formatAmount(row.currencyToBase) }} {{ rateState.baseCurrency }}</td>
            </tr>
            <tr v-if="exchangeRateRows.length === 0 && !rateState.isLoading">
              <td class="empty-table" colspan="4">目前沒有匯率資料</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
