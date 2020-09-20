(function() {
    const _activeOpportunityKey = linkedInConstants.localStorageKeys.ACTIVE_OPPORTUNITY;
    const _roleKey = linkedInConstants.localStorageKeys.ROLE;
    const _tagsKey = linkedInConstants.localStorageKeys.TAGS;

    const _showOpportunityVisualIndicatorOnSelelector = (selector) => {
        const activeOpp = window.localStorage.getItem(_activeOpportunityKey);
        const recruiterNode = tsUICommon.findDomElement(selector);

        if (recruiterNode !== null){
            if (activeOpp !== undefined && activeOpp !== null){
                $(recruiterNode.attr('style', 'color:red'))
            }
            else {
                $(recruiterNode).removeAttr('style');
            }
        }
    }

    const _showTagsVisualIndicator = () => {
        const tags = window.localStorage.getItem(_tagsKey);
        const selectors = ['a[class*="product-logo"]', 
                'span[class*="special-seat"]:contains("Lite")'];

        const element = tsUICommon.findFirstDomElement(selectors);
        if (!element){
            return;
        }

        if (tags !== undefined && tags !== null){
            $(element).attr('style', 'color:yellow');
        }
        else {
            $(element).removeAttr('style');
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
        if (scrapedUser === null || scrapedUser === undefined){
            await tsCommon.sleep(2000);
            let loggedInUserFirstAndLastName = null;

            let loggedInUserPhoto = tsUICommon.findFirstDomElement(['#nav-tools-user img[class*="profile-photo"]',
                                                                    'li[role="menuitem"] a[href*="account-sub-nav"] span[class="text"]',
                                                                    'img[class*="global-nav__me-photo"]'
                                                                    ]);
           

            if (loggedInUserPhoto){
                loggedInUserFirstAndLastName = ($(loggedInUserPhoto).attr('alt') || $(loggedInUserPhoto).text() || '').trim();

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
        catch {
            // Do Nothing
        }
    }

    const _candidateUnselect = async(data) => {
        data = typeof data === "string"? JSON.parse(data) : data;
        const memberId = data.memberId;
        _changeBadgeColor(memberId, 'black');
        searchResultsScraper.deselectCandidate(memberId);
    }

    const _upsertContact =  async (candidate) => {
        const tags = linkedInApp.getAlisonTags();
        const activeOpp = linkedInApp.getAlisonTags();

        if (tags !== null && tags !== undefined){
            candidate.tags = tags;
        }

        if (activeOpp !== null && activeOpp !== undefined){
            candidate.tags += ', ' + activeOpp;
        }

        await linkedInCommon.callAlisonHookWindow('saveLinkedInContact', candidate);
    }

    const _createMessageRecordObject = (text, type) => {
        return {
            text,
            type,
            date: Date.now(),
            who:  window.linkedInApp.alisonUserName
        };
    }

    const _recordMessageWasSent = (recipient, messageSent, type = 'message') => {
        let candidate = searchResultsScraper.findCandidate(recipient);
        
        if (candidate !== null){
            //make a copy of what we need for this save
            const {firstName, lastName, memberId} = candidate;
            candidate = {firstName, lastName, memberId};

            let messageObject = _createMessageRecordObject(messageSent, type);
            candidate.messagesSent = [messageObject];

            const opportunity = window.localStorage.getItem(_activeOpportunityKey);
            if (opportunity !== null && opportunity !== undefined) {
                const opportunityRecord = _createMessageRecordObject(messageSent, type);
                opportunityRecord.opportunityName = opportunity;
                candidate.opportunitiesPresented = [opportunityRecord]
            }

            _upsertContact(candidate);
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
        getAlisonTags = () => { return window.localStorage.getItem(_tagsKey); };
    }

    window.linkedInApp = new LinkedInApp();
    _getAlisonLoggedInUser();

    //All messages posted back to the Linked In windows (browser tab) / tamper Monkey
    //should be routed to the linkedInApp object.
    tsCommon.setUpPostMessageListener('linkedInApp');

    tsInterceptor.interceptResponse('get', '/api/smartsearch?', searchResultsScraper.interceptSearchResults);
   
    window.launchTonkaSource = async () => {
        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonHook/alisonHook.html`;
        window.alisonHookWindow = window.open(url, "Linked In Hack", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=10,height=10,top=5000,left=5000");

        await tsCommon.sleep(2000);
    }

    window.clearActiveOpportunity = () => {
        window.localStorage.removeItem(_activeOpportunityKey);
        _showOpportunityVisualIndicator();
    }

    window.clearAlisonTags = () => {
        window.localStorage.removeItem(_tagsKey);
        _showTagsVisualIndicator();
    }

    window.setActiveOpportunity = (opportunityId) => {
        window.localStorage.setItem(_activeOpportunityKey, opportunityId);
        _showOpportunityVisualIndicator();
    }

    window.setAlisonTags = (tags) => {
        window.localStorage.setItem(_tagsKey, tags);
        _showTagsVisualIndicator();
    }

    _showOpportunityVisualIndicator();
    _showTagsVisualIndicator();
})();


