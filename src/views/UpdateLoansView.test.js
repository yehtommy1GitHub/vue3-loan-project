import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import UpdateLoansView from './UpdateLoansView.vue';
import { sessionStore } from '../stores/sessionStore';

const push = vi.fn();
const axiosMock = vi.hoisted(() => {
  const get = vi.fn();
  const put = vi.fn();

  return {
    get,
    put,
    create: vi.fn(() => ({ get, put }))
  };
});

vi.mock('axios', () => ({
  default: {
    create: axiosMock.create
  }
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to'],
    setup(props, { attrs, slots }) {
      return () => h('a', { href: '', ...attrs, onClick: () => push(props.to) }, slots.default?.());
    }
  },
  useRouter: () => ({ push })
}));

describe('UpdateLoansView', () => {
  beforeEach(() => {
    push.mockClear();
    axiosMock.get.mockReset();
    axiosMock.put.mockReset();
    axios.create.mockClear();
    axiosMock.get.mockResolvedValue({
      data: {
        success: true,
        baseCurrency: 'TWD',
        rates: {
          TWD: 1,
          USD: 32
        },
        updatedAt: '2026/05/24 20:00:00'
      }
    });
    sessionStore.clear();
    sessionStore.setUser({
      account: 'DEMO0001',
      userName: 'tommy使用者',
      loans: [
        {
          loanAccount: '1000000000001',
          currency: 'TWD',
          currentOutstandingAmount: 125000,
          nextPaymentDate: '20260615',
          nextPaymentAmount: 8500
        }
      ],
      loanChangeLogs: []
    });
  });

  async function chooseCurrency(index, currency) {
    const currencySelects = screen.getAllByLabelText('幣別');

    await fireEvent.click(currencySelects[index]);
    await fireEvent.click(within(currencySelects[index]).getByRole('option', { name: currency }));
  }

  it('返回按鈕會回首頁且不存檔', async () => {
    render(UpdateLoansView);

    await fireEvent.click(screen.getByRole('button', { name: '返回' }));

    expect(push).toHaveBeenCalledWith({ name: 'home' });
    expect(axiosMock.put).not.toHaveBeenCalled();
  });

  it('既有放款帳號不可編輯，新增放款帳號可輸入', async () => {
    render(UpdateLoansView);

    const existingLoanInput = screen.getByLabelText('放款帳號');

    expect(existingLoanInput).toBeDisabled();
    expect(existingLoanInput).toHaveAttribute('title', '既有放款帳號不可修改，請刪除後重新新增');

    await fireEvent.click(screen.getByRole('button', { name: '新增' }));

    const loanInputs = screen.getAllByLabelText('放款帳號');

    expect(loanInputs[0]).toBeDisabled();
    expect(loanInputs[1]).not.toBeDisabled();
  });

  it('幣別欄位使用放大的下拉選單，日期與金額格式正確', () => {
    render(UpdateLoansView);

    const currencySelect = screen.getByLabelText('幣別');

    expect(currencySelect).toHaveClass('currency-select');
    expect(within(currencySelect).getByRole('option', { name: 'USD' })).toBeInTheDocument();
    expect(within(currencySelect).getByRole('option', { name: 'TWD' })).toBeInTheDocument();
    expect(within(currencySelect).getByRole('option', { name: 'JPY' })).toBeInTheDocument();
    expect(within(currencySelect).getByRole('option', { name: 'SGD' })).toBeInTheDocument();
    expect(within(currencySelect).getByRole('option', { name: 'EUR' })).toBeInTheDocument();
    expect(screen.getByLabelText('下期還款日期')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('下期還款日期')).toHaveValue('2026-06-15');
    expect(screen.getByLabelText('當前現欠金額')).toHaveValue('125,000');
    expect(screen.getByLabelText('下期還款金額')).toHaveValue('8,500');
    expect(screen.getByRole('heading', { name: '放款總額' })).toBeInTheDocument();
    expect(screen.getByText('總現欠金額')).toBeInTheDocument();
    expect(screen.getByText('下期總還款金額')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '當前匯率資訊' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: '當前匯率資訊' })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('新增資料缺少必填欄位時不可建檔', async () => {
    render(UpdateLoansView);

    await fireEvent.click(screen.getByRole('button', { name: '新增' }));
    await fireEvent.click(screen.getByRole('button', { name: '存檔' }));

    expect(screen.getByRole('status')).toHaveTextContent('第 2 筆資料未完整輸入');
    expect(axiosMock.put).not.toHaveBeenCalled();
  });

  it('放款帳號輸入時只保留 13 碼數字', async () => {
    render(UpdateLoansView);

    await fireEvent.click(screen.getByRole('button', { name: '新增' }));

    const loanInputs = screen.getAllByLabelText('放款帳號');

    await fireEvent.update(loanInputs[1], 'A123456789012345');

    expect(loanInputs[1]).toHaveValue('1234567890123');
  });

  it('新增放款帳號不足 13 碼時不可建檔', async () => {
    render(UpdateLoansView);

    await fireEvent.click(screen.getByRole('button', { name: '新增' }));

    const loanInputs = screen.getAllByLabelText('放款帳號');
    const amountInputs = screen.getAllByLabelText('當前現欠金額');
    const dateInputs = screen.getAllByLabelText('下期還款日期');
    const nextAmountInputs = screen.getAllByLabelText('下期還款金額');

    await fireEvent.update(loanInputs[1], '123456789012');
    await chooseCurrency(1, 'USD');
    await fireEvent.update(amountInputs[1], '1,000');
    await fireEvent.update(dateInputs[1], '2026-08-01');
    await fireEvent.update(nextAmountInputs[1], '500');
    await fireEvent.click(screen.getByRole('button', { name: '存檔' }));

    expect(screen.getByRole('status')).toHaveTextContent('第 2 筆放款帳號需為 13 碼數字');
    expect(axiosMock.put).not.toHaveBeenCalled();
  });

  it('放款帳號重複時不可建檔', async () => {
    render(UpdateLoansView);

    await fireEvent.click(screen.getByRole('button', { name: '新增' }));

    const loanInputs = screen.getAllByLabelText('放款帳號');
    const amountInputs = screen.getAllByLabelText('當前現欠金額');
    const dateInputs = screen.getAllByLabelText('下期還款日期');
    const nextAmountInputs = screen.getAllByLabelText('下期還款金額');

    await fireEvent.update(loanInputs[1], '1000000000001');
    await chooseCurrency(1, 'USD');
    await fireEvent.update(amountInputs[1], '1,000');
    await fireEvent.update(dateInputs[1], '2026-08-01');
    await fireEvent.update(nextAmountInputs[1], '500');
    await fireEvent.click(screen.getByRole('button', { name: '存檔' }));

    expect(screen.getByRole('status')).toHaveTextContent('第 2 筆放款帳號不可重複');
    expect(axiosMock.put).not.toHaveBeenCalled();
  });

  it('當前現欠金額小於下期還款金額時不可建檔', async () => {
    render(UpdateLoansView);

    await fireEvent.click(screen.getByRole('button', { name: '新增' }));

    const loanInputs = screen.getAllByLabelText('放款帳號');
    const amountInputs = screen.getAllByLabelText('當前現欠金額');
    const dateInputs = screen.getAllByLabelText('下期還款日期');
    const nextAmountInputs = screen.getAllByLabelText('下期還款金額');

    await fireEvent.update(loanInputs[1], '3000000000001');
    await chooseCurrency(1, 'USD');
    await fireEvent.update(amountInputs[1], '400');
    await fireEvent.update(dateInputs[1], '2026-08-01');
    await fireEvent.update(nextAmountInputs[1], '500');
    await fireEvent.click(screen.getByRole('button', { name: '存檔' }));

    expect(screen.getByRole('status')).toHaveTextContent('第 2 筆當前現欠金額必須大於等於下期還款金額');
    expect(axiosMock.put).not.toHaveBeenCalled();
  });

  it('存檔後更新放款資訊與 JSON 異動紀錄', async () => {
    axiosMock.put.mockResolvedValue({
      data: {
        success: true,
        user: {
          account: 'DEMO0001',
          userName: 'tommy使用者',
          loans: [
            {
              loanAccount: '3000000000001',
              currency: 'USD',
              currentOutstandingAmount: 5000.123456,
              nextPaymentDate: '20260801',
              nextPaymentAmount: 500.123456
            }
          ],
          loanChangeLogs: [
            {
              changedAt: '2026/05/23 12:01:00',
              changedBy: 'tommy使用者',
              changeItem: '新增',
              changeData: [
                {
                  loanAccount: '3000000000001',
                  field: 'loanAccount',
                  fieldName: '放款帳號',
                  newValue: '3000000000001'
                }
              ]
            }
          ]
        }
      }
    });

    render(UpdateLoansView);

    await fireEvent.click(screen.getByRole('button', { name: '新增' }));
    expect(axiosMock.put).not.toHaveBeenCalled();

    const loanInputs = screen.getAllByLabelText('放款帳號');
    const amountInputs = screen.getAllByLabelText('當前現欠金額');
    const dateInputs = screen.getAllByLabelText('下期還款日期');
    const nextAmountInputs = screen.getAllByLabelText('下期還款金額');

    await fireEvent.update(loanInputs[1], '3000000000001');
    await chooseCurrency(1, 'USD');
    await fireEvent.update(amountInputs[1], '5,000.1234567');
    await fireEvent.update(dateInputs[1], '2026-08-01');
    await fireEvent.update(nextAmountInputs[1], '500.1234567');
    await fireEvent.click(screen.getAllByRole('button', { name: '刪除' })[0]);
    await fireEvent.click(screen.getByRole('button', { name: '存檔' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('存檔成功'));
    expect(axiosMock.put).toHaveBeenCalledWith('/users/DEMO0001/loans', {
      loans: [
        {
          loanAccount: '3000000000001',
          currency: 'USD',
          currentOutstandingAmount: 5000.123456,
          nextPaymentDate: '20260801',
          nextPaymentAmount: 500.123456
        }
      ]
    });
    expect(sessionStore.user.loans).toHaveLength(1);
    expect(sessionStore.user.loanChangeLogs).toHaveLength(1);
    expect(sessionStore.user.loanChangeLogs[0].changeItem).toBe('新增');
    expect(sessionStore.user.loanChangeLogs[0].changeData[0].loanAccount).toBe('3000000000001');
  });
});
