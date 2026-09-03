import { handleRuntimeMessage } from '@/background/api/runtimeMessageHandler';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (message: unknown, sender, sendResponse) => {
      void handleRuntimeMessage(message, sender).then(sendResponse);
      return true;
    },
  );
});
