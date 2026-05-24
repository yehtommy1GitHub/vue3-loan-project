<script setup>
// vue-next-select 提供可搜尋、可擴充的幣別下拉選單，比原生 select 更適合未來幣別資料變多的情境。
import VueNextSelect from 'vue-next-select';

defineProps({
  loans: {
    type: Array,
    required: true
  },
  currencyOptions: {
    type: Array,
    required: true
  },
  formatAmount: {
    type: Function,
    required: true
  },
  toDateInputValue: {
    type: Function,
    required: true
  },
  fromDateInputValue: {
    type: Function,
    required: true
  }
});

// 子元件透過 emit 回報使用者操作，實際改資料仍交給父層頁面集中處理。
const emit = defineEmits(['add', 'remove', 'update-field', 'update-amount']);

function updateField(index, field, value) {
  emit('update-field', { index, field, value });
}

function updateAmount(index, field, value) {
  emit('update-amount', { index, field, value });
}
</script>

<template>
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
        <tr v-for="(loan, index) in loans" :key="index">
          <td>{{ index + 1 }}</td>
          <td>
            <input
              :value="loan.loanAccount"
              aria-label="放款帳號"
              inputmode="numeric"
              maxlength="13"
              :disabled="loan.isPersisted"
              :title="loan.isPersisted ? '既有放款帳號不可修改，請刪除後重新新增' : ''"
              @input="updateField(index, 'loanAccount', $event.target.value.trim())"
            />
          </td>
          <td>
            <label class="select-field">
              <span class="sr-only">幣別</span>
              <VueNextSelect
                class="currency-select"
                role="combobox"
                aria-label="幣別"
                :model-value="loan.currency"
                :options="currencyOptions"
                placeholder="請選擇"
                search-placeholder="搜尋幣別"
                @update:model-value="updateField(index, 'currency', $event)"
              />
            </label>
          </td>
          <td>
            <input
              :value="formatAmount(loan.currentOutstandingAmount)"
              aria-label="當前現欠金額"
              inputmode="decimal"
              @input="updateAmount(index, 'currentOutstandingAmount', $event.target.value)"
            />
          </td>
          <td>
            <input
              :value="toDateInputValue(loan.nextPaymentDate)"
              aria-label="下期還款日期"
              type="date"
              @input="updateField(index, 'nextPaymentDate', fromDateInputValue($event.target.value))"
            />
          </td>
          <td>
            <input
              :value="formatAmount(loan.nextPaymentAmount)"
              aria-label="下期還款金額"
              inputmode="decimal"
              @input="updateAmount(index, 'nextPaymentAmount', $event.target.value)"
            />
          </td>
          <td>
            <button class="secondary-button compact-button" type="button" @click="emit('remove', index)">
              刪除
            </button>
          </td>
        </tr>
        <tr v-if="loans.length === 0">
          <td class="empty-table" colspan="7">目前沒有放款資料</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="actions">
    <div class="left-actions">
      <button class="secondary-button" type="button" @click="emit('add')">新增</button>
    </div>
  </div>
</template>
