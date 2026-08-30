// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Popup } from './Popup';

const popupCss = readFileSync('src/entrypoints/popup/style.css', 'utf8');

const loadExtensionSettings = vi.hoisted(() => vi.fn());
const saveExtensionSettings = vi.hoisted(() => vi.fn(async () => undefined));
const writeText = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('@/shared/settings/settings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/settings/settings')>()),
  loadExtensionSettings,
  saveExtensionSettings,
}));

beforeEach(() => {
  loadExtensionSettings.mockResolvedValue({ locale: 'en' });
  saveExtensionSettings.mockClear();
  writeText.mockClear();
  vi.stubGlobal('chrome', {
    i18n: { getAcceptLanguages: vi.fn(async () => ['en-US']) },
    runtime: { getManifest: () => ({ version: '1.2.3' }) },
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: undefined,
  });
});

describe('Popup', () => {
  it('renders English popup copy and the manifest version without a mailto link', async () => {
    render(<Popup />);

    expect(
      await screen.findByText(
        'An overlay for viewing lineups and match statistics while watching football.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'The overlay is available only on coupangplay.com and is not an official Coupang Play app.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Contact')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Copy' }).querySelector('svg'),
    ).toBeTruthy();
    expect(screen.getByText('v1.2.3')).toBeTruthy();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(document.querySelector('.footballay-popup__footer')).toBeTruthy();
  });

  it('shows Korean copy feedback separately from the icon button', async () => {
    loadExtensionSettings.mockResolvedValue({ locale: 'ko' });
    render(<Popup />);

    fireEvent.click(await screen.findByRole('button', { name: '복사' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('복사됨').className).toContain(
      'footballay-popup__feedback--visible',
    );
  });

  it('renders Korean popup copy', async () => {
    loadExtensionSettings.mockResolvedValue({ locale: 'ko' });
    render(<Popup />);

    expect(
      await screen.findByText(
        '축구 경기 시청 중 라인업과 경기 통계를 확인할 수 있는 오버레이입니다.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        '오버레이는 coupangplay.com에서만 표시되며, 쿠팡플레이의 공식 앱이 아닙니다.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('이메일')).toBeTruthy();
    expect(screen.getByRole('button', { name: '복사' })).toBeTruthy();
  });

  it('toggles the content UI setting with a compact switch', async () => {
    render(<Popup />);

    const toggle = await screen.findByRole('switch', { name: 'Footballay' });
    await waitFor(() => expect(toggle.getAttribute('disabled')).toBeNull());
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(saveExtensionSettings).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(popupCss).toContain('height: 18px;');
    expect(popupCss).toContain('transform: translateX(14px);');
  });

  it('waits for the saved enabled state before rendering the switch', async () => {
    loadExtensionSettings.mockResolvedValue({ locale: 'en', enabled: false });
    render(<Popup />);

    const toggle = screen.getByRole('switch', { name: 'Footballay' });
    expect(toggle.getAttribute('disabled')).toBe('');
    await waitFor(() => expect(toggle.getAttribute('disabled')).toBeNull());
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('copies the support email and fades the separate feedback out after one second', async () => {
    vi.useFakeTimers();
    try {
      render(<Popup />);
      const copyButton = screen.getByRole('button', { name: 'Copy' });

      fireEvent.click(copyButton);
      await act(async () => {
        await Promise.resolve();
      });

      expect(writeText).toHaveBeenCalledWith('physickskim@gmail.com');
      expect(copyButton.textContent).toBe('');
      expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull();
      expect(screen.getByText('Copied').className).toContain(
        'footballay-popup__feedback--visible',
      );

      act(() => vi.advanceTimersByTime(1_000));
      expect(screen.getByText('Copied').className).not.toContain(
        'footballay-popup__feedback--visible',
      );
      expect(popupCss).toContain('transition: opacity 0.25s ease;');
      expect(popupCss).toContain(
        '.footballay-popup__feedback {\n  position: absolute;',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the feedback timer on unmount', async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    try {
      const { unmount } = render(<Popup />);
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
      await act(async () => {
        await Promise.resolve();
      });
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});
