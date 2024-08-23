import browser from 'webextension-polyfill';
import { getHostname, isUrl } from './utils';
import {
  getActiveTab,
  scheduleDomainForDestruction,
  setActiveTab,
  unsetActiveTab,
} from './storage';

export async function onActivated(
  activeInfo: browser.Tabs.OnActivatedActiveInfoType
): Promise<void> {
  await browser.tabs.get(activeInfo.tabId).then(async (tab: browser.Tabs.Tab): Promise<void> => {
    if (!tab || !tab.url || !isUrl(tab.url)) {
      return;
    }

    const currentHostname = getHostname(tab.url);
    const previousHostname = await getActiveTab(activeInfo.tabId);
    if (previousHostname && previousHostname !== currentHostname) {
      await scheduleDomainForDestruction(previousHostname);
      console.log(`[${previousHostname}] scheduled for destruction`);
      console.log(`[${currentHostname}] tab ${tab.id} domain changed`);
    }

    await setActiveTab(activeInfo.tabId, currentHostname);
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

  const currentHostname = getHostname(changeInfo.url);
  const previousHostname = await getActiveTab(tabId);
  if (previousHostname && previousHostname !== currentHostname) {
    await scheduleDomainForDestruction(previousHostname);
    console.log(`[${previousHostname}] scheduled for destruction`);
    console.log(`[${currentHostname}] tab ${tabId} domain changed`);
  }

  await setActiveTab(tabId, currentHostname);
}

export async function onTabRemoved(
  tabId: number,
  _removeInfo: browser.Tabs.OnRemovedRemoveInfoType
): Promise<void> {
  const hostname = await getActiveTab(tabId);
  if (!hostname) {
    return;
  }

  await scheduleDomainForDestruction(hostname);
  await unsetActiveTab(tabId);
}
