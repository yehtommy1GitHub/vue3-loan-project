import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminApiHealthView from './AdminApiHealthView.vue';
import { backendApiConfig } from '../config/backendApiConfig';

const axiosMock = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const put = vi.fn();

  return {
    get,
    post,
    put,
    create: vi.fn(() => ({ get, post, put }))
  };
});

vi.mock('axios', () => ({
  default: {
    create: axiosMock.create
  }
}));

describe('AdminApiHealthView', () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.put.mockReset();
    axiosMock.create.mockClear();
    axiosMock.get.mockResolvedValue({ data: { success: true } });
    axiosMock.post.mockResolvedValue({ data: { success: true } });
  });

  it('顯示完整 URL、中文名稱與目前狀態，且不檢查會異動資料的 API', async () => {
    render(AdminApiHealthView);

    expect(screen.getByRole('heading', { name: '後台 API 狀態檢查' })).toBeInTheDocument();
    expect(screen.getByText('API 模式')).toBeInTheDocument();
    expect(screen.getByText(backendApiConfig.mode)).toBeInTheDocument();
    expect(screen.getByText('Base URL')).toBeInTheDocument();
    expect(screen.getByText(backendApiConfig.baseURL)).toBeInTheDocument();

    await waitFor(() => expect(screen.getAllByText('正常').length).toBeGreaterThan(0));

    const table = screen.getByRole('table');

    expect(within(table).getByRole('columnheader', { name: '完整 URL' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'URL 中文名稱' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: '當前狀態' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: '錯誤明細' })).toBeInTheDocument();
    expect(within(table).getByText(`${backendApiConfig.baseURL}/login`)).toBeInTheDocument();
    expect(within(table).getByText('登入 API')).toBeInTheDocument();
    expect(within(table).getByText('註冊 API')).toBeInTheDocument();
    expect(within(table).queryByText(/undefined/)).not.toBeInTheDocument();
    expect(within(table).getByText('未檢查（避免新增測試資料）')).toBeInTheDocument();
    expect(within(table).getByText('未檢查（避免更新放款資料）')).toBeInTheDocument();
    expect(axiosMock.post).toHaveBeenCalledWith('/login', {
      account: 'DEMO0001',
      password: 'DemoPass123!'
    });
    expect(axiosMock.put).not.toHaveBeenCalled();
  });

  it('可手動重新檢查 API 狀態', async () => {
    render(AdminApiHealthView);

    await waitFor(() => expect(screen.getAllByText('正常').length).toBeGreaterThan(0));

    axiosMock.get.mockClear();
    axiosMock.post.mockClear();
    await fireEvent.click(screen.getByRole('button', { name: '重新檢查' }));

    await waitFor(() => expect(axiosMock.post).toHaveBeenCalledWith('/login', expect.any(Object)));
    expect(axiosMock.get).toHaveBeenCalledWith('/exchange-rates');
  });
});
