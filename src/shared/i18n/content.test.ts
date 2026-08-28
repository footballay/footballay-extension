// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ContentI18nProvider,
  resolveContentLocale,
  t,
  useContentLocale,
} from './content';

function LocaleProbe() {
  return createElement('output', null, useContentLocale());
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Content i18n', () => {
  it('uses the saved locale or the first supported Accept-Language', async () => {
    vi.stubGlobal('chrome', {
      i18n: { getAcceptLanguages: vi.fn(async () => ['en-US', 'ko-KR']) },
    });

    await expect(resolveContentLocale('default')).resolves.toBe('en');
    await expect(resolveContentLocale('ko')).resolves.toBe('ko');
    expect(t('ko', 'lineup')).toBe('라인업');
    expect(t('en', 'lineupError', { error: 'failed' })).toBe(
      'Failed to load lineup data: failed',
    );
  });

  it('falls back to English when Accept-Language has no supported locale', async () => {
    vi.stubGlobal('chrome', {
      i18n: { getAcceptLanguages: vi.fn(async () => ['fr-FR']) },
    });

    await expect(resolveContentLocale('default')).resolves.toBe('en');
  });

  it('renders saved locales without waiting for Accept-Language', () => {
    const { rerender } = render(
      createElement(ContentI18nProvider, {
        setting: 'ko',
        children: createElement(LocaleProbe),
      }),
    );
    expect(screen.getByText('ko')).toBeTruthy();

    rerender(
      createElement(ContentI18nProvider, {
        setting: 'en',
        children: createElement(LocaleProbe),
      }),
    );
    expect(screen.getByText('en')).toBeTruthy();
  });

  it('does not let a stale default resolution overwrite a saved locale', async () => {
    let resolveLanguages!: (languages: string[]) => void;
    vi.stubGlobal('chrome', {
      i18n: {
        getAcceptLanguages: vi.fn(
          () =>
            new Promise<string[]>((resolve) => {
              resolveLanguages = resolve;
            }),
        ),
      },
    });
    const { rerender } = render(
      createElement(ContentI18nProvider, {
        setting: 'default',
        children: createElement(LocaleProbe),
      }),
    );

    rerender(
      createElement(ContentI18nProvider, {
        setting: 'ko',
        children: createElement(LocaleProbe),
      }),
    );
    resolveLanguages(['en-US']);
    await Promise.resolve();

    expect(screen.getByText('ko')).toBeTruthy();
  });
});
