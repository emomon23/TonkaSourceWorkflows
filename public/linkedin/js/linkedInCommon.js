 (function() {
    const _callAlisonHookWindow = (actionString, data) => {
        const jsonData = JSON.stringify(data);
        tsCommon.postMessageToWindow(alisonHookWindow, actionString, jsonData);
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