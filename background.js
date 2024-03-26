'use strict';

chrome.action.onClicked.addListener(() =>
    chrome.tabs.query({ active: true, currentWindow: true }, async ([currentTab]) => {
        if (!currentTab?.url) return;

        const originRegex = /(^https?:\/\/)[^\/]+/gi;
        const currentUrl = currentTab.url.match(originRegex)?.[0];

        if (currentUrl) {
            const options = {
                cacheStorage: true,
                cookies: true,
                fileSystems: true,
                indexedDB: true,
                localStorage: true,
                pluginData: true,
                serviceWorkers: true,
                webSQL: true
            };

            await chrome.browsingData.remove({ origins: [currentUrl] }, options);

            const entries = Object.keys(options);
            const intervalId = setInterval(() => {
                const currentKey = entries.shift();

                if (currentKey) {
                    return chrome.action.setBadgeText({ text: currentKey });
                }

                clearInterval(intervalId);

                chrome.action.setBadgeText({ text: 'Done' });
                setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1500);
            }, 100);
        }
    })
);
