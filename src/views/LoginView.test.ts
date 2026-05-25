import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginView from './LoginView.vue';
import { sessionStore } from '../stores/sessionStore';

const push = vi.fn();
const axiosMock = vi.hoisted(() => {
  const post = vi.fn();

  return {
    post,
    create: vi.fn(() => ({ post }))
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
    setup(props: any, { slots }: any) {
      return () => slots.default?.({ navigate: () => push(props.to), href: '' });
    }
  },
  useRouter: () => ({ push })
}));

describe('LoginView', () => {
  beforeEach(() => {
    push.mockClear();
    axiosMock.post.mockReset();
    axiosMock.create.mockClear();
    sessionStore.clear();
  });

  it('未輸入帳密時顯示錯誤訊息', async () => {
    render(LoginView);

    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(screen.getByRole('alert')).toHaveTextContent('帳密未輸入');
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it('帳號或密碼不足 8 碼時不送出 API', async () => {
    render(LoginView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'tommy');
    await fireEvent.update(screen.getByLabelText('密碼'), 'pass123');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(screen.getByRole('alert')).toHaveTextContent('帳號及密碼長度需為 8 碼以上');
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it('DEMO0001 登入成功時保存英文欄位使用者與至少 3 筆放款資料', async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        success: true,
        user: {
          account: 'DEMO0001',
          userName: 'tommy使用者',
          loans: [
            {
              loanAccount: '1000000000001',
              currency: 'TWD',
              currentOutstandingAmount: 125000,
              nextPaymentDate: '20260615',
              nextPaymentAmount: 8500
            },
            {
              loanAccount: '1000000000002',
              currency: 'TWD',
              currentOutstandingAmount: 360000,
              nextPaymentDate: '20260620',
              nextPaymentAmount: 12000
            },
            {
              loanAccount: '1000000000003',
              currency: 'USD',
              currentOutstandingAmount: 4200,
              nextPaymentDate: '20260705',
              nextPaymentAmount: 350
            }
          ]
        }
      }
    });

    render(LoginView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'DEMO0001');
    await fireEvent.update(screen.getByLabelText('密碼'), 'DemoPass123!');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'home' }));
    expect(axiosMock.post).toHaveBeenCalledWith('/login', {
      account: 'DEMO0001',
      password: 'DemoPass123!'
    });
    expect(sessionStore.user?.account).toBe('DEMO0001');
    expect(sessionStore.user?.userName).toBe('tommy使用者');
    expect(sessionStore.user?.loans).toHaveLength(3);
  });

  it('DEMO0002 測試帳號登入成功時保存至少 3 筆放款資料', async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        success: true,
        user: {
          account: 'DEMO0002',
          userName: 'DEMO0002使用者',
          loans: [
            {
              loanAccount: '2000000000001',
              currency: 'TWD',
              currentOutstandingAmount: 99999,
              nextPaymentDate: '20260610',
              nextPaymentAmount: 9999
            },
            {
              loanAccount: '2000000000002',
              currency: 'TWD',
              currentOutstandingAmount: 188000,
              nextPaymentDate: '20260625',
              nextPaymentAmount: 18800
            },
            {
              loanAccount: '2000000000003',
              currency: 'JPY',
              currentOutstandingAmount: 500000,
              nextPaymentDate: '20260701',
              nextPaymentAmount: 50000
            }
          ]
        }
      }
    });

    render(LoginView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'DEMO0002');
    await fireEvent.update(screen.getByLabelText('密碼'), 'SamplePass456!');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'home' }));
    expect(axiosMock.post).toHaveBeenCalledWith('/login', {
      account: 'DEMO0002',
      password: 'SamplePass456!'
    });
    expect(sessionStore.user?.account).toBe('DEMO0002');
    expect(sessionStore.user?.loans).toHaveLength(3);
  });

  it('登入失敗時顯示錯誤訊息', async () => {
    axiosMock.post.mockResolvedValue({
      data: { success: false, message: '帳密錯誤' }
    });

    render(LoginView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'DEMO0001');
    await fireEvent.update(screen.getByLabelText('密碼'), 'wrongpass');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('帳密錯誤');
    expect(push).not.toHaveBeenCalledWith({ name: 'home' });
  });

  it('註冊按鈕會跳轉帳密註冊頁', async () => {
    render(LoginView);

    await fireEvent.click(screen.getByRole('button', { name: '註冊' }));

    expect(push).toHaveBeenCalledWith({ name: 'register' });
  });
});
