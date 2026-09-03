export function isFootballayAlreadyMounted(): boolean {
  return document.getElementById('footballay-content-root') !== null;
}

export async function getActiveTabMountStatus(): Promise<
  { tabId: number; mounted: boolean } | undefined
> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) return undefined;

  const [mountCheck] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: isFootballayAlreadyMounted,
  });
  return { tabId: tab.id, mounted: mountCheck?.result === true };
}

export async function runOnCurrentTab(): Promise<boolean> {
  const status = await getActiveTabMountStatus();
  if (!status || status.mounted) return status?.mounted ?? false;

  await chrome.scripting.insertCSS({
    target: { tabId: status.tabId },
    files: ['content-scripts/content.css'],
  });
  await chrome.scripting.executeScript({
    target: { tabId: status.tabId },
    files: ['content-scripts/content.js'],
  });
  return true;
}
