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

        saveLinkedInContact = alisonContactService.saveLinkedInContact;
    }

    window.alisonHook = new AlisonHook();

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
                eval(`alisonHook.activeTemplate.${action}(${data});`);

                // Close the window if we're successful
                setTimeout(function() { 
                    window.close();
                }, 5000);
            }
            else if (__doesMethodExistOnAlisonHook(action)){
                eval(`alisonHook.${action}(${data});`);
                
                // Close the window if we're successful
                setTimeout(function() { 
                    window.close();
                }, 5000);
            }
            else if(__doesMethodExistOnWindow(action)){
                eval(`${action}(${data});`);
                
                // Close the window if we're successful
                setTimeout(function() { 
                    window.close();
                }, 5000);
            }
            else {
                console.error(`ERROR.  Unable to find action '${action}'`);
            }
    
        });
        
        alisonHook.loadTemplate('sendLinkedInMessages');
        
    });
    
})();



    