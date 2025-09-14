import { browser, Browser } from 'wxt/browser';
import { getRootDomain } from './utils';
import { getActiveTabs, getScheduledDomains, unscheduleDomainForDestruction } from './storage';
import { WHITELISTED_DOMAINS } from './constants';

const whitelist = WHITELISTED_DOMAINS.map((url: string) =>
  new URL(url).hostname.replace('www.', '')
);

const cookiesToRemove: Browser.browsingData.DataTypeSet = {
  cookies: true,
};

const cacheToRemove: Browser.browsingData.DataTypeSet = {
  cache: true,
  cacheStorage: true,
  localStorage: true,
  fileSystems: true,
  indexedDB: true,
  serviceWorkers: true,
  webSQL: true,
};

export async function destroyAllData(): Promise<void> {
  await browser.browsingData
    .remove({ excludeOrigins: WHITELISTED_DOMAINS }, { ...cacheToRemove, ...cookiesToRemove })
    .then(() => {
      console.log(`[*] all cookies and data destroyed`);
    });
}

export async function destroyData(): Promise<void> {
  const now = Date.now();
  const scheduledDomains = await getScheduledDomains();

  if (Object.keys(scheduledDomains).length === 0) {
    return;
  }

  console.log('⚡ Processing domains scheduled for destruction');

  Object.keys(scheduledDomains).forEach(async (hostname, _index) => {
    if (scheduledDomains[hostname] < now) {
      const rootDomain = getRootDomain(hostname);
      if (whitelist.some((whitelistedDomain) => whitelistedDomain.includes(rootDomain))) {
        await unscheduleDomainForDestruction(hostname);
        console.log(`🏳️ ${rootDomain} is whitelisted`);
        return;
      }

      const activeTabs = Object.values(await getActiveTabs());
      if (activeTabs.some((host) => host === hostname)) {
        await unscheduleDomainForDestruction(hostname);
        console.log(`▐▐ ${hostname} is still active`);
        return;
      }

      let includeCookies = true;
      if (activeTabs.some((host) => host.includes(rootDomain))) {
        includeCookies = false;
      }

      await destroyDataForDomainInChrome(hostname, includeCookies);
      await destroyDataForDomainInFirefox(hostname, includeCookies);
      await unscheduleDomainForDestruction(hostname);
    }
  });
}

export async function destroyDataForDomainInChrome(
  domain: string,
  includeCookies: boolean
): Promise<void> {
  if (!import.meta.env.CHROME) {
    return;
  }

  const origins: [string, ...string[]] = [`https://${domain}`, `http://${domain}`];
  let dataToRemove: Browser.browsingData.DataTypeSet = {
    cache: true,
    localStorage: true,
    indexedDB: true,
    serviceWorkers: true,
  };
  if (includeCookies) {
    const rootDomain = getRootDomain(domain);
    origins.push(`https://www.${rootDomain}`);
    origins.push(`http://www.${rootDomain}`);
    dataToRemove = { ...dataToRemove, ...cookiesToRemove };
  }

  await browser.browsingData.remove({ origins: origins }, dataToRemove).then(() => {
    console.log(`💀 ${domain}`);
  });
}

export async function destroyDataForDomainInFirefox(
  domain: string,
  includeCookies: boolean
): Promise<void> {
  if (!import.meta.env.FIREFOX) {
    return;
  }

  const origins: [string, ...string[]] = [`${domain}`];
  let dataToRemove: Browser.browsingData.DataTypeSet = {
    cache: true,
    localStorage: true,
    indexedDB: true,
    serviceWorkers: true,
  };
  if (includeCookies) {
    const rootDomain = getRootDomain(domain);
    origins.push(`${rootDomain}`);
    dataToRemove = { ...dataToRemove, ...cookiesToRemove };
  }

  await browser.browsingData.remove({ hostnames: origins }, dataToRemove).then(() => {
    console.log(`💀 ${domain}`);
  });
}
