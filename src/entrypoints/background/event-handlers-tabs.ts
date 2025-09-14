import { browser } from 'wxt/browser';
import { getHostname, isUrl } from './utils';
import {
  getActiveTab,
  scheduleDomainForDestruction,
  setActiveTab,
  unsetActiveTab,
} from './storage';

export async function onActivated(activeInfo: { tabId: number }): Promise<void> {
  await browser.tabs.get(activeInfo.tabId).then(async (tab: any): Promise<void> => {
    if (!tab || !tab.url || !isUrl(tab.url)) {
      return;
    }

    const currentHostname = getHostname(tab.url);
    const previousHostname = await getActiveTab(activeInfo.tabId);
    if (previousHostname && previousHostname !== currentHostname) {
      await scheduleDomainForDestruction(previousHostname);
    }

    await setActiveTab(activeInfo.tabId, currentHostname);
  });
}

export async function onTabUpdated(
  tabId: number,
  changeInfo: Browser.tabs.OnUpdatedInfo,
  _tab: any
): Promise<void> {
  if (!changeInfo.url || !isUrl(changeInfo.url)) {
    return;
  }

  const currentHostname = getHostname(changeInfo.url);
  const previousHostname = await getActiveTab(tabId);
  if (previousHostname && previousHostname !== currentHostname) {
    await scheduleDomainForDestruction(previousHostname);
  }

  await setActiveTab(tabId, currentHostname);
}

export async function onTabRemoved(
  tabId: number,
  _removeInfo: Browser.tabs.OnRemovedInfo
): Promise<void> {
  const hostname = await getActiveTab(tabId);
  if (!hostname) {
    return;
  }

  await scheduleDomainForDestruction(hostname);
  await unsetActiveTab(tabId);
}
