(function() {
    const _activeOpportunityKey = linkedInConstants.localStorageKeys.ACTIVE_OPPORTUNITY;
    const _roleKey = linkedInConstants.localStorageKeys.ROLE;
    const _saveOnRecruiterProfileKey = linkedInConstants.localStorageKeys.SAVE_ON_RECRUITER_PROFILE;
    const _tagsKey = linkedInConstants.localStorageKeys.TAGS;
    // In case a page is saving MANY contacts...we only want to alert message once.
    let roleAlert = false;

    const _getActiveOpportunity = () => {
        return window.localStorage.getItem(_activeOpportunityKey);
    }

    const _getActiveRole = () => {
        return window.localStorage.getItem(_roleKey);
    }

    const _getAlisonTags = () => {
        return window.localStorage.getItem(_tagsKey);
    }

    const _showOpportunityVisualIndicatorOnSelector = (selector) => {
        const activeOpp = window.localStorage.getItem(_activeOpportunityKey);
        const recruiterNode = tsUICommon.findDomElements(selector);

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
        _showOpportunityVisualIndicatorOnSelector('h1 span:contains("Recruiter")');
        _showOpportunityVisualIndicatorOnSelector('a[class*="message-anywhere-button"]');
        _showOpportunityVisualIndicatorOnSelector('button[aria-label*="Connect with"]');
    }

    const _showRoleVisualIndicator = () => {
        _showRoleVisualIndicatorOnSelector(linkedInSelectors.searchResultsPage.BADGES);
    }

    const _showRoleVisualIndicatorOnSelector = (selector) => {
        const role = window.localStorage.getItem(linkedInConstants.localStorageKeys.ROLE);
        const els = tsUICommon.findDomElements(selector);


        if (els && els.length){
            $(els).each((index) => {
                if (role){
                    $(els[index]).append(`<span style="font-size: 15px; color: red; font-weight: bold; font-style: underline">${role}</span>`);
                }
                else {
                    $(els[index]).find('span').remove();
                }
            })
        }
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

    const _upsertContact =  async (candidate, requireRole = true) => {
        if(requireRole && _getActiveRole() === null) {
            if (!roleAlert) {
                // eslint-disable-next-line no-alert
                alert('Role must be set to save contacts.  Use setActiveRole(roleName)');
                roleAlert = true;
            }
            return null;
        }

        const tags = linkedInApp.getAlisonTags();
        const activeOpp = linkedInApp.getActiveOpportunity();
        candidate.role = linkedInApp.getActiveRole();

        

        if (tags !== null && tags !== undefined){
            candidate.tags = tags;
        }

        if (activeOpp !== null && activeOpp !== undefined){
            candidate.tags += ', ' + activeOpp;
        }

        await tsCommon.callAlisonHookWindow('saveLinkedInContact', candidate);
        return null;
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
            const {firstName, lastName, memberId} = candidate;
            candidate = {firstName, lastName, memberId};  //make a copy of what we need for this save
        }
        else {
            candidate = recipient; //Try and save the message based on just the 1st and last names
        } 
        

        let messageObject = _createMessageRecordObject(messageSent, type);
        candidate.messagesSent = [messageObject];

        const opportunity = window.localStorage.getItem(_activeOpportunityKey);
        if (opportunity) {
            const opportunityRecord = _createMessageRecordObject(messageSent, type);
            opportunityRecord.opportunityName = opportunity;
            candidate.opportunitiesPresented = [opportunityRecord]
        }

        _upsertContact(candidate, false);
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
        getActiveOpportunity = _getActiveOpportunity;
        getActiveRole = _getActiveRole;
        getAlisonTags = _getAlisonTags;
    }

    window.linkedInApp = new LinkedInApp();
    _getAlisonLoggedInUser();

    //All messages posted back to the Linked In windows (browser tab) / tamper Monkey
    //should be routed to the linkedInApp object.
    tsCommon.setUpPostMessageListener('linkedInApp');

    tsInterceptor.interceptResponse('get', '/api/smartsearch?', searchResultsScraper.interceptSearchResults);

    window.clearActiveOpportunity = () => {
        window.localStorage.removeItem(_activeOpportunityKey);
        _showOpportunityVisualIndicator();
    }

    window.clearActiveRole = () => {
        window.localStorage.removeItem(_roleKey);
        _showRoleVisualIndicator();
    }

    window.clearAlisonTags = () => {
        window.localStorage.removeItem(_tagsKey);
        _showTagsVisualIndicator();
    }

    window.getActiveOpportunity = _getActiveOpportunity;

    window.getActiveRole = _getActiveRole;

    window.getAlisonTags = _getAlisonTags;

    window.saveOnRecruiterProfile = (val) => {
        window.localStorage.setItem(_saveOnRecruiterProfileKey, val)
    }

    window.setActiveOpportunity = (opportunityId) => {
        window.localStorage.setItem(_activeOpportunityKey, opportunityId);
        _showOpportunityVisualIndicator();
    }

    window.setActiveRole = (role) => {
        var roleName = linkedInCommon.getRoleName(role);
        if (roleName) {
            window.localStorage.setItem(_roleKey, roleName);
            _showRoleVisualIndicator();
        }
    }

    window.setAlisonTags = (tags) => {
        window.localStorage.setItem(_tagsKey, tags);
        _showTagsVisualIndicator();
    }

    _showOpportunityVisualIndicator();
    _showTagsVisualIndicator();

    $(document).ready(() => {
        // Results aren't loaded right away, wait a few seconds.
        setTimeout(_showRoleVisualIndicator, 5000);

        // Extend jQuery
        $.extend($.expr[':'], {
            containsi: function(elem, index, match) {
                /* For example $(‘#ShowItems li:containsi(“Share”)’), then match[3] will be Share */
                return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || '').toLowerCase()) >= 0;
            }
        });
    });
    
})();


