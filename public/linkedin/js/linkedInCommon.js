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

        if (window.alisonHookWindow){
            try {
                const jsonData = JSON.stringify(data);
                tsCommon.postMessageToWindow(window.alisonHookWindow, actionString, jsonData);
            }
            catch(postError) {
                console.log(`Error posting message to alison hook (check pop up blocker?). ${e.message}.  (${e})`, 'ERROR');
            }
        }
        else {
            console.log("Unable to 'postMessage', no reference to alisonHookWindow exists (run launchTonkaSource()? Check Pop up blocker?)");
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
        const href = window.location.href.toLowerCase();
        let result = null;

        if (href === "https://www.linkedin.com/" || href === "https://www.linkedin.com"){
            return linkedInConstants.pages.LOGIN;
        }

        for(let key in linkedInConstants.pages){
           let pageConst = linkedInConstants.pages[k];
           if (href.indexOf(pageConst) >= 0){
               result = pageConst;
               break;
           }
        }

        if (!result){
            console.log(`whatPageAmIOn = null (href: ${href})`);
        }

        return result;
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