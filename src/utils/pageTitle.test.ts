import { describe, expect, it } from 'vitest';
import { getPageTitle } from './pageTitle';

describe('getPageTitle', () => {
  it('實際後端模式顯示正式平台名稱', () => {
    expect(getPageTitle(true)).toBe('VUE3發票登入平台');
  });

  it('mock 模式顯示 mock 標示，避免使用者誤判環境', () => {
    expect(getPageTitle(false)).toBe('VUE3發票登入平台(mock)');
  });
});
