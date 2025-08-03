import browser from 'webextension-polyfill';
import { StorageKey } from './types';

interface ActiveTabs {
  [key: number]: string;
}

interface ScheduledDomains {
  [key: string]: number;
}

const cleanupInterval = 1 * 60 * 1000;

export async function getLastHeartbeat(): Promise<number> {
  return await browser.storage.session
    .get(StorageKey.LastHeartbeat)
    .then((record) => record[StorageKey.LastHeartbeat] as number);
}

export async function setLastHeartbeat(): Promise<void> {
  await browser.storage.session.set({
    [StorageKey.LastHeartbeat]: new Date().getTime(),
  });
}

export async function getActiveTabs(): Promise<ActiveTabs> {
  return await browser.storage.session
    .get(StorageKey.ActiveTabs)
    .then((record) => (record[StorageKey.ActiveTabs] ?? {}) as ActiveTabs);
}

export async function getActiveTab(tabId: number): Promise<string | null> {
  const activeTabs: ActiveTabs = await browser.storage.session
    .get(StorageKey.ActiveTabs)
    .then((record) => (record[StorageKey.ActiveTabs] ?? {}) as ActiveTabs);

  return activeTabs[tabId] ?? undefined;
}

export async function setActiveTab(tabId: number, hostname: string): Promise<void> {
  const activeTabs: ActiveTabs = await browser.storage.session
    .get(StorageKey.ActiveTabs)
    .then((record) => (record[StorageKey.ActiveTabs] ?? {}) as ActiveTabs);

  activeTabs[tabId] = hostname;

  await browser.storage.session.set({
    [StorageKey.ActiveTabs]: activeTabs,
  });
}

export async function unsetActiveTab(tabId: number): Promise<void> {
  const activeTabs: ActiveTabs = await browser.storage.session
    .get(StorageKey.ActiveTabs)
    .then((record) => (record[StorageKey.ActiveTabs] ?? {}) as ActiveTabs);

  delete activeTabs[tabId];

  await browser.storage.session.set({
    [StorageKey.ActiveTabs]: activeTabs,
  });
}

export async function getScheduledDomains(): Promise<ScheduledDomains> {
  return await browser.storage.session
    .get(StorageKey.ScheduledDomains)
    .then((record) => (record[StorageKey.ScheduledDomains] ?? {}) as ScheduledDomains);
}

export async function setScheduledDomains(scheduledDomains: ScheduledDomains): Promise<void> {
  await browser.storage.session.set({
    [StorageKey.ScheduledDomains]: scheduledDomains,
  });
}

export async function scheduleDomainForDestruction(hostname: string): Promise<void> {
  const scheduledDomains: ScheduledDomains = await browser.storage.session
    .get(StorageKey.ScheduledDomains)
    .then((record) => (record[StorageKey.ScheduledDomains] ?? {}) as ScheduledDomains);

  scheduledDomains[hostname] = new Date().getTime() + cleanupInterval;

  await browser.storage.session.set({
    [StorageKey.ScheduledDomains]: scheduledDomains,
  });
}

export async function unscheduleDomainForDestruction(hostname: string): Promise<void> {
  const scheduledDomains: ScheduledDomains = await browser.storage.session
    .get(StorageKey.ScheduledDomains)
    .then((record) => (record[StorageKey.ScheduledDomains] ?? {}) as ScheduledDomains);

  delete scheduledDomains[hostname];

  await browser.storage.session.set({
    [StorageKey.ScheduledDomains]: scheduledDomains,
  });
}
