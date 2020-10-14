/* eslint-disable no-eval */
(() => {

    const _displayMessage = (message) => {
        let msg = $('#message-container').html();
        if (msg && msg.length > 0){
            msg+= "</br>";
        }

        msg+= `- ${message}`;

        $('#message-container').html(msg);
    }
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

    const _runJobHistoryScraperJob = async(params) => {

        const howMany = params && params.howMany ? params.howMany : null;

        _displayMessage("runJobHistoryScraper called");
        const jobSeekers = await alisonContactService.getJobSeekersToBeScrapedInABatch(howMany);
        alisonHook.callBackToLinkedIn('getJobSeekersJobHistoryDetail', jobSeekers);
        _displayMessage(`found ${jobSeekers.length} job seekers to scrape`);

        await tsCommon.sleep(3000);
        window.close();
    }

    const _getAlisonContact = async(searchFor) => {
        await alisonContactService.getAlisonContact(searchFor);
        await tsCommon.sleep(1000);
        window.close();
    }

    const _saveLinkedInContact = async(contact) => {
        try {
            _displayMessage(`saveLinkedInContact: ${contact.firstName} ${contact.lastName} (${contact.memberId})`);

            const str = contact ? JSON.stringify(contact) : 'null contact!'
            console.log(`_saveLinkedInContact called.  Calling alisonService.saveLinkedInContact: ${str}`);

            await alisonContactService.saveLinkedInContact(contact);
            await tsCommon.sleep(1000);
            window.close();
        } catch (e) {
            _displayMessage(`ERROR: ${e.message}`);
            console.error(`_saveLinkedInContact error. ${e.message}`);
        }
    }

    class AlisonHook {
        constructor(){}

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

        saveLinkedInContact = _saveLinkedInContact;
        getAlisonContact = _getAlisonContact;
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
    }

    window.alisonHook = new AlisonHook();

    $(document).ready(() => {
        _displayMessage(`docReady, registering 'message' eventListener`);

        window.addEventListener('message', (e) => {
            _displayMessage('message event fired: ' + e.data.action);

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
            }
            else if (__doesMethodExistOnAlisonHook(action)){
                eval(`alisonHook.${action}(${data});`);
            }
            else if(__doesMethodExistOnWindow(action)){
                eval(`${action}(${data});`);
            }
            else {
                console.error(`ERROR.  Unable to find action '${action}'`);
            }
    
        });
        
        //alisonHook.loadTemplate('sendLinkedInMessages');
        
    });
    
})();



    