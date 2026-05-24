import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import ExchangeRatesView from './ExchangeRatesView.vue';

const replace = vi.fn();
const push = vi.fn();
let routeQuery = {};
const axiosMock = vi.hoisted(() => {
  const get = vi.fn();

  return {
    get,
    create: vi.fn(() => ({ get }))
  };
});

vi.mock('axios', () => ({
  default: {
    create: axiosMock.create
  }
}));

vi.mock('vue-router', () => ({
  RouterLink: {
    props: ['to', 'custom'],
    setup(props, { slots }) {
      if (props.custom !== undefined) {
        return () => slots.default?.({ navigate: () => push(props.to), href: '' });
      }

      return () => h('a', { href: '', onClick: () => push(props.to) }, slots.default?.());
    }
  },
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ replace })
}));

describe('ExchangeRatesView', () => {
  beforeEach(() => {
    routeQuery = {};
    replace.mockClear();
    push.mockClear();
    axiosMock.get.mockReset();
    axios.create.mockClear();
    axiosMock.get.mockResolvedValue({
      data: {
        success: true,
        baseCurrency: 'TWD',
        updatedAt: '2026/05/24 21:30:00',
        rates: {
          TWD: 1,
          USD: 32,
          JPY: 0.2
        }
      }
    });
  });

  it('預設以 TWD 顯示匯率更新時間與各幣別比值', async () => {
    render(ExchangeRatesView);

    expect(screen.getByRole('heading', { name: '當前匯率資訊' })).toBeInTheDocument();
    expect(screen.getByLabelText('本位幣幣別')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('2026/05/24 21:30:00')).toBeInTheDocument());

    const table = screen.getByRole('table');

    expect(within(table).getByRole('columnheader', { name: '1 TWD 可折合' })).toBeInTheDocument();
    expect(within(table).getAllByText('1 TWD')).toHaveLength(2);
    expect(within(table).getByText('0.03125 USD')).toBeInTheDocument();
    expect(within(table).getByText('5 JPY')).toBeInTheDocument();
  });

  it('可由網址帶入本位幣，並可切換本位幣重新計算表格', async () => {
    routeQuery = { baseCurrency: 'USD' };

    render(ExchangeRatesView);

    await waitFor(() => expect(screen.getByText('2026/05/24 21:30:00')).toBeInTheDocument());

    const baseCurrencySelect = screen.getByLabelText('本位幣幣別');

    expect(screen.getByRole('columnheader', { name: '1 USD 可折合' })).toBeInTheDocument();
    expect(screen.getByText('32 TWD')).toBeInTheDocument();

    await fireEvent.click(baseCurrencySelect);
    await fireEvent.click(within(baseCurrencySelect).getByRole('option', { name: 'JPY' }));

    expect(replace).toHaveBeenCalledWith({ name: 'exchangeRates', query: { baseCurrency: 'JPY' } });
    expect(screen.getByRole('columnheader', { name: '1 JPY 可折合' })).toBeInTheDocument();
  });
});
