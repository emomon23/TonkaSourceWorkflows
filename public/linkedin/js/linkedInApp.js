(function() {
    const _activeOpportunityKey = 'tsActiveOpportunityKey';

    const _showOpportunityVisualIndicatorOnSelelector = (selector) => {
        const activeOpp = window.localStorage.getItem(_activeOpportunityKey);
        const recruiterNode = tsUICommon.findDomElement(selector);

        if (recruiterNode != null){
            if (activeOpp != undefined && activeOpp != null){
                $(recruiterNode.attr('style', 'color:red'))
            }
            else {
                $(recruiterNode).removeAttr('style');
            }
        }
    }
    const _showOpportunityVisualIndicator = () => {
        _showOpportunityVisualIndicatorOnSelelector('h1 span:contains("Recruiter")');
        _showOpportunityVisualIndicatorOnSelelector('a[class*="message-anywhere-button"]');
        _showOpportunityVisualIndicatorOnSelelector('button[aria-label*="Connect with"]');
    }

    //These are High Level 'Commands' that the app supports
    //that the alisonHook UI (or user) can call.
    const _getAlisonLoggedInUser = async () => {
        let scrapedUser =  window.linkedInApp.alisonUserName;
        if (scrapedUser == null || scrapedUser == undefined){
            await tsCommon.sleep(300);
            let loggedInUserFirstAndLastName = null;

            let loggedInUserPhoto = tsUICommon.findDomElement('#nav-tools-user img[class*="profile-photo"]');
            if (loggedInUserPhoto != null){
                loggedInUserFirstAndLastName = $(loggedInUserPhoto).attr('alt');
            }
            else {
                loggedInUserPhoto = tsUICommon.findDomElement('li[class="account"] span[class="text"]');
                if (loggedInUserPhoto != null){
                    loggedInUserFirstAndLastName = $(loggedInUserPhoto).text().trim();
                }
            }

            switch(loggedInUserFirstAndLastName){
                case 'Mike R. Emo' :
                    scrapedUser = "Mike";
                    break;
                case 'Joe Harstad' :
                    scrapedUser = "Joe";
                    break;
                default: 
                    scrapedUser = null;
                    break;
            }

            window.linkedInApp.loggedInUserFirstAndLastName = loggedInUserFirstAndLastName;
            window.linkedInApp.alisonUserName = scrapedUser;
        }

        return scrapedUser;
    }

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

    const _createMessageRecordObject = (text, type) => {
        return {
            text,
            type,
            date: Date.now(),
            who: linkedInApp.getAlisonLoggedInUser()
        };
    }

    const _recordMessageWasSent = (recipient, messageSent, type = 'message') => {
        let candidate = searchResultsScraper.findCandidate(recipient);
        
        if (candidate != null){
            //make a copy of what we need for this save
            const {firstName, lastName, linkedInMemberId} = candidate;
            candidate = {firstName, lastName, memberId};

            let messageObject = _createMessageRecordObject(messageSent, type);
            candidate.messagesSent = [messageObject];

            const opportunity = window.localStorage.getItem(_activeOpportunityKey);
            if (opportunity != null && opportunity != undefined) {
                const opportunityRecord = _createMessageRecordObject(messageSent, type);
                opportunityRecord.opportunityName = opportunity;
                candidate.opportunitiesPresented = [opportunityRecord]
            }

            linkedInCommon.callAlisonHookWindow('saveLinkedInContact', candidate);
        }
    }

    const _recordConnectionRequestMade = (memberIdOrFirstNameAndLastName, note) => {
        _recordMessageWasSent(memberIdOrFirstNameAndLastName, note, 'connectionRequest');
    }

    class LinkedInApp {
        sendLinkedInMessageOrConnectionRequestToCandidate = linkedInMessageSender.sendLinkedInMessageOrConnectionRequestToCandidate;
        candidateUnselect = _candidateUnselect;
        changeBadgeColor = _changeBadgeColor;
        upsertContact = _upsertContact;
        getAlisonLoggedInUser = _getAlisonLoggedInUser;
        recordMessageWasSent = _recordMessageWasSent;
        recordConnectionRequestMade = _recordConnectionRequestMade;
        getActiveOpportunity = () => { return window.localStorage.getItem(_activeOpportunityKey); };
    }

    window.linkedInApp = new LinkedInApp();

    //All messages posted back to the Linked In windows (browser tab) / tamper Monkey
    //should be routed to the linkedInApp object.
    tsCommon.setUpPostMessageListener('linkedInApp');

    tsInterceptor.interceptResponse('get', '/api/smartsearch?', searchResultsScraper.interceptSearchResults);
   
    window.launchTonkaSource = async () => {
        const url = 'https://tonkasourceworkflows.firebaseapp.com/linkedin/alisonHook/alisonHook.html';
        window.alisonHookWindow = window.open(url, "Linked In Hack", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=900,height=800,top=5000,left=5000");

        await tsCommon.sleep(2000);
        linkedInCommon.callAlisonHookWindow('initialization');
    }

    window.setActiveOpportunity = (opportunityId) => {
        window.localStorage.setItem(_activeOpportunityKey, opportunityId);
        _showOpportunityVisualIndicator();
    }

    window.clearActiveOpportunity = () => {
        window.localStorage.removeItem(_activeOpportunityKey);
        _showOpportunityVisualIndicator();
    }

    _showOpportunityVisualIndicator();
})();


