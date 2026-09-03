import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { ContentApp } from '@/content/ContentApp';

/** Mounts the React Content App into the current page and removes it on invalidation. */
export function mountToPage(ctx: ContentScriptContext): void {
  if (document.getElementById('footballay-content-root')) return;

  let root: ReturnType<typeof createRoot> | undefined;
  let rootElement: HTMLDivElement | undefined;

  function mount() {
    rootElement = document.createElement('div');
    rootElement.id = 'footballay-content-root';
    document.documentElement.append(rootElement);
    root = createRoot(rootElement);
    root.render(createElement(ContentApp));
  }

  function unmount() {
    if (!root || !rootElement) return;

    root.unmount();
    rootElement.remove();
    root = undefined;
    rootElement = undefined;
  }

  mount();
  ctx.onInvalidated(unmount);
}
