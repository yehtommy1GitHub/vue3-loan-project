import { fireEvent, render, screen, within } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import HomeView from './HomeView.vue';
import { sessionStore } from '../stores/sessionStore';

const push = vi.fn();

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to', 'custom'],
    setup(props, { attrs, slots }) {
      if (props.custom !== undefined) {
        return () => slots.default?.({ navigate: () => push(props.to), href: '' });
      }

      return () => h('a', { href: '', ...attrs, onClick: () => push(props.to) }, slots.default?.());
    }
  },
  useRouter: () => ({ push })
}));

vi.mock('../services/authApi', () => ({
  fetchExchangeRates: vi.fn(async () => ({
    baseCurrency: 'TWD',
    rates: {
      TWD: 1,
      USD: 32
    },
    updatedAt: '2026/05/24 20:00:00'
  })),
  fetchUser: vi.fn(async () => sessionStore.user)
}));

describe('HomeView', () => {
  beforeEach(() => {
    push.mockClear();
    sessionStore.clear();
  });

  it('顯示放款資訊與包含放款帳號的異動資料明細表格', () => {
    sessionStore.setUser({
      account: 'DEMO0001',
      userName: 'tommy使用者',
      loans: [
        {
          loanAccount: '1000000000001',
          currency: 'TWD',
          currentOutstandingAmount: 125000.123456,
          nextPaymentDate: '20260615',
          nextPaymentAmount: 8500
        }
      ],
      loanChangeLogs: [
        {
          changedAt: '2026/05/23 12:01:00',
          changedBy: 'tommy使用者',
          changeItem: '修改',
          changeData: [
            {
              loanAccount: '1000000000001',
              field: 'currency',
              fieldName: '幣別',
              oldValue: 'TWD',
              newValue: 'USD'
            },
            {
              loanAccount: '1000000000001',
              field: 'nextPaymentAmount',
              fieldName: '下期還款金額',
              oldValue: 8500,
              newValue: 9000
            }
          ]
        }
      ]
    });

    render(HomeView);

    expect(screen.getByText('使用者帳號')).toBeInTheDocument();
    expect(screen.getByText('DEMO0001')).toBeInTheDocument();
    expect(screen.getByText('使用者名稱')).toBeInTheDocument();
    expect(screen.getAllByText('tommy使用者')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: '放款資訊' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '放款總額' })).toBeInTheDocument();
    expect(screen.getByText('總現欠金額')).toBeInTheDocument();
    expect(screen.getByText('下期總還款金額')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '當前匯率資訊' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: '當前匯率資訊' })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('heading', { name: '放款資訊異動紀錄' })).toBeInTheDocument();

    const tables = screen.getAllByRole('table');
    const loanTable = tables[0];
    const logTable = tables[1];
    const detailTable = tables[2];

    expect(within(loanTable).getByRole('columnheader', { name: '序列' })).toBeInTheDocument();
    expect(within(loanTable).getByText('1000000000001')).toBeInTheDocument();
    expect(within(loanTable).getByText('TWD')).toBeInTheDocument();
    expect(within(loanTable).getByText('125,000.123456')).toBeInTheDocument();
    expect(within(loanTable).getByText('8,500')).toBeInTheDocument();

    expect(within(logTable).getByRole('columnheader', { name: '異動資料' })).toBeInTheDocument();
    expect(within(logTable).getByText('2026/05/23 12:01:00')).toBeInTheDocument();
    expect(within(logTable).getByText('修改')).toBeInTheDocument();
    expect(within(detailTable).getByRole('columnheader', { name: '放款帳號' })).toBeInTheDocument();
    expect(within(detailTable).getByRole('columnheader', { name: '欄位' })).toBeInTheDocument();
    expect(within(detailTable).getByRole('columnheader', { name: '修改前' })).toBeInTheDocument();
    expect(within(detailTable).getByRole('columnheader', { name: '修改後' })).toBeInTheDocument();
    expect(within(detailTable).getAllByText('1000000000001')).toHaveLength(2);
    expect(within(detailTable).getByText('幣別')).toBeInTheDocument();
    expect(within(detailTable).getByText('USD')).toBeInTheDocument();
    expect(within(detailTable).getByText('下期還款金額')).toBeInTheDocument();
    expect(within(detailTable).getByText('9000')).toBeInTheDocument();
  });

  it('沒有放款資訊與異動紀錄時顯示空狀態', () => {
    sessionStore.setUser({ account: 'DEMO0001', userName: 'tommy使用者', loans: [], loanChangeLogs: [] });

    render(HomeView);

    expect(screen.getByText('目前沒有放款資料')).toBeInTheDocument();
    expect(screen.getByText('目前沒有異動紀錄')).toBeInTheDocument();
  });

  it('放款資訊更新按鈕會開啟更新頁', async () => {
    sessionStore.setUser({ account: 'DEMO0001', userName: 'tommy使用者', loans: [], loanChangeLogs: [] });

    render(HomeView);
    await fireEvent.click(screen.getByRole('button', { name: '放款資訊更新' }));

    expect(push).toHaveBeenCalledWith({ name: 'updateLoans' });
  });

  it('退出時清除登入狀態並回登入頁', async () => {
    sessionStore.setUser({ account: 'DEMO0001', userName: 'tommy使用者', loans: [], loanChangeLogs: [] });

    render(HomeView);
    await fireEvent.click(screen.getByRole('button', { name: '退出' }));

    expect(sessionStore.user).toBeNull();
    expect(push).toHaveBeenCalledWith({ name: 'login' });
  });
});
