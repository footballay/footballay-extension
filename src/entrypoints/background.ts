import { handleRuntimeMessage } from '@/background/api/runtimeMessageHandler';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      void handleRuntimeMessage(message).then(sendResponse);
      return true;
    },
  );
});
