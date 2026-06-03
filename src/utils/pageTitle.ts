// 統一管理瀏覽器分頁標題，避免正式與 mock 環境在畫面上無法辨識。
const basePageTitle = 'VUE3發票登入平台';

export function getPageTitle(useBackendApi: boolean): string {
  return useBackendApi ? basePageTitle : `${basePageTitle}(mock)`;
}
