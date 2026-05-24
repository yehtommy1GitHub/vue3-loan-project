// 專案支援的幣別清單，首頁與放款更新頁共用，避免兩邊選項不一致。
export const currencyOptions = ['TWD', 'USD', 'JPY', 'SGD', 'EUR', 'GBP', 'AUD', 'CAD', 'CNY', 'HKD'];

// 前端金額顯示格式，最多保留 6 位小數，符合既有放款金額格式。
export const amountFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6
});

// 匯率以 TWD 為基準：rates[currency] 代表 1 單位該幣別可折合多少 TWD。
export function convertAmount(amount, sourceCurrency, targetCurrency, rates) {
  const numericAmount = Number(amount);
  const sourceRate = Number(rates?.[sourceCurrency]);
  const targetRate = Number(rates?.[targetCurrency]);

  if (!Number.isFinite(numericAmount) || !Number.isFinite(sourceRate) || !Number.isFinite(targetRate)) {
    return 0;
  }

  return (numericAmount * sourceRate) / targetRate;
}

// 將所有放款依使用者指定幣別折算後加總，提供快速掌握總現欠與總還款金額。
export function calculateLoanTotals(loans, targetCurrency, rates) {
  return loans.reduce(
    (totals, loan) => {
      totals.currentOutstandingAmount += convertAmount(
        loan.currentOutstandingAmount,
        loan.currency,
        targetCurrency,
        rates
      );
      totals.nextPaymentAmount += convertAmount(loan.nextPaymentAmount, loan.currency, targetCurrency, rates);

      return totals;
    },
    {
      currentOutstandingAmount: 0,
      nextPaymentAmount: 0
    }
  );
}

// 依目前本位幣產出匯率比值表；例如本位幣為 USD 時，顯示 1 USD 可折合多少各幣別。
export function buildExchangeRateRows(baseCurrency, rates, options = currencyOptions) {
  const baseRate = Number(rates?.[baseCurrency]);

  if (!Number.isFinite(baseRate)) {
    return [];
  }

  return options.map((currency) => {
    const targetRate = Number(rates?.[currency]);
    const baseToCurrency = Number.isFinite(targetRate) ? baseRate / targetRate : 0;
    const currencyToBase = Number.isFinite(targetRate) ? targetRate / baseRate : 0;

    return {
      currency,
      baseToCurrency,
      currencyToBase
    };
  });
}

export function formatAmount(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? amountFormatter.format(numericValue) : '';
}
