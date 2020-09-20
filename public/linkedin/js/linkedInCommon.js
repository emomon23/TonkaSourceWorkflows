(function() {
    const _advanceToNextLinkedInResultPage = () => {
        const buttonExists = $("[type='chevron-right-icon']").length;
        if (buttonExists){
            tsCommon.log("advancing to the next page");
            $("[type='chevron-right-icon']").click();
            return true;
        }

        return false;
    }

    const _callAlisonHookWindow = async (actionString, data) => {
        await window.launchTonkaSource();
        await tsCommon.sleep(2000);

        if (window.alisonHookWindow !== undefined){
            const jsonData = JSON.stringify(data);
            tsCommon.postMessageToWindow(alisonHookWindow, actionString, jsonData);
        }
        else {
            console.log("Unable to 'postMessage', no reference to alisonHookWindow exists (run launchTonkaSource()?)");
        }
    }

    const _getRoleName = (roleName) => {
        if (linkedInConstants.roles[roleName.toUpperCase()]) {
            return linkedInConstants.roles[roleName.toUpperCase()];
        } else {
            tsCommon.log({
                message: "Role Not Defined",
                roles: linkedInConstants.roles
            }, "WARN");
        }
        return null;
    }

    const _whatPageAmIOn = () => {
        const href = window.location.href;
        if (href.indexOf(linkedInConstants.urls.RECRUITER_PROFILE) > 0) {
            return linkedInConstants.pages.RECRUITER_PROFILE;
        } else if (href.indexOf(linkedInConstants.urls.PUBLIC_PROFILE) > 0) {
            return linkedInConstants.pages.PUBLIC_PROFILE;
        } else if (href.indexOf(linkedInConstants.urls.RECRUITER_SEARCH_RESULTS) > 0) {
            return linkedInConstants.pages.RECRUITER_SEARCH_RESULTS;
        } else {
            tsCommon.log("Could not determine the LinkedIN page")
            return null;
        }
    }

    class LinkedInCommon {
        constructor() {}

        advanceToNextLinkedInResultPage = _advanceToNextLinkedInResultPage;
        getRoleName = _getRoleName;
        callAlisonHookWindow = _callAlisonHookWindow;
        whatPageAmIOn = _whatPageAmIOn;
    }

    window.linkedInCommon = new LinkedInCommon();
})();