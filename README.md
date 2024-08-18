# Self-Destructing Cache

Enhance privacy on the web. Gets rid of a site's cookies and stored data as
soon as you close its tabs. Trustworthy services can be whitelisted.

## How it works

This extension will keep a list of open tabs and its domain.
If the domain changes, it will be scheduled for destruction.
Every 3 minutes it will destroy data for scheduled domains.
If the full domain is not active anywhere else, the storage will be destroyed.
If the root domain is not active anywhere else, the cookies will be destroyed.
Any not whitelisted site's cookies and data will be destroyed on loading the extension.

## Release

- npm version patch
- npm version minor
- npm version major

## Resources

- https://developer.chrome.com/docs/extensions/reference/api
- https://developer.chrome.com/docs/extensions/reference/api/alarms
- https://developer.chrome.com/docs/extensions/reference/api/browsingData
- https://developer.chrome.com/docs/extensions/reference/api/tabs
- https://github.com/GoogleChrome/chrome-extensions-samples
- https://github.com/Cookie-AutoDelete/Cookie-AutoDelete
