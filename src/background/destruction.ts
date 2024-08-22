import { getRootDomain } from './utils';
import { getActiveTabs, getScheduledDomains, unscheduleDomainForDestruction } from './storage';

const excludeOrigins: string[] = [
  // Google
  'https://myaccount.google.com',
  'https://accounts.google.com',
  'https://mail.google.com',
  'https://calendar.google.com',
  'https://keep.google.com',
  // Microsoft
  'https://www.office.com',
  'https://www.sharepoint.de',
  'https://www.live.com',
  'https://www.bing.com',
  'https://myaccount.microsoft.com',
  // Work
  'https://www.ottonova.de',
  'https://www.on.ag',
  'https://www.miro.com',
  'https://1password.com',
  'https://app.yoffix.com',
  // Proton
  'https://www.proton.me',
  'https://account.proton.me',
  'https://account-api.proton.me',
  'https://mail.proton.me',
  'https://app.simplelogin.io',
  // Others
  'https://myprivacy.dpgmedia.nl',
  'https://www.feedly.com',
  'https://www.getpocket.com',
  'https://www.github.com',
  'https://www.nzbgeek.info',
];

const whitelist = excludeOrigins.map((url) => new URL(url).hostname.replace('www.', ''));

const cookiesToRemove: chrome.browsingData.DataTypeSet = {
  cookies: true,
};

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
    .remove(
      {
        excludeOrigins: excludeOrigins,
      },
      { ...cacheToRemove, ...cookiesToRemove }
    )
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
  await chrome.browsingData
    .remove(
      {
        origins: origins,
      },
      dataToRemove
    )
    .then(() => {
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

      console.log(`hostname ${hostname} is scheduled for destruction`);
      await destroyDataForDomain(hostname, includeCookies);
      await unscheduleDomainForDestruction(hostname);
    }
  });
}
