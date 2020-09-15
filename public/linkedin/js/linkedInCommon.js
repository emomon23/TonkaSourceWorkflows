 (function() {
    const _callAlisonHookWindow = async (actionString, data) => {
        window.launchTonkaSource();
        await tsCommon.sleep(2000);

        if (window.alisonHookWindow != undefined){
            const jsonData = JSON.stringify(data);
            tsCommon.postMessageToWindow(alisonHookWindow, actionString, jsonData);
        }
        else {
            console.log("Unable to 'postMessage', no reference to alisonHookWindow exists (run launchTonkaSource()?)");
        }
    }

    const _advanceToNextLinkedInResultPage = () => {
        const buttonExists = $("[type='chevron-right-icon']").length;
        if (buttonExists){
            tsCommon.log("advancing to the next page");
            $("[type='chevron-right-icon']").click();
            return true;
        }

        return false;
    }

    class LinkedInCommon {
        constructor() {}

        callAlisonHookWindow = _callAlisonHookWindow;
        advanceToNextLinkedInResultPage = _advanceToNextLinkedInResultPage;
    }

    window.linkedInCommon = new LinkedInCommon();
})();