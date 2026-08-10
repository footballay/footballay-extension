import { mountContentApp } from "@/content/bootstrap/mountContentApp";

export default defineContentScript({
  matches: ["https://www.coupangplay.com/*"],
  main(ctx) {
    mountContentApp(ctx);
  }
});
