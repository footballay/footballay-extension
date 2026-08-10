import type { RuntimeMessage, RuntimeResponse } from "@/shared/messages";

// Sends a message from the popup to the content script running in the current active tab.
// Returns null when the active tab is missing or the page cannot receive extension messages.
export async function sendActiveTabMessage(message: RuntimeMessage): Promise<RuntimeResponse | null> {
  const activeTab = await getActiveTab();
  if (!activeTab?.id) {
    return null;
  }

  try {
    return (await chrome.tabs.sendMessage(activeTab.id, message)) as RuntimeResponse;
  } catch {
    return null;
  }
}

// Chrome tab APIs are callback-like browser state reads, so keep them behind this wrapper.
// Popup flows can then ask for "the active tab" without knowing the chrome.tabs query shape.
export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return activeTab ?? null;
}

// Fixture API requests need the browser timezone so the backend can resolve dates correctly.
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
