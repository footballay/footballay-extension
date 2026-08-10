import { handleApiRequest } from "@/background/api/apiRequestHandler";

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    void handleApiRequest(message).then(sendResponse);
    return true;
  });
});
