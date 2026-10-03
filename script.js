/** @type {number} */ let encoding_latency_localvalue;
/** @type {number} */ let auto_reload_latency_localvalue;

function main_listener(interval = 900){
    let last_timeStamp = 0;
    let last_auto_reload_time = 0;
    /** @param {Event} event */
    return async function(event){
        if(event.timeStamp - last_timeStamp <= interval) return; // event throttle
        last_timeStamp = event.timeStamp;
        
        // if(!(event.target instanceof HTMLVideoElement) || !event.target.currentSrc?.startsWith("blob:")){ // 기본적으로 video가 2개가 있음 // 221215 src가 없는 유형 발견됨
        if(!(event.target instanceof HTMLVideoElement)) return;
        encoding_latency_localvalue ??= default_options.encoding_latency;
        auto_reload_latency_localvalue ??= default_options.auto_reload_latency;
        
        const now_lang = document.documentElement.getAttribute("lang");
        const output1 = document.querySelector(".chat-wysiwyg-input__placeholder"); // ".rich-input-container" 의 첫번째 자식
        const output2 = document.querySelector(`[data-a-target="chat-input"]`); // (`textarea[aria-label="메시지 보내기"]`);
        const chat_left = document.querySelector(`[data-test-selector="chat-room-component-layout"]`)?.getBoundingClientRect().left;
        if(now_lang && (output1 || output2) && chat_left && window.innerWidth > chat_left){
            const delay1 = document.querySelector(`[aria-label="${twitch_locales[now_lang]?.bufferSize}"]`)?.textContent?.match(/([0-9.]+)/)?.[1]; // Buffer Size 
            const delay2 = document.querySelector(`[aria-label="${twitch_locales[now_lang]?.latencyToBroadcaster}"]`)?.textContent.match(/([0-9.]+)/)?.[1]; // Latency To Broadcaster
            if(delay1 && delay2){
                const max_delay = Math.max(Number(delay1), Number(delay2)); // 되감기를 해서 버퍼를 인위적으로 늘릴 때, Latency To Broadcaster에 버퍼값 반영이 느려서, 큰 값을 잠시 사용
                const total_latency = max_delay + encoding_latency_localvalue;
                const text = `Total Latency: ${total_latency.toFixed(2)} sec.`;
                output1 && (output1.textContent = text);
                output2?.setAttribute("placeholder", text);
                
                if (auto_reload_latency_localvalue > 0.0 && total_latency >= auto_reload_latency_localvalue) {
                    if (Date.now() - last_auto_reload_time > auto_reload_latency_localvalue * 1000) {
                        FF_Btn.ffClick();
                        last_auto_reload_time = Date.now();
                    }
                }
            }
            else{
                show_videoStats.menuClick();
            }
            FF_Btn.create();
        }
        else{
            // console.log("chat-input off screen", !!output1, !!output2 , chat_left && window.innerWidth > chat_left);
        }
    }
}


function popupChat_intervalTimer(){
    if(!opener?.document.documentElement.getAttribute("lang")){
        console.log("opener not exists");
        return;
    }
    let last_auto_reload_time = 0;
    const loop_timer = setInterval(async ()=>{
        const now_lang = opener?.document.documentElement.getAttribute("lang");
        if(!now_lang){
            console.log("opener closed");
            clearInterval(loop_timer);
            return;
        }
        encoding_latency_localvalue ??= default_options.encoding_latency;

        auto_reload_latency_localvalue ??= default_options.auto_reload_latency;

        const output1 = document.querySelector(".chat-wysiwyg-input__placeholder");
        const output2 = document.querySelector(`[data-a-target="chat-input"]`);
        if(output1 || output2){
            const delay1 = opener.document.querySelector(`[aria-label="${twitch_locales[now_lang]?.bufferSize}"]`)?.textContent?.match(/([0-9.]+)/)?.[1]; // Buffer Size 
            const delay2 = opener.document.querySelector(`[aria-label="${twitch_locales[now_lang]?.latencyToBroadcaster}"]`)?.textContent.match(/([0-9.]+)/)?.[1]; // Latency To Broadcaster
            if(delay1 && delay2){
                const max_delay = Math.max(Number(delay1), Number(delay2));
                const total_latency = max_delay + encoding_latency_localvalue;
                const text = `Total Latency: ${total_latency.toFixed(2)} sec.`;
                output1 && (output1.textContent = text);
                output2?.setAttribute("placeholder", text);
                
                if (auto_reload_latency_localvalue > 0.0 && total_latency >= auto_reload_latency_localvalue) {
                    if (Date.now() - last_auto_reload_time > auto_reload_latency_localvalue * 1000) {
                        FF_Btn.ffClick(opener.document);
                        last_auto_reload_time = Date.now();
                    }
                }
            }
            else{
                show_videoStats.menuClick();
            }
            FF_Btn.create(true);
        }
    }, 1000);

}

const show_videoStats = new class {
    constructor(){
        this.run_flag;
        this.hidemenu_css_timer;
    }

    menuClick(delay = 200){
        if(this.run_flag || !document.querySelector(`[data-a-target="player-settings-button"]`)) return; // setting btn           
        // console.log("settings menu start!");
        this.run_flag = true;
        let limit = 20;

    
        const menuloop = setInterval(()=>{
            const visibled_video_stats = !!document.querySelector(`[data-a-target="player-overlay-video-stats"]`);
            // console.log(menuloop,"menu loop", limit);
            if(limit-- <= 0){
                console.error(menuloop, "menu limit!");
                clearInterval(menuloop);
                this.run_flag = false;
                return;
            }
    
            if(!visibled_video_stats){
                const visibled_menu = !!document.querySelector(`[data-a-target="player-settings-menu"]`);
                const setting_btn = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll(`[data-a-target="player-settings-button"]`));
                const advanced_btn = /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll(`[data-a-target="player-settings-menu-item-advanced"]`));
                const video_stats = /** @type {HTMLInputElement} */ (document.querySelector(`[data-a-target="player-settings-submenu-advanced-video-stats"] input`));
                if(!visibled_menu && setting_btn.length){ // 설정
                    // 메뉴 활성화 과정 숨김
                    this.hidemenu_css_timer && clearTimeout(this.hidemenu_css_timer);
                    document.documentElement.classList.add("twitch_latency_hide_menu");
                    this.hidemenu_css_timer = setTimeout(()=>{
                        document.documentElement.classList.remove("twitch_latency_hide_menu");
                        this.hidemenu_css_timer = null;
                    }, 2000);
    
                    setting_btn.forEach(e=>e.click());
                    return;
                }
                else if(advanced_btn.length){ // 고급메뉴
                    advanced_btn.forEach(e=>e.click());
                    return;
                }
                if(video_stats?.checked === false){ // 동영상 통계
                    video_stats.click();
                    return;
                }
            }
            else{
                // 23년 1월말부터 버튼이 여러개 잡힘 & 버튼 가시성 확인 필요
                const main_btn = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll(`[data-test-selector="main-menu"]`));
                const close_btn = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll(`[data-a-target="player-settings-menu"] button:not([data-a-target]):has(svg)`));
                let click_flag = false;
                if(main_btn.length){ // 메인으로 나가기 // 속성 생기는게 느림
                    main_btn.forEach(e=>{
                        if(e.getBoundingClientRect()?.width){
                            click_flag = true;
                            e.click();
                        }
                    });
                    if(click_flag) return;
                }
                if(close_btn.length){ // 닫기 // 속성 생기는게 느림
                    close_btn.forEach(e=>{ // 25년, 닫기 버튼 뿐만 아니라 청각 버튼도 같이 눌러지는 문제 발생. 첫번째만 누르기
                        if(e.getBoundingClientRect()?.width && !click_flag){
                            e.click();
                            click_flag = true;
                        }
                    });
                    if(click_flag) return;
                }
                { // 세팅메뉴 닫힘 확인
                    clearInterval(menuloop);
                    this.run_flag = false;
                    // console.log("menu close!");
    
                    // 메뉴 숨김 타이머 조기종료
                    if(this.hidemenu_css_timer){
                        clearTimeout(this.hidemenu_css_timer);
                        document.documentElement.classList.remove("twitch_latency_hide_menu");
                        this.hidemenu_css_timer = null;
                    }
                    return;
                }
            }
        }, delay); 
    }
}();



class FF_Btn {
    static #sw_show = false;
    static #title_cache = chrome.i18n.getMessage("Fast_forward_video_buffer");
    /** @param {boolean} sw */
    static set_switch(sw){
        if(this.#sw_show = sw) document.documentElement.setAttribute("show_FF_buffer_btn", "");
        else document.documentElement.removeAttribute("show_FF_buffer_btn");
    }
    static create(is_popup = false){
        if(!this.#sw_show) return;
        if(document.querySelector(".FF_buffer_btn")) return;
        const ffbtn_elem = document.createElement("button");
        ffbtn_elem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <path d="M11,10.036L2.413,16.888V3.183Z"/>  <path d="M18.623,10.036l-8.587,6.852V3.183Z"/>
        </svg>
        `;
        ffbtn_elem.setAttribute("class", "FF_buffer_btn");
        ffbtn_elem.setAttribute("title", this.#title_cache);
        /** @type {Document | undefined} */
        const video_document = is_popup ? opener?.document : document;
        ffbtn_elem.addEventListener("click", function(){
            FF_Btn.ffClick(video_document);
            this.blur();
        });
        // document.querySelector(`[data-test-selector="chat-input-buttons-container"] > :last-child`)?.prepend(ff_btn);
        document.querySelector(`[data-test-selector="chat-input-buttons-container"] > :last-child`)?.before(ffbtn_elem); // 2605 채팅창 구조 변경
    }
    static ffClick(target_document = document){
        target_document?.querySelectorAll("video").forEach(video=>{
            video.buffered.length && (video.currentTime = video.buffered.end(video.buffered.length - 1));
        });
    }
};


/** @param {Options} storage_items */
function run_script(storage_items){
    const items = { ...default_options, ...storage_items };
    FF_Btn.set_switch(items.sw_show_FF_btn_in_chat_window);

    if (window.console != undefined) {
        setTimeout(console.log.bind(console, "%cTwitch Latency Display Loaded.", "font-size: 1.2em; font-weight: bold;"), 0);
    }
    encoding_latency_localvalue = Number(items.encoding_latency);
    auto_reload_latency_localvalue = Number(items.auto_reload_latency);
    
    const pathname_split = location.pathname?.split("/");
    if(pathname_split[1] === "popout" && pathname_split[3] === "chat"){
        popupChat_intervalTimer();
        return;
    }
    
    if(!items.sw_show_small_video_stats_css){
        document.documentElement.setAttribute("hide_video_stats", "");
    }
    
    if(!document.documentElement.hasAttribute("video_latency_display")){
        document.documentElement.setAttribute("video_latency_display", "");
        document.addEventListener("timeupdate", main_listener(900), true);
    }
}

chrome.storage.local.get(null, run_script);
chrome.storage.onChanged.addListener(changes => {
    Object.entries(changes).forEach(([key, { newValue }]) => {
        const change_key = /** @type {keyof Options} */ (key);
        switch (change_key) {
            case "sw_show_small_video_stats_css": {
                if(typeof newValue === "boolean"){
                    if(newValue){
                        document.documentElement.removeAttribute("hide_video_stats");
                        console.log("show video stats");
                    }
                    else{
                        document.documentElement.setAttribute("hide_video_stats", "");
                        console.log("hide video stats");
                    }
                }
                break;
            }
            case "sw_show_FF_btn_in_chat_window": {
                if(typeof newValue === "boolean"){
                    if(newValue){
                        FF_Btn?.set_switch(true);
                        console.log("show FF btn");
                    }
                    else{
                        FF_Btn?.set_switch(false);
                        console.log("hide FF btn");
                    }
                }
                break;
            }
            case "encoding_latency": {
                if(typeof newValue === "number"){
                    encoding_latency_localvalue = newValue;
                    console.log("change encoding_latency", newValue);
                }
                break;
            }
            case "auto_reload_latency": {
                if(typeof newValue === "number"){
                    auto_reload_latency_localvalue = newValue;
                    console.log("change auto_reload_latency", newValue);
                }
                break;
            }
            default: {
                /** @type {never} */
                const exhaustiveValue = change_key;
                void exhaustiveValue;
            }
        }
    });
});