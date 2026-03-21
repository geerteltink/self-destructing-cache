# Self-Destructing Cache

Enhance privacy on the web. Gets rid of a site's cookies and stored data as soon as you close its
tabs. Trustworthy services can be whitelisted.

## How it works

This extension will keep a list of open tabs and its domain. If the domain changes, it will be
scheduled for destruction. Every 3 minutes it will destroy data for scheduled domains. If the full
domain is not active anywhere else, the storage will be destroyed. If the root domain is not active
anywhere else, the cookies will be destroyed. Any not whitelisted site's cookies and data will be
destroyed on loading the extension.

## Build

```powershell
rm .\.output\ -force -recurse; npm run build; npm run zip;
```

## How to create a release

- npm version patch && git push --follow-tags
- npm version minor && git push --follow-tags
- npm version major && git push --follow-tags

## How to install it

### Firefox

Disable the Signing Requirement.

- In Firefox, go to about:config.
- Search for: xpinstall.signatures.required.
- Double-click it to set it to false.

Install it in FireFox.

- In Firefox, go to about:addons.
- Click the Gear icon ⚙️ (next to "Manage Your Extensions").
- Select "Install Add-on From File..."
- Choose the .zip file from the .output/ folder.

## Resources

- https://developer.chrome.com/docs/extensions/reference/api
- https://developer.chrome.com/docs/extensions/reference/api/alarms
- https://developer.chrome.com/docs/extensions/reference/api/browsingData
- https://developer.chrome.com/docs/extensions/reference/api/tabs
- https://github.com/GoogleChrome/chrome-extensions-samples
- https://github.com/Cookie-AutoDelete/Cookie-AutoDelete
- https://vite-plugin-web-extension.aklinker1.io/guide/
- https://github.com/aklinker1/vite-plugin-web-extension/tree/main/packages/demo-vanilla
