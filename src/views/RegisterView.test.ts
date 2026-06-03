import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterView from './RegisterView.vue';
import { sessionStore } from '../stores/sessionStore';

const push = vi.fn();
const axiosMock = vi.hoisted(() => {
  const request = vi.fn();

  return {
    request,
    create: vi.fn(() => ({ request }))
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

describe('RegisterView', () => {
  beforeEach(() => {
    push.mockClear();
    axiosMock.request.mockReset();
    axiosMock.create.mockClear();
    sessionStore.clear();
    vi.useRealTimers();
  });

  it('未輸入帳密時顯示錯誤訊息', async () => {
    render(RegisterView);

    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('帳密未輸入');
    expect(axiosMock.request).not.toHaveBeenCalled();
  });

  it('帳號或密碼不足 8 碼時不送出 API，且錯誤訊息 5 秒後消失', async () => {
    vi.useFakeTimers();
    render(RegisterView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'short');
    await fireEvent.update(screen.getByLabelText('使用者名稱'), '新使用者');
    await fireEvent.update(screen.getByLabelText('密碼'), '1234567');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('帳號及密碼長度需為 8 碼以上');
    expect(axiosMock.request).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('使用者名稱不足 2 長時顯示錯誤訊息且不送出 API', async () => {
    render(RegisterView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'NEWUSER1');
    await fireEvent.update(screen.getByLabelText('使用者名稱'), '王');
    await fireEvent.update(screen.getByLabelText('密碼'), 'DemoPass123!');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('使用者名稱必須大於2長');
    expect(axiosMock.request).not.toHaveBeenCalled();
  });

  it('新註冊用戶成功時 loans 與 loanChangeLogs 為空陣列並跳轉首頁', async () => {
    axiosMock.request.mockResolvedValue({
      data: {
        success: true,
        user: {
          account: 'NEWUSER1',
          userName: '王小明',
          loans: [],
          loanChangeLogs: []
        }
      }
    });

    render(RegisterView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'NEWUSER1');
    await fireEvent.update(screen.getByLabelText('使用者名稱'), '王小明');
    await fireEvent.update(screen.getByLabelText('密碼'), 'DemoPass123!');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'home' }));
    expect(axiosMock.request).toHaveBeenCalledWith({
      method: 'POST',
      url: '/register',
      data: {
        account: 'NEWUSER1',
        password: 'DemoPass123!',
        userName: '王小明'
      }
    });
    expect(sessionStore.user).toEqual({
      account: 'NEWUSER1',
      userName: '王小明',
      loans: [],
      loanChangeLogs: []
    });
  });

  it('清除按鈕會清空帳號密碼與訊息', async () => {
    render(RegisterView);

    const accountInput = screen.getByLabelText('帳號');
    const userNameInput = screen.getByLabelText('使用者名稱');
    const passwordInput = screen.getByLabelText('密碼');

    await fireEvent.click(screen.getByRole('button', { name: '送出' }));
    await screen.findByRole('alert');
    await fireEvent.update(accountInput, 'NEWUSER1');
    await fireEvent.update(userNameInput, '王小明');
    await fireEvent.update(passwordInput, 'DemoPass123!');
    await fireEvent.click(screen.getByRole('button', { name: '清除' }));

    expect(accountInput).toHaveValue('');
    expect(userNameInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('返回登入按鈕會跳回帳密登入頁', async () => {
    render(RegisterView);

    await fireEvent.click(screen.getByRole('button', { name: '返回' }));

    expect(push).toHaveBeenCalledWith({ name: 'login' });
  });
});
