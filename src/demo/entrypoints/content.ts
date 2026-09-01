import { mountToPage } from '@/content/mountToPage';

export default defineContentScript({
  matches: ['http://localhost/src/demo/page/index.html'],
  main(ctx) {
    mountToPage(ctx);
  },
});
