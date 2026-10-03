importScripts("./default_options.js");

async function initializeDefaultSettings() {
	const items = /** @type {Options} */ (await chrome.storage.local.get(null));
	/** @type {Partial<Options>} */ const changes = {};
	(Object.entries(default_options)).forEach(([key, defaultValue]) => {
		const keyString = /** @type {keyof Options} */ (key);
		if (items[keyString] === undefined) {
			/** @type {Record<keyof Options, Options[keyof Options]>} */ (changes)[keyString] = defaultValue;
		}
	});
	if (Object.keys(changes).length > 0) {
		await chrome.storage.local.set(changes);
		console.log("Default settings initialized:", changes);
	}
}

async function injectContentScriptsToExistingTabs() {
	const tabs = await chrome.tabs.query({
		url: "*://www.twitch.tv/*",
	});
	/** @type {Promise<any>[]} */ const injectionPromises = [];
	tabs.forEach(tab => {
		if(!tab.id) return;
		injectionPromises.push(
			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				files: ["/twitch_locales.js", "/script.js"],
			})
		);
		injectionPromises.push(
			chrome.scripting.insertCSS({
				target: { tabId: tab.id },
				files: ["/twitch.css"],
			})
		);
	});
	await Promise.allSettled(injectionPromises);
}

const initializationPromise = initializeDefaultSettings();
chrome.runtime.onInstalled.addListener(async details => {
	console.log("onInstalled", details);
	if(details.reason === chrome.runtime.OnInstalledReason.INSTALL){
		await initializationPromise;
		await injectContentScriptsToExistingTabs();
	}
});