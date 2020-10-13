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
        try {
            const activeRole = _getActiveRole();

            if(requireRole && activeRole === null) {
                if (!roleAlert) {
                    // eslint-disable-next-line no-alert
                    alert('Role must be set to save contacts.  Use setActiveRole(roleName)');
                    roleAlert = true;
                }
                return null;
            }

            const tags = linkedInApp.getAlisonTags();
            const activeOpp = linkedInApp.getActiveOpportunity();
            
            if (activeRole){
                candidate.role = activeRole;
            }

            if (tags !== null && tags !== undefined){
                candidate.tags = tags;
            }

            if (activeOpp !== null && activeOpp !== undefined){
                candidate.tags += ', ' + activeOpp;
            }

            await linkedInCommon.callAlisonHookWindow('saveLinkedInContact', candidate);
            return null;
        } catch(e) {
            console.log(e.message);
        }
    }

    const _getAlisonContact = async(searchFor) => {
        await linkedInCommon.callAlisonHookWindow('getAlisonContact', searchFor);
    }

    const _getAlisonContactResult = async(alisonContact) => {
        if (alisonContact && alisonContact.linkedInMemberId){
            const memberId = alisonContact.linkedInMemberId;
            const localCandidateContainer = searchResultsScraper.scrapedCandidates[memberId];

            if (localCandidateContainer && localCandidateContainer.candidate){
                if (alisonContact.scrapedSkillGrades){
                    localCandidateContainer.candidate.scrapedSkillGrades = alisonContact.scrapedSkillGrades
                }

                if (alisonContact.positions){
                    localCandidateContainer.candidate.positions = alisonContact.positions;
                }
            }
        }
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

    const _doesScrapedCandidateMatchAlisonSeeker = (scraped, seeker) => {
        const firstNamesGoodEnough = scraped.firstName.indexOf(seeker.firstName) >= 0 || seeker.firstName.indexOf(scraped.firstName) >= 0;
        const lastNamesGoodEnough = scraped.lastName.indexOf(seeker.lastName) >= 0 || seeker.lastName.indexOf(scraped.lastName) >= 0;

        return firstNamesGoodEnough && lastNamesGoodEnough;
    }

    const _getJobSeekersJobHistoryDetail = async(listOfJobSeekersJson) => {
        if (!listOfJobSeekersJson || listOfJobSeekersJson.length === 0){
            return;
        }

        let listOfJobSeekers = typeof listOfJobSeekersJson === "string" ? JSON.parse(listOfJobSeekersJson) : listOfJobSeekersJson;

        for (let i=0; i<listOfJobSeekers.length; i++){
            const seeker = listOfJobSeekers[i];
            const sendConnectionRequest = "Mike Joe".indexOf(linkedInApp.alisonUserName) === -1;

            // eslint-disable-next-line no-await-in-loop
            const scrapedProfile = await linkedInPublicProfileScraper.searchForPublicProfile(seeker, sendConnectionRequest);
            
            const wasTheRightOneScraped = _doesScrapedCandidateMatchAlisonSeeker(scrapedProfile, seeker);
            if (wasTheRightOneScraped){
                scrapedProfile.memberId = seeker.linkedInMemberId ? seeker.linkedInMemberId : seeker.memberId;
                
                // eslint-disable-next-line no-await-in-loop
                await _upsertContact(scrapedProfile, false);
                
                // eslint-disable-next-line no-await-in-loop
                await tsCommon.randomSleep(50000, 90000);
            }

           
        }
    }

    class LinkedInApp {
        sendLinkedInMessageOrConnectionRequestToCandidate = linkedInMessageSender.sendLinkedInMessageOrConnectionRequestToCandidate;
        candidateUnselect = _candidateUnselect;
        changeBadgeColor = _changeBadgeColor;
        upsertContact = _upsertContact;
        getAlisonContact = _getAlisonContact;
        getAlisonContactResult = _getAlisonContactResult;
        getAlisonLoggedInUser = _getAlisonLoggedInUser;
        getJobSeekersJobHistoryDetail = _getJobSeekersJobHistoryDetail;
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
   
    window.launchTonkaSource = async () => {
        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonHook/alisonHook.html`;
        window.alisonHookWindow = window.open(url, "Linked In Hack", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=10,height=10,top=5000,left=5000");

        await tsCommon.sleep(3000);

        if (!window.alisonHookWindow){
            tsCommon.log("Unable to open alisonHook.  CHECK POP UP BLOCKER?", "WARN");
        }
    }

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


