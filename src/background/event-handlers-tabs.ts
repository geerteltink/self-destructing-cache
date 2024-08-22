import browser from 'webextension-polyfill';
import { getHostname, isUrl } from './utils';
import {
  dumpStorage,
  getActiveTab,
  scheduleDomainForDestruction,
  setActiveTab,
  unsetActiveTab,
} from './storage';

export async function onActivated(
  activeInfo: browser.Tabs.OnActivatedActiveInfoType
): Promise<void> {
  console.log('[onActivated]', `tab ${activeInfo.tabId} activated`);
  await browser.tabs.get(activeInfo.tabId).then(async (tab: browser.Tabs.Tab): Promise<void> => {
    if (!tab || !tab.url || !isUrl(tab.url)) {
      return;
    }

    console.log('[onActivated]', `tab ${tab.id} changed url: ${tab.url}`);

    const currentHostname = getHostname(tab.url);
    const previousHostname = await getActiveTab(activeInfo.tabId);
    if (previousHostname && previousHostname !== currentHostname) {
      await scheduleDomainForDestruction(previousHostname);
    }

    await setActiveTab(activeInfo.tabId, currentHostname);
    await dumpStorage();
  });
}

export async function onTabUpdated(
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  _tab: browser.Tabs.Tab
): Promise<void> {
  if (!changeInfo.url || !isUrl(changeInfo.url)) {
    return;
  }

  console.log('[onTabUpdated]', `tab ${tabId} changed url: ${changeInfo.url}`);

  const currentHostname = getHostname(changeInfo.url);
  const previousHostname = await getActiveTab(tabId);
  if (previousHostname && previousHostname !== currentHostname) {
    await scheduleDomainForDestruction(previousHostname);
  }

  await setActiveTab(tabId, currentHostname);
  await dumpStorage();
}

export async function onTabRemoved(
  tabId: number,
  _removeInfo: browser.Tabs.OnRemovedRemoveInfoType
): Promise<void> {
  console.log('[onTabRemoved]', `tab ${tabId} removed`);

  const hostname = await getActiveTab(tabId);
  if (!hostname) {
    return;
  }

  await scheduleDomainForDestruction(hostname);
  await unsetActiveTab(tabId);
  await dumpStorage();
}
