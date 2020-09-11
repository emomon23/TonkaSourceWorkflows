(function() {
    //These are High Level 'Commands' that the app supports
    //that the alisonHook UI (or user) can call.

    const _changeBadgeColor = (memberId, color) => {
        try {     
            const query = `#search-result-${memberId} abbr`;
            $($(query)[0]).attr('style', `color:${color}`)
        }
        catch {}
    }

    const _candidateUnselect = async(data) => {
        data = typeof data === "string"? JSON.parse(data) : data;
        const memberId = data.memberId;
        _changeBadgeColor(memberId, 'black');
        searchResultsScraper.deselectCandidate(memberId);
    }

    const _upsertContact = async(candidate) => {
        console.log('upsertContact called');
    }

    class LinkedInApp {
        sendLinkedInMessageOrConnectionRequestToCandidate = linkedInMessageSender.sendLinkedInMessageOrConnectionRequestToCandidate;
        candidateUnselect = _candidateUnselect;
        changeBadgeColor = _changeBadgeColor;
        upsertContact = _upsertContact;
        user = "";
    }

    window.linkedInApp = new LinkedInApp();

    //All messages posted back to the Linked In windows (browser tab) / tamper Monkey
    //should be routed to the linkedInApp object.
    tsCommon.setUpPostMessageListener('linkedInApp');

    tsInterceptor.interceptResponse('get', '/api/smartsearch?', searchResultsScraper.interceptSearchResults);
   
    window.launchTonkaSource = async (who) => {
        if (who == undefined){
            console.log(`WARNING!! launchTonkaSource was called without a 'who' paramter.  I'd like to know if you are Mike or Joe!`);
        }

    const url = 'https://tonkasourceworkflows.firebaseapp.com/linkedin/alisonHook/alisonHook.html';
    window.alisonHookWindow = window.open(url, "Linked In Hack", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=900,height=800,top=5000,left=5000");

    await tsCommon.sleep(2000);
    linkedInCommon.callAlisonHookWindow('initialization');

    linkedInApp.user = who;
}

})();


