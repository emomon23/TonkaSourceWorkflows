(function() {
    const _callAlisonHookWindow = (actionString, data) => {
        const jsonData = JSON.stringify(data);
        tsCommon.postMessageToWindow(alisonHookWindow, actionString, jsonData);
    }

    const _advanceToNextOpportunityPage = () => {
        const nextButtonId = "contacttable_next";
        const nextButton = $("#"+nextButtonId);
        // If there's a button and it's not disabled...lets click it
        if (nextButton.length && !nextButton.hasClass("ui-state-disabled")){
            tsCommon.log("...advancing to the next page");
            document.getElementById(nextButtonId).click();
            return true;
        }

        return false;
    }

    class StarUtils {
        constructor() {}

        callAlisonHookWindow = _callAlisonHookWindow;
        advanceToNextOpportunityPage = _advanceToNextOpportunityPage;
    }

    window.starUtils = new StarUtils();
})();