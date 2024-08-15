//import './scripts/tools.js';

const excludeOrigins = [
    "https://myaccount.google.com",
    "https://accounts.google.com",
    "https://mail.google.com",
    "https://calendar.google.com",
    "https://keep.google.com",
    "https://app.simplelogin.io",
    "https://www.getpocket.com",
    "https://www.feedly.com",
    "https://www.proton.me",
    "https://mail.proton.me",
    "https://account.proton.me",
    "https://account-api.proton.me",
    "https://www.github.com",
    "https://www.nzbgeek.info",
    "https://myprivacy.dpgmedia.nl"
];

const dataToRemove = {
    "cache": true,
    "cacheStorage": true,
    "cookies": true,
    "fileSystems": true,
    "indexedDB": true,
    "localStorage": true,
    "serviceWorkers": true,
    "webSQL": true
    //appcache: true,
    //downloads: true,
    //formData: true,
    //history: true,
};

// Clear browsing data on extension loading
chrome.browsingData.remove(
    {
        "excludeOrigins": excludeOrigins
    },
    dataToRemove,
    () => { console.log(`cache and cookies cleared on startup`); }
);

const activeTabs = [];
const scheduledDomains = [];

/**
 * Handles the event when a tab is activated.
 *
 * @param {object} activeInfo - Information about the activated tab.
 * @return {void}
 */
const onTabActivated = function (activeInfo) {
    console.debug("tabs.onActivated", activeInfo);
    chrome.tabs.get(activeInfo.tabId, onTabInfo);
}

/**
 * Handles the event when a tab's information is retrieved.
 *
 * @param {object} tab - The tab object containing the tab's information.
 * @return {void}
 */
const onTabInfo = function (tab) {
    console.debug("tabs.get", tab);
    if (!tab || !tab.url) {
        return;
    }

    setDomainForTab(tab.id, tab.url);
}

/**
 * Handles the event when a tab is updated.
 *
 * @param {number} tabId - The ID of the updated tab.
 * @param {object} changeInfo - Information about the changes made to the tab.
 * @param {object} tab - The updated tab object.
 * @return {void}
 */
const onTabUpdated = function (tabId, changeInfo, tab) {
    console.debug("tabs.onUpdated", tabId, changeInfo, tab);
    if (!changeInfo.url) {
        return;
    }

    setDomainForTab(tabId, changeInfo.url);
}

/**
 * Handles the event when a tab is removed.
 *
 * @param {number} tabId - The ID of the removed tab.
 * @param {object} removeInfo - Information about the removal.
 * @return {void}
 */
const onTabRemoved = function (tabId, removeInfo) {
    console.debug("tabs.onRemoved", tabId, removeInfo);
    if (!activeTabs[tabId]) {
        return;
    }

    scheduleDomainCleanup(activeTabs[tabId]);
    delete activeTabs[tabId];

    console.debug(activeTabs, scheduledDomains);
}

/**
 * Extracts the domain from a given URL.
 *
 * @param {string} url - the URL to extract the domain from
 * @return {string} the extracted domain
 */
function getDomainFromUrl(url) {
    let hostname = new URL(url).hostname;
    let domain = hostname.match(/^(?:.*?\.)?([a-zA-Z0-9\-_]{3,}\.(?:\w{2,8}|\w{2,4}\.\w{2,4}))$/)[1];

    return domain.replace("www.", "");
}

/**
 * Sets the domain for a given tab and schedules cleanup for an obsolete domain.
 *
 * @param {number} tabId - the ID of the tab
 * @param {string} url - the URL of the tab
 * @return {void}
 */
function setDomainForTab(tabId, url) {
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
        return;
    }

    const currentDomain = getDomainFromUrl(url);
    const previousDomain = activeTabs[tabId] ?? null;
    if (previousDomain && currentDomain !== previousDomain) {
        scheduleDomainCleanup(previousDomain);
    }

    if (currentDomain !== previousDomain) {
        console.debug(`set domain ${currentDomain} for tab ${tabId}`);
    }

    activeTabs[tabId] = currentDomain;
    delete scheduledDomains[currentDomain];

    console.debug(activeTabs, scheduledDomains);
}

/**
 * Schedules a domain for cleanup.
 *
 * @param {string} domain - the domain to be scheduled for cleanup
 * @return {void}
 */
function scheduleDomainCleanup(domain) {
    if (excludeOrigins.some(url => url.includes(domain))) {
        console.log(`skipping scheduling cleanup for excluded domain ${domain}`);
        return;
    }

    console.info(`scheduling domain ${domain} for cleanup`);

    scheduledDomains[domain] = Date.now() + 5 * 60 * 1000;

    console.debug(activeTabs, scheduledDomains);
}

/**
 * Cleans up the browsing data for a given domain.
 *
 * @param {string} domain - the domain to be cleaned up
 * @return {void}
 */
function cleanupDomain(domain) {
    if (excludeOrigins.some(url => url.includes(domain))) {
        delete scheduledDomains[domain];
        console.info(`skipping cleanup for excluded domain ${domain}`);
        return;
    }

    if (activeTabs.some(url => url.includes(domain))) {
        delete scheduledDomains[domain];
        console.info(`skipping cleanup for active domain ${domain}`);
        return;
    }

    chrome.browsingData.remove(
        {
            "origins": [
                `https://${domain}`,
                `http://${domain}`
            ],
        },
        dataToRemove,
        () => { console.info(`domain ${domain} was cleaned up`); }
    );

    delete scheduledDomains[domain];
}

// Set alarm
chrome.alarms.create('cleanup-domains', {
    delayInMinutes: 1,
    periodInMinutes: 1
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
