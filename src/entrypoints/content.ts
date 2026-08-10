import { mountToPage } from "@/content/mountToPage";

export default defineContentScript({
  matches: ["https://www.coupangplay.com/*"],
  main(ctx) {
    mountToPage(ctx);
  }
});
