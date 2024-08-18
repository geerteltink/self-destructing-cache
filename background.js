const excludeOrigins = [
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

const cookiesToRemove = {
  cookies: true,
};

const dataToRemove = {
  appcache: true,
  cacheStorage: true,
  fileSystems: true,
  indexedDB: true,
  localStorage: true,
  serviceWorkers: true,
  webSQL: true,
};

// Clear all browsing data on extension loading
chrome.browsingData.remove(
  {
    excludeOrigins: excludeOrigins,
  },
  { ...cookiesToRemove, ...dataToRemove },
  () => {
    console.log(`[all] cookies and data destroyed on startup`);
  }
);

const activeTabs = [];
const scheduledDomains = [];
const cleanupInterval = 1 * 60 * 1000;

/**
 * Handles the event when a tab is activated.
 *
 * @param {object} activeInfo - Information about the activated tab.
 * @return {void}
 */
const onTabActivated = function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, onTabInfo);
};

/**
 * Handles the event when a tab's information is retrieved.
 *
 * @param {object} tab - The tab object containing the tab's information.
 * @return {void}
 */
const onTabInfo = function (tab) {
  if (!tab || !tab.url) {
    return;
  }

  setDomainForTab(tab.id, tab.url);
};

/**
 * Handles the event when a tab is updated.
 *
 * @param {number} tabId - The ID of the updated tab.
 * @param {object} changeInfo - Information about the changes made to the tab.
 * @param {object} tab - The updated tab object.
 * @return {void}
 */
const onTabUpdated = function (tabId, changeInfo, _tab) {
  if (!changeInfo.url) {
    return;
  }

  setDomainForTab(tabId, changeInfo.url);
};

/**
 * Handles the event when a tab is removed.
 *
 * @param {number} tabId - The ID of the removed tab.
 * @param {object} removeInfo - Information about the removal.
 * @return {void}
 */
const onTabRemoved = function (tabId, _removeInfo) {
  if (!activeTabs[tabId]) {
    return;
  }

  scheduleDomainCleanup(activeTabs[tabId]);
  delete activeTabs[tabId];
};

/**
 * Extracts the root domain from a given hostname.
 *
 * @param {string} hostname - the hostname to extract the root domain from
 * @return {string} the extracted root domain
 */
function getRootDomain(hostname) {
  const elems = hostname.split('.');
  const iMax = elems.length - 1;

  const elem1 = elems[iMax - 1];
  const elem2 = elems[iMax];

  const isSecondLevelDomain = iMax >= 3 && (elem1 + elem2).length <= 5;
  return (isSecondLevelDomain ? elems[iMax - 2] + '.' : '') + elem1 + '.' + elem2;
}

/**
 * Extracts the hostname from a given URL.
 *
 * @param {string} url - the URL to extract the hostname from
 * @return {string} the extracted hostname
 */
function getHostname(url) {
  const hostname = new URL(url).hostname;

  return hostname.replace('www.', '');
}

/**
 * Sets the domain for a given tab and schedules cleanup for an obsolete domain.
 *
 * @param {number} tabId - the ID of the tab
 * @param {string} url - the URL of the tab
 * @return {void}
 */
function setDomainForTab(tabId, url) {
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return;
  }

  const currentDomain = getHostname(url);
  const previousDomain = activeTabs[tabId] ?? null;
  if (previousDomain && currentDomain !== previousDomain) {
    scheduleDomainCleanup(previousDomain);
  }

  activeTabs[tabId] = currentDomain;
  delete scheduledDomains[currentDomain];
}

/**
 * Schedule a domain for cleanup.
 *
 * @param {string} domain - the domain to be scheduled for cleanup
 * @return {void}
 */
function scheduleDomainCleanup(domain) {
  const rootDomain = getRootDomain(domain);
  if (whitelist.some((whitelistedDomain) => whitelistedDomain.includes(rootDomain))) {
    console.log(`[${rootDomain}] skipping destructing excluded domain`);
    return;
  }

  scheduledDomains[domain] = Date.now() + cleanupInterval;
  console.info(`[${domain}] scheduled for destruction`);
}

/**
 * Cleans up the browsing data for a given domain.
 *
 * @param {string} domain - the domain to be cleaned up
 * @return {void}
 */
function cleanupDomain(domain) {
  const rootDomain = getRootDomain(domain);
  if (whitelist.some((whitelistedDomain) => whitelistedDomain.includes(rootDomain))) {
    delete scheduledDomains[domain];
    console.log(`[${rootDomain}] skipping destructing excluded domain`);
    return;
  }

  // Don't remove data if any tab has the domain open
  if (activeTabs.some((url) => url.includes(domain))) {
    delete scheduledDomains[domain];
    console.log(`[${domain}] skipping data destruction for active domain`);
    return;
  }

  chrome.browsingData.remove(
    {
      origins: [`https://${domain}`, `http://${domain}`],
    },
    dataToRemove,
    () => {
      console.info(`[${domain}] data destroyed`);
    }
  );

  // Don't remove cookies if any tab has the root domain open
  if (activeTabs.some((url) => url.includes(rootDomain))) {
    delete scheduledDomains[domain];
    console.log(`[${domain}] skipping cookie destruction for active domain`);
    return;
  }

  chrome.browsingData.remove(
    {
      origins: [
        `https://www.${rootDomain}`,
        `http://www.${rootDomain}`,
        `https://${domain}`,
        `http://${domain}`,
      ],
    },
    { ...cookiesToRemove, ...dataToRemove },
    () => {
      console.info(`[${domain}] cookies and data destroyed`);
    }
  );

  delete scheduledDomains[domain];
}

// Set alarm
chrome.alarms.create('cleanup-domains', {
  delayInMinutes: 1,
  periodInMinutes: 1,
});

// Register alarm handler
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'cleanup-domains') {
    return;
  }

  const now = Date.now();
  for (const domain in scheduledDomains) {
    if (scheduledDomains[domain] < now) {
      cleanupDomain(domain);
    }
  }
});

// Register event listeners
chrome.tabs.onActivated.addListener(onTabActivated);
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.tabs.onRemoved.addListener(onTabRemoved);
