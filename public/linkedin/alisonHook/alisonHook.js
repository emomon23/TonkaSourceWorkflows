(() => {
    const __doesMethodExistOnActiveTemplate = (methodName) => {
        try {
            return eval(`alisonHook.activeTemplate && alisonHook.activeTemplate['${methodName}'] != undefined`);
        }
        catch {
            return false;
        }
    }

    const __doesMethodExistOnAlisonHook = (methodName) => {
        try {
            return eval(`alisonHook['${methodName}'] != undefined`);
        }
        catch {
            return false;
        }
    }

    const __doesMethodExistOnWindow = (methodName) => {
        try {
            return eval(`${methodName} != undefined`);
        }
        catch {
            return false;
        }
    }

    class AlisonHook {
        constructor(){};

        activeTemplate = null;
        linkedInConsoleReference = null;

        loadTemplate = async (templateName) => {
            const html = await tsCommon.httpGetTemplate(templateName);
            $('#alisonHookTemplateContainer').html(html);
        };

        callBackToLinkedIn = (actionString, data) => {
            if (linkedInConsoleReference){
                var jsonString = data? JSON.stringify(data): {};
                linkedInConsoleReference.postMessage({action: actionString, parameter: jsonString}, "*");
            }
        };


    }

    const initialization =() => { console.log("initialization called from linked in user script")};
    window.alisonHook = new AlisonHook();
})();


$(document).ready(() => {
    window.addEventListener('message', function(e) {
        var d = e.data;
        linkedInConsoleReference = e.source;

        const action = d.action;
        let data = null;
        try {
            data = JSON.parse(d.parameter);
        }
        catch {
            data = d.parameter;
        }

        if (__doesMethodExistOnActiveTemplate(action)){
            eval(`alisonHook.activeTemplate.${action}(${data});`)
        }
        else if (__doesMethodExistOnAlisonHook(action)){
            eval(`alisonHook.${action}(${data});`);
        }
        else if(__doesMethodExistOnWindow(action)){
            eval(`${action}(${data});`)
        }
        else {
            console.log(`ERROR.  Unable to find action '${action}'`);
        }

    });
    
    alisonHook.loadTemplate('sendLinkedInMessages');
    
});
    