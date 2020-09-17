(function() {
    const _localStorageItemName = 'tsSearchResults_ScrapedCandidates';

    const _scrapeCandidateHtml = async (candidate) => {
        //Get data from HTML, not found in JSON.
        const liTag = $(`#search-result-${candidate.memberId}`);
        tsCommon.extendWebElement(liTag);

        const profileLink = liTag.mineElementWhereClassContains('profile-link');
        candidate.linkedInRecruiterUrl = $(profileLink).attr("href");

        const imageTag = liTag.mineTag('img');
        candidate.imageUrl = imageTag? $(imageTag).attr('src') : '';
 
        const cityState = candidate.location? candidate.location.split(',') : [""];
        candidate.city = cityState[0];
        candidate.state = cityState.length > 1? cityState[1].trim() : "";

        if (candidate.degree){
            let networkConnection = candidate.degree.replace('FIRST_DEGREE', '1').replace('SECOND_DEGREE', '2').replace('THIRD_DEGREE', 3);
            if ('123'.indexOf(networkConnection) == -1){
                networkConnection = '4';
            }

            if (!candidate.alisonConnections){
                candidate.alisonConnections = {};
            }

            const loggedInAlisonUserName = await linkedInApp.getAlisonLoggedInUser();
            if (loggedInAlisonUserName != null){
                candidate.alisonConnections[loggedInAlisonUserName] = networkConnection;
            }
        }
    }

    const _waitForResultsHTMLToRender = async (lastCandidate) => {
        const lastCandidateId = `#search-result-${lastCandidate.memberId}`;
        let liTag = $(lastCandidateId);
        let count = 0;

        while(count < 50 && (!liTag || !$(liTag).attr('id'))){
            await tsCommon.sleep(100);
            liTag = $(lastCandidateId);
        }
    }

    const _highlightJobSeekers = (currentPageOfCandidates) => {
        try {
            if (currentPageOfCandidates && Array.isArray(currentPageOfCandidates) && currentPageOfCandidates.length > 0){
                currentPageOfCandidates.forEach((candidate) => {
                    if (candidate.isJobSeeker){
                        const jobSeekerElement = tsUICommon.findFirstDomElement([`a[href*="${candidate.memberId}"]`, `a:contains("${candidate.fullName}")`]);
                        if (jobSeekerElement !== null){
                            const newLabel = '** ' + $(jobSeekerElement).text();
                            $(jobSeekerElement).attr('style', 'color:orange').text(newLabel);
                        }
                    }
                });
            }
        }
        catch(e) {
            console.log(`Unable to highlight job seekers.  ${e.message}. ${e}.`)
        }
    }

    const _searchCandidates = (scrapedCandidates, searchFor) => {
        let candidateReference = null;
        
        try {
            candidateReference = scrapedCandidates[searchFor];
            if (candidateReference != undefined && candidateReference != null){
                return candidateReference.candidate;
            }
        }catch {}

        let firstName =  null; 
        let lastName = null; 

        if (typeof searchFor === "string"){
            const firstAndLastName = searchFor.toLowerCase().split(' ');
            if (firstAndLastName.length === 2){
                firstName = firstAndLastName[0];
                lastName = firstAndLastName[1];
            }
        }
        else {
            firstName = (searchFor.firstName || searchFor.first || '').toLowerCase();
            lastName = (searchFor.lastName || searchFor.last || '').toLowerCase();
        }

        if (firstName !== null && firstName !== undefined && lastName !== null && lastName !== undefined){
            let candidateReference = null;
        
             for(let k in scrapedCandidates) {
                const c = scrapedCandidates[k].candidate;
                const cFirstName = (c.firstName || '').toLowerCase();
                const cLastName = (c.lastName || '').toLowerCase();

                if (cFirstName === firstName && cLastName === lastName){
                    candidateReference = c;
                    break;
                }
            }

            return candidateReference;
        }

        return null;
    }

    const _interceptSearchResults = async (responseObj) => {
        const interceptedResults = JSON.parse(responseObj.responseText);
        const candidatesInResults = interceptedResults.result.searchResults;
        let persist = false;

        if (candidatesInResults && candidatesInResults.length > 0){
            await _waitForResultsHTMLToRender(candidatesInResults[candidatesInResults.length -1]);

            await window.promiseLoop(candidatesInResults, async (candidate) => {
                await _scrapeCandidateHtml(candidate);
                
                const omitFields = ['APP_ID_KEY', 'CONFIG_SECRETE_KEY', 'authToken', 'authType', 'canSendMessage', 'companyConnectionsPath', 'currentPositions', 'degree', 'extendedLocationEnabled', 'facetSelections', 'findAuthInpuytModel', 'graceHopperCelebrationInterestedRoles', 'willingToSharePhoneNumberToRecruiters', 'vectorImage', 'isBlockedByUCF', 'isInClipboard', 'isOpenToPublic', 'isPremiumSubscriber', 'memberGHCIInformation', 'memberGHCInformation', 'memberGHCPassportInformation', 'pastPositions', 'niid', 'networkDistance'];
                const trimmedCandidate = _.omit(candidate, omitFields);
                const existingCachedCandidate = searchResultsScraper.scrapedCandidates[candidate.memberId];
                
                if (existingCachedCandidate === undefined){
                    trimmedCandidate.firstName = tsUICommon.cleanseTextOfHtml(trimmedCandidate.firstName);
                    trimmedCandidate.lastName = tsUICommon.cleanseTextOfHtml(trimmedCandidate.lastName);
                    
                    searchResultsScraper.scrapedCandidates[candidate.memberId] = {candidate: trimmedCandidate, isSelected:false};
                    persist = true;

                    if (trimmedCandidate.isJobSeeker){
                        await linkedInApp.upsertContact(trimmedCandidate);
                    }
                }
                else {
                    if (existingCachedCandidate.isSelected == true) {
                        linkedInApp.changeBadgeColor(candidate.memberId, 'red');
                    }

                    if (existingCachedCandidate.isJobSeeker !== candidate.isJobSeeker){
                        searchResultsScraper.scrapedCandidates[candidate.memberId] = {candidate: trimmedCandidate, isSelected:false};
                        await linkedInApp.upsertContact(trimmedCandidate);
                    }
                }
            });

            _highlightJobSeekers(candidatesInResults);

            if (persist){
                searchResultsScraper.persistToLocalStorage();
            }

            $('.badges abbr').bind("click", function(e) {
                const element = $(e.currentTarget);

                const style = $(element).attr('style') || '';
                const isRed = style.indexOf('red') > -1;
                const changeColor = isRed? 'black' : 'red';

                $(element).attr('style', 'color:' + changeColor);

                const candidateMemberId = $('li').has(element).attr('id').replace('search-result-', '')
                const container = searchResultsScraper.scrapedCandidates[candidateMemberId];
                
                if (container != undefined){
                    const candidate = container.candidate;
                    container.isSelected = !isRed;
                    const {memberId, firstName, lastName, location, networkConnection, isJobSeeker} = candidate;
                    linkedInCommon.callAlisonHookWindow('toggleCandidateSelection', {memberId, firstName, lastName, location, networkConnection, isJobSeeker, isSelected: !isRed});
                    linkedInCommon.callAlisonHookWindow('saveLinkedInContact',)
                }
                else {
                    console.log({msg: 'Unable to find candidate:', helper});
                }

            });
        }
    }

    class SearchResultsScraper {
        scrapedCandidates = {};
        
        constructor(){
            var jsonString = window.localStorage.getItem(_localStorageItemName);
            if (jsonString != null && jsonString != undefined){
                this.scrapedCandidates = JSON.parse(jsonString);
            }
        }

        advanceToNextLinkedInResultPage = linkedInCommon.advanceToNextLinkedInResultPage;
        
        deselectCandidate = (memberId) => {
            if (this.scrapedCandidates[memberId] != undefined){
                this.scrapedCandidates[memberId].isSelected = false;
            }
        };

        findCandidate = (searchFor) => {
            return _searchCandidates(this.scrapedCandidates, searchFor);
        }

        persistToLocalStorage = () => {
            var jsonString = JSON.stringify(this.scrapedCandidates);
            window.localStorage.setItem(_localStorageItemName, jsonString);
        }

        clearLocalStorage = () => {
            window.localStorage.removeItem(_localStorageItemName);
        }

        interceptSearchResults = _interceptSearchResults;
    }

    window.searchResultsScraper = new SearchResultsScraper();
})();

