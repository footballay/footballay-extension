import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { ContentApp } from '@/content/ContentApp';
import { startMatchDataSync, stopMatchDataSync } from '@/content/matchDataSync';

/** Mounts the React Content App into the current page and removes it on invalidation. */
export function mountToPage(ctx: ContentScriptContext): void {
  let root: ReturnType<typeof createRoot> | undefined;
  let rootElement: HTMLDivElement | undefined;

  function mount() {
    if (root) return;

    startMatchDataSync();
    rootElement = document.createElement('div');
    rootElement.id = 'footballay-content-root';
    document.documentElement.append(rootElement);
    root = createRoot(rootElement);
    root.render(createElement(ContentApp));
  }

  function unmount() {
    if (!root || !rootElement) return;

    stopMatchDataSync();
    root.unmount();
    rootElement.remove();
    root = undefined;
    rootElement = undefined;
  }

  function syncMount() {
    if (/^\/play\/[^/]+\/live\/?$/.test(location.pathname)) mount();
    else unmount();
  }

  syncMount();
  ctx.addEventListener(window, 'wxt:locationchange', syncMount);
  ctx.onInvalidated(unmount);
}
