import { getRootDomain } from './utils';
import { getActiveTabs, getScheduledDomains, unscheduleDomainForDestruction } from './storage';
import { WHITELISTED_DOMAINS } from './constants';

const whitelist = WHITELISTED_DOMAINS.map((url: string) =>
  new URL(url).hostname.replace('www.', '')
);

const cookiesToRemove: chrome.browsingData.DataTypeSet = { cookies: true };

const cacheToRemove: chrome.browsingData.DataTypeSet = {
  appcache: true,
  cacheStorage: true,
  fileSystems: true,
  indexedDB: true,
  localStorage: true,
  serviceWorkers: true,
  webSQL: true,
};

export async function destroyAllData(): Promise<void> {
  // TODO: does the browser polyfill support excluding origins?
  await chrome.browsingData
    .remove({ excludeOrigins: WHITELISTED_DOMAINS }, { ...cacheToRemove, ...cookiesToRemove })
    .then(() => {
      console.log(`[*] all cookies and data destroyed`);
    });
}

export async function destroyDataForDomain(domain: string, includeCookies: boolean): Promise<void> {
  const origins = [`https://${domain}`, `http://${domain}`];
  let dataToRemove = cacheToRemove;
  if (includeCookies) {
    const rootDomain = getRootDomain(domain);
    origins.push(`https://www.${rootDomain}`);
    origins.push(`http://www.${rootDomain}`);
    dataToRemove = { ...dataToRemove, ...cookiesToRemove };
  }

  // TODO: convert to browser polyfill
  await chrome.browsingData.remove({ origins: origins }, dataToRemove).then(() => {
    console.log(`[${domain}] data destroyed`);
  });
}

export async function destroyData(): Promise<void> {
  const now = Date.now();

  // Check active tabs
  // If tab is not active anymore, schedule for deletion
  // Check scheduled tabs
  const scheduledDomains = await getScheduledDomains();
  Object.keys(scheduledDomains).forEach(async (hostname, _index) => {
    if (scheduledDomains[hostname] < now) {
      const rootDomain = getRootDomain(hostname);
      if (whitelist.some((whitelistedDomain) => whitelistedDomain.includes(rootDomain))) {
        await unscheduleDomainForDestruction(hostname);
        console.log(`[${rootDomain}] skipping destructing excluded domain`);
        return;
      }

      const activeTabs = Object.values(await getActiveTabs());
      if (activeTabs.some((host) => host == hostname)) {
        await unscheduleDomainForDestruction(hostname);
        console.log(`[${hostname}] skipping data destruction for active domain`);
        return;
      }

      let includeCookies = true;
      if (activeTabs.some((host) => host.includes(rootDomain))) {
        includeCookies = false;
      }

      await destroyDataForDomain(hostname, includeCookies);
      await unscheduleDomainForDestruction(hostname);
    }
  });
}
