import { handleDemoRuntimeMessage } from '../mock/mockResponder';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    sendResponse(handleDemoRuntimeMessage(message));
    return false;
  });
});
