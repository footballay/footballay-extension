export default defineContentScript({
  matches: ["https://www.coupangplay.com/*"],
  main() {
    console.info("[Footballay] Content Script mounted");
  }
});
