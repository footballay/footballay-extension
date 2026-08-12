import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { ContentApp } from '@/content/ContentApp';

/** Mounts the React Content App into the current page and removes it on invalidation. */
export function mountToPage(ctx: ContentScriptContext): void {
  const rootElement = document.createElement('div');
  rootElement.id = 'footballay-content-root';
  document.documentElement.append(rootElement);

  const root = createRoot(rootElement);
  root.render(createElement(ContentApp));

  ctx.onInvalidated(() => {
    root.unmount();
    rootElement.remove();
  });
}
