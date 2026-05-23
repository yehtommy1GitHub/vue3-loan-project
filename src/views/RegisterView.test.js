import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RegisterView from './RegisterView.vue';
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
  useRouter: () => ({ push })
}));

describe('RegisterView', () => {
  beforeEach(() => {
    push.mockClear();
    axiosMock.post.mockReset();
    axios.create.mockClear();
    sessionStore.clear();
    vi.useRealTimers();
  });

  it('未輸入帳密時顯示錯誤訊息', async () => {
    render(RegisterView);

    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(screen.getByRole('alert')).toHaveTextContent('帳密未輸入');
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it('帳號或密碼不足 8 碼時不送出 API，且錯誤訊息 5 秒後消失', async () => {
    vi.useFakeTimers();
    render(RegisterView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'short');
    await fireEvent.update(screen.getByLabelText('密碼'), '1234567');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    expect(screen.getByRole('alert')).toHaveTextContent('帳號及密碼長度需為 8 碼以上');
    expect(axiosMock.post).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('新註冊用戶成功時 loans 與 loanChangeLogs 為空陣列並跳轉首頁', async () => {
    axiosMock.post.mockResolvedValue({
      data: {
        success: true,
        user: {
          account: 'NEWUSER1',
          userName: 'NEWUSER1使用者',
          loans: [],
          loanChangeLogs: []
        }
      }
    });

    render(RegisterView);

    await fireEvent.update(screen.getByLabelText('帳號'), 'NEWUSER1');
    await fireEvent.update(screen.getByLabelText('密碼'), 'DemoPass123!');
    await fireEvent.click(screen.getByRole('button', { name: '送出' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'home' }));
    expect(axiosMock.post).toHaveBeenCalledWith('/register', {
      account: 'NEWUSER1',
      password: 'DemoPass123!'
    });
    expect(sessionStore.user).toEqual({
      account: 'NEWUSER1',
      userName: 'NEWUSER1使用者',
      loans: [],
      loanChangeLogs: []
    });
  });

  it('清除按鈕會清空帳號密碼與訊息', async () => {
    render(RegisterView);

    const accountInput = screen.getByLabelText('帳號');
    const passwordInput = screen.getByLabelText('密碼');

    await fireEvent.click(screen.getByRole('button', { name: '送出' }));
    await fireEvent.update(accountInput, 'NEWUSER1');
    await fireEvent.update(passwordInput, 'DemoPass123!');
    await fireEvent.click(screen.getByRole('button', { name: '清除' }));

    expect(accountInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('返回登入按鈕會跳回帳密登入頁', async () => {
    render(RegisterView);

    await fireEvent.click(screen.getByRole('button', { name: '返回登入' }));

    expect(push).toHaveBeenCalledWith({ name: 'login' });
  });
});
