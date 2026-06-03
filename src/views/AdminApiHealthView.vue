<script setup lang="ts">
// 匯入 onMounted 與 ref；後台檢查頁只需要保存檢查結果與載入狀態。
import { onMounted, ref } from 'vue';
// 匯入 API 健康檢查服務，集中處理端點清單、執行環境資訊與實際探測。
import { buildApiHealthRows, checkApiHealth, getApiHealthRuntimeInfo } from '../api/modules/apiHealthApi';
import type { ApiHealthRow, ApiHealthRuntimeInfo } from '../types/api';

const rows = ref<ApiHealthRow[]>(buildApiHealthRows());
const isChecking = ref(false);
const runtimeInfo = ref<ApiHealthRuntimeInfo>(getApiHealthRuntimeInfo());

async function refreshHealth(): Promise<void> {
  isChecking.value = true;
  runtimeInfo.value = getApiHealthRuntimeInfo();
  rows.value = rows.value.map((row: ApiHealthRow): ApiHealthRow => ({
    ...row,
    currentStatus: row.currentStatus.startsWith('未檢查') ? row.currentStatus : '檢查中'
  }));

  try {
    rows.value = await checkApiHealth();
    runtimeInfo.value = getApiHealthRuntimeInfo();
  } finally {
    isChecking.value = false;
  }
}

function statusClass(status: string): string {
  if (status === '正常') {
    return 'status-ok';
  }

  if (status.startsWith('未檢查')) {
    return 'status-skip';
  }

  if (status === '檢查中' || status === '待檢查') {
    return 'status-pending';
  }

  return 'status-error';
}

onMounted((): void => {
  void refreshHealth();
});
</script>

<template>
  <main class="home-page">
    <section class="home-shell admin-shell" aria-labelledby="admin-api-health-title">
      <div class="home-header">
        <div>
          <p class="eyebrow">Admin Monitor</p>
          <h1 id="admin-api-health-title">後台 API 狀態檢查</h1>
        </div>
        <button class="primary-button" type="button" :disabled="isChecking" @click="refreshHealth">
          {{ isChecking ? '檢查中...' : '重新檢查' }}
        </button>
      </div>

      <dl class="profile-summary api-runtime-summary">
        <div>
          <dt>API 模式</dt>
          <dd>{{ runtimeInfo.mode }}</dd>
        </div>
        <div>
          <dt>Base URL</dt>
          <dd>{{ runtimeInfo.baseURL }}</dd>
        </div>
        <div>
          <dt>逾時毫秒</dt>
          <dd>{{ runtimeInfo.timeout }}</dd>
        </div>
        <div>
          <dt>檢查時間</dt>
          <dd>{{ runtimeInfo.checkedAt }}</dd>
        </div>
      </dl>

      <p v-if="runtimeInfo.configError" class="message" role="status">{{ runtimeInfo.configError }}</p>

      <div class="table-wrap">
        <table class="loan-table api-health-table">
          <thead>
            <tr>
              <th scope="col">完整 URL</th>
              <th scope="col">URL 中文名稱</th>
              <th scope="col">當前狀態</th>
              <th scope="col">錯誤明細</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.endpointName">
              <td>
                <code>{{ row.fullUrl }}</code>
              </td>
              <td>{{ row.chineseName }}</td>
              <td>
                <span class="status-pill" :class="statusClass(row.currentStatus)">
                  {{ row.currentStatus }}
                </span>
              </td>
              <td>{{ row.detail || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
