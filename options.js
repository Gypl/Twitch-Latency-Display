document.addEventListener("DOMContentLoaded", async ()=>{
    /** @param {Options} storage_items */
    function chromestorage_option_load(storage_items){
        /** @type {Options} */ const items = { ...default_options, ...storage_items };
        Object.entries(items).forEach(([key, value]) => {
            const inputbox = document.getElementById(key);
            console.log(key, value, inputbox);
            if(!(inputbox instanceof HTMLInputElement)) return;
            if(inputbox.type === "checkbox") inputbox.checked = value;
            else if(inputbox.type === "number") inputbox.value = value;
        });
    }
    chromestorage_option_load(await chrome.storage.local.get(null));
    document.addEventListener("change", async e=>{
        if(!(e.target instanceof HTMLInputElement) || !e.target.id) return;
        const value = (e.target.type === "checkbox") ? e.target.checked : (e.target.type === "number" ? Number(e.target.value) : (()=>{throw new Error("Unexpected input type")})());
        await chrome.storage.local.set({[e.target.id]: value}).catch(e=>{throw e});
        console.log(value, "save", e.target.id);
    });
    document.querySelectorAll("[data-locale]").forEach(elem => {
        (locale=>locale && (elem.innerHTML = chrome.i18n.getMessage(locale)))(elem.getAttribute("data-locale"));
    });
    const reduceBuffer_btn = /** @type {HTMLButtonElement} */ (document.querySelector(".ReduceBuffer_btn"));
	reduceBuffer_btn.addEventListener("click", function() {
        chrome.tabs.query({active: true, currentWindow: true, url: "*://www.twitch.tv/*"}, function(tabs) {
            if(tabs.length && tabs[0]){
                ReduceBuffer_func(tabs[0]);
            }
        });
		this.blur();
	});
    chrome.tabs.query({active: true, currentWindow: true, url: "*://www.twitch.tv/*"}, function(tabs) {
        if(tabs.length) reduceBuffer_btn.disabled = false;
    });
    /** @param {chrome.tabs.Tab} tab */
    function ReduceBuffer_func(tab){
        tab.id && chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => FF_Btn.ffClick(),
        }, console.log);
    }
});

