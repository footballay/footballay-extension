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

const popupCss = readFileSync('src/popup/style.css', 'utf8');

const loadExtensionSettings = vi.hoisted(() => vi.fn());
const saveExtensionSettings = vi.hoisted(() => vi.fn(async () => undefined));
const writeText = vi.hoisted(() => vi.fn(async () => undefined));
const queryTabs = vi.hoisted(() => vi.fn());
const insertCSS = vi.hoisted(() => vi.fn(async () => undefined));
const executeScript = vi.hoisted(() =>
  vi.fn<
    (injection: {
      target: { tabId: number };
      func?: () => boolean;
      files?: string[];
    }) => Promise<Array<{ result?: boolean }>>
  >(async () => []),
);

vi.mock('@/shared/settings/settings', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/settings/settings')>()),
  loadExtensionSettings,
  saveExtensionSettings,
}));

beforeEach(() => {
  loadExtensionSettings.mockResolvedValue({ locale: 'en' });
  saveExtensionSettings.mockClear();
  writeText.mockClear();
  queryTabs.mockReset();
  queryTabs.mockResolvedValue([{ id: 7 }]);
  insertCSS.mockClear();
  executeScript.mockReset();
  executeScript.mockImplementation(async ({ func }) =>
    func ? [{ result: false }] : [],
  );
  vi.stubGlobal('chrome', {
    i18n: { getAcceptLanguages: vi.fn(async () => ['en-US']) },
    runtime: { getManifest: () => ({ version: '1.2.3' }) },
    tabs: { query: queryTabs },
    scripting: { insertCSS, executeScript },
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
    expect(screen.getByText('문의')).toBeTruthy();
    expect(screen.getByRole('button', { name: '복사' })).toBeTruthy();
  });

  it('toggles the content UI setting with a compact switch', async () => {
    executeScript.mockResolvedValueOnce([{ result: true }]);
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

  it('prevents duplicate runs and checks the DOM before injecting', async () => {
    render(<Popup />);

    const runButton = await screen.findByRole('button', {
      name: 'Run on this page',
    });
    expect(screen.queryByRole('switch', { name: 'Footballay' })).toBeNull();
    fireEvent.click(runButton);
    expect(runButton.getAttribute('disabled')).not.toBeNull();
    fireEvent.click(runButton);

    await waitFor(() => expect(executeScript).toHaveBeenCalledTimes(3));
    expect(queryTabs).toHaveBeenCalledWith({
      active: true,
      currentWindow: true,
    });
    expect(executeScript).toHaveBeenNthCalledWith(2, {
      target: { tabId: 7 },
      func: expect.any(Function),
    });
    expect(executeScript.mock.calls[1]![0].func?.name).toBe(
      'isFootballayAlreadyMounted',
    );
    expect(insertCSS).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: ['content-scripts/content.css'],
    });
    expect(executeScript).toHaveBeenNthCalledWith(3, {
      target: { tabId: 7 },
      files: ['content-scripts/content.js'],
    });
    expect(executeScript.mock.invocationCallOrder[1]!).toBeLessThan(
      insertCSS.mock.invocationCallOrder[0]!,
    );
    expect(insertCSS.mock.invocationCallOrder[0]).toBeLessThan(
      executeScript.mock.invocationCallOrder[2]!,
    );
  });

  it('re-enables the run button when injection fails', async () => {
    executeScript
      .mockResolvedValueOnce([{ result: false }])
      .mockRejectedValueOnce(new Error('failed'));
    render(<Popup />);

    const runButton = await screen.findByRole('button', {
      name: 'Run on this page',
    });
    fireEvent.click(runButton);

    expect(runButton.getAttribute('disabled')).not.toBeNull();
    await waitFor(() => expect(runButton.getAttribute('disabled')).toBeNull());
  });

  it('does not inject CSS or content JS when Footballay is mounted', async () => {
    executeScript
      .mockResolvedValueOnce([{ result: false }])
      .mockResolvedValueOnce([{ result: true }]);
    render(<Popup />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Run on this page' }),
    );

    await waitFor(() => expect(executeScript).toHaveBeenCalledTimes(2));
    expect(executeScript).toHaveBeenNthCalledWith(2, {
      target: { tabId: 7 },
      func: expect.any(Function),
    });
    expect(insertCSS).not.toHaveBeenCalled();
    expect(
      executeScript.mock.calls.some(
        ([injection]) => injection.files?.[0] === 'content-scripts/content.js',
      ),
    ).toBe(false);
  });

  it('hides the run button when Footballay is already mounted', async () => {
    executeScript.mockResolvedValueOnce([{ result: true }]);

    render(<Popup />);

    await waitFor(() => expect(executeScript).toHaveBeenCalledOnce());
    expect(
      screen.queryByRole('button', { name: 'Run on this page' }),
    ).toBeNull();
    expect(
      await screen.findByRole('switch', { name: 'Footballay' }),
    ).toBeTruthy();
    expect(insertCSS).not.toHaveBeenCalled();
  });

  it('waits for the saved enabled state before rendering the switch', async () => {
    loadExtensionSettings.mockResolvedValue({ locale: 'en', enabled: false });
    executeScript.mockResolvedValueOnce([{ result: true }]);
    render(<Popup />);

    const toggle = await screen.findByRole('switch', { name: 'Footballay' });
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
