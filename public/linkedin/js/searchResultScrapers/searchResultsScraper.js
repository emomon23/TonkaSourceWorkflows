(function() {
    const _localStorageItemName = 'tsSearchResults_ScrapedCandidates';
    const _localStorageLastCandidateMemberId = 'tsLastMemberId';
    let _pageCandidates = [];
    let _pageLiTags = {};
    let _keepAddingToProject = true;
    
    const _scrapeCandidateHtml = async (candidate) => {
        //Get data from HTML, not found in JSON.
        const liTag = $(`#search-result-${candidate.memberId}`);
        tsCommon.extendWebElement(liTag);
        _pageLiTags[candidate.memberId] = liTag;

        const profileLink = liTag.mineElementWhereClassContains('profile-link');
        candidate.linkedInRecruiterUrl = $(profileLink).attr("href");

        const imageTag = liTag.mineTag('img');
        candidate.imageUrl = imageTag? $(imageTag).attr('src') : '';
 
        const cityState = candidate.location? candidate.location.split(',') : [""];
        candidate.city = cityState[0];
        candidate.state = cityState.length > 1? cityState[1].trim() : "";

        if (candidate.degree){
            let networkConnection = candidate.degree.replace('FIRST_DEGREE', '1').replace('SECOND_DEGREE', '2').replace('THIRD_DEGREE', 3);
            if ('123'.indexOf(networkConnection) === -1){
                networkConnection = '4';
            }

            if (!candidate.alisonConnections){
                candidate.alisonConnections = {};
            }

            const loggedInAlisonUserName = await linkedInApp.getAlisonLoggedInUser();
            if (loggedInAlisonUserName !== null){
                candidate.alisonConnections[loggedInAlisonUserName] = networkConnection;
            }
        }

        const isJobSeekerTexts = ['seeking new opportunit', 'actively looking', 'opentowork', 'open to work', 'looking for new']
        if (!candidate.isJobSeeker){
            isJobSeekerTexts.forEach((text) => {
                if (liTag.containsText(text)){
                    candidate.isActivelyLooking = true;
                }
            })
        }
    }

    const _waitForResultsHTMLToRender = async (lastCandidate) => {
        const lastCandidateId = `#search-result-${lastCandidate.memberId}`;
        let liTag = $(lastCandidateId);
        let count = 0;

        while(count < 50 && (!liTag || !$(liTag).attr('id'))){
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(100);
            liTag = $(lastCandidateId);
        }
    }

    const _highlightJobSeekers = (currentPageOfCandidates) => {
        try {
            if (currentPageOfCandidates && Array.isArray(currentPageOfCandidates) && currentPageOfCandidates.length > 0){
                currentPageOfCandidates.forEach((candidate) => {
                    if (candidate.isJobSeeker || candidate.isActivelyLooking){
                        const styleColor = candidate.isJobSeeker? 'color:orange' : 'color:firebrick';
                        const jobSeekerElement = tsUICommon.findFirstDomElement([`a[href*="${candidate.memberId}"]`, `a:contains("${candidate.fullName}")`]);
                        if (jobSeekerElement !== null){
                            const newLabel = '** ' + $(jobSeekerElement).text();
                            $(jobSeekerElement).attr('style', styleColor).text(newLabel);
                        }
                    }
                });
            }
        }
        catch(e) {
            tsCommon.log(`Unable to highlight job seekers.  ${e.message}. ${e}.`)
        }
    }

    const _searchCandidates = (searchFor) => {
        let candidateReference = null;
        const scrapedCandidates = searchResultsScraper.scrapedCandidates;

        try {
            candidateReference = scrapedCandidates[searchFor];
            if (candidateReference !== undefined && candidateReference !== null){
                return candidateReference.candidate;
            }
        } catch {
            // Do nothing
        }

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

    const _getCandidateKeywordCount = async (candidateNameOrId, commaSeparatedListOfKeywords) => {
        const candidate = _searchCandidates(candidateNameOrId);
        if (candidate){
            liTag = _pageLiTags[candidate.memberId];
            if (!liTag){
                tsCommon.log(`Unable to find link for ${candidate.firstName} ${candidate.lastName}`);
                return;
            }

            var href = "https://www.linkedin.com" + $(`#search-result-${candidate.memberId} a`).attr('href');
            const candidateWindow = window.open(href);

            await tsCommon.sleep(2000);
            const baseRef = $(candidateWindow.document).find(linkedInSelectors.recruiterProfilePage.profilePrimaryContent);
            const keyWords = commaSeparatedListOfKeywords.split(",");
            const result = [];

            keyWords.forEach((key) => {
                const k = key.trim();
                const count = tsUICommon.getWordCount(baseRef, k);
                result.push({key: k, count});
            });

            candidateWindow.close();
            await tsCommon.sleep(2000);

            // eslint-disable-next-line consistent-return
            return result;
        }
        else {
            tsCommon.log(`Unable to find candidate '${candidateNameOrId}'`);
        }
    }

    const _recruiterProfileKeyWordsMatchCount = async(candidate, commaSeparatedListOfWords) => {
        //EG.
        //commaSeparatedListOfWords = "C#:3,AWS:4,PostgreSQL"
        //we want C# mentioned 3+ times,  AWS mentioned 4+ times, and PostgreSQL at least once

        if (!commaSeparatedListOfWords || commaSeparatedListOfWords.trim().length === 0){
            return true;
        }

        const justSkillNamesArray = commaSeparatedListOfWords.split(",").map(i => i.split(":")[0].trim())
        const keywordsCount = await _getCandidateKeywordCount(candidate, justSkillNamesArray.join());
       
        const desiredCounts = commaSeparatedListOfWords.split(",").map(i => i.split(":").length > 1? i.split(":")[1].trim() : 1)
        let result = true;

        for (let i=0; i<justSkillNamesArray.length; i++){
            const minCount = desiredCounts[i];
            if (isNaN(minCount)){
                tsCommon.log(`${commaSeparatedListOfWords[i]} doesn't make sense`, "WARN");
                break;
            }

            count = keywordsCount.find(k => k.key === justSkillNamesArray[i]).count;
            if (count < minCount){
                result = false;
                break;
            }
        }

        tsCommon.log(`Just keyword verified ${candidate.firstName} ${candidate.lastName} (keyword counts do ${result === false? "not " : ""} match), need to pause for a bit...`);
        await tsCommon.randomSleep(6000, 11000);
        return result;
    }

    const _addCurrentPageOfJobSeekersToProject = async(commaSeperatedKeywordsCountGreaterThanThree = null) => {
        const seekers = _pageCandidates.filter(c => c.isJobSeeker === true || c.isActivelyLooking === true);
        let totalAdded = 0;

        if (seekers.length > 0){
            window.scrollTo(0,document.body.scrollHeight);
            tsCommon.log(`# of seekers on this page ${seekers.length}`);
            let needToWait = false;

            for (let i=0; i<seekers.length; i++){
                const seeker = seekers[i];
                const liTag = _pageLiTags[seeker.memberId];
                
                if (liTag){
                    if (needToWait === true){
                        // eslint-disable-next-line no-await-in-loop
                        await tsCommon.randomSleep(3000, 6000);
                        needToWait = false;
                    }

                    const saveToProject = tsUICommon.findFirstDomElement([`li[id*="${seeker.memberId}"] button[class*="save-btn"]`]);
                   
                    if (saveToProject) {
                        // eslint-disable-next-line no-await-in-loop
                        const mayAddToProject = await _recruiterProfileKeyWordsMatchCount(seeker, commaSeperatedKeywordsCountGreaterThanThree);
                        
                        if (mayAddToProject){
                            $(saveToProject).click();
                            totalAdded += 1;
                            tsCommon.log(`Added ${seeker.firstName} ${seeker.lastName} to project.  ${(new Date()).toLocaleTimeString()}`);
                            needToWait = true;
                        }
                    }
                    else {
                        tsCommon.log(`No 'SAVE' button found for candidate ${seeker.firstName} ${seeker.lastName}.  Are they already added to the project?`);
                    }
                } else {
                    tsCommon.log(`Hmmm, unable to find liTag for candidate ${seeker.firstName} ${seeker.lastName}`)
                }

            }
        }

        return totalAdded;
    }

    const _addJobSeekersToCurrentProject = async (totalDesiredNumber, commaSeperatedKeywordsCountGreaterThanThree = null) => {
        if (!totalDesiredNumber || isNaN(totalDesiredNumber)){
            tsCommon.log("** YOU MUST provide a totalDesiredNumber parameter", "ERROR");
            return 0;
        }

        _keepAddingToProject = true;
        let numberAdded = await _addCurrentPageOfJobSeekersToProject(commaSeperatedKeywordsCountGreaterThanThree);
        let totalAdded = numberAdded;
        
        while(totalAdded < totalDesiredNumber && _keepAddingToProject){
            if (numberAdded > 0){
                // eslint-disable-next-line no-await-in-loop
                await tsCommon.randomSleep(3000, 5000);
            }

            if (!linkedInCommon.advanceToNextLinkedInResultPage()){
                break;
            }

            // eslint-disable-next-line no-await-in-loop
            await tsCommon.randomSleep(5000, 10000);
            // eslint-disable-next-line no-await-in-loop
            numberAdded= await _addCurrentPageOfJobSeekersToProject(commaSeperatedKeywordsCountGreaterThanThree);
            totalAdded+= numberAdded;
        }
        
       return totalAdded;
    }

    const _filterDefaultCandidatesToPersistToLocalStorage = (scrapedCandidates, daysOld) => {
        const result = {};
        const now = tsCommon.now();

        for(var k in scrapedCandidates){
            const c = scrapedCandidates[k].candidate;
            if ((c.isJobSeeker === true || c.isActivelyLooking === true || c.persistToLocalStorage === true)
                && (daysOld === null || now.dayDiff(this.scrapedCandidates[k].dateScraped) < daysOld)){
                    result[k] = this.scrapedCandidates[k];
            }
        }
    }

    const _interceptSearchResults = async (responseObj) => {
        const interceptedResults = JSON.parse(responseObj.responseText);
        const candidatesInResults = interceptedResults.result.searchResults;
        _pageCandidates = [];
        _pageLiTags = {};

        if (candidatesInResults && candidatesInResults.length > 0){
            await _waitForResultsHTMLToRender(candidatesInResults[candidatesInResults.length -1]);

            candidatesInResults.forEach(async (candidate) => {
                await _scrapeCandidateHtml(candidate);
                
                const omitFields = ['APP_ID_KEY', 'CONFIG_SECRETE_KEY', 'authToken', 'authType', 'canSendMessage', 'companyConnectionsPath', 'currentPositions', 'degree', 'extendedLocationEnabled', 'facetSelections', 'findAuthInputModel', 'graceHopperCelebrationInterestedRoles', 'willingToSharePhoneNumberToRecruiters', 'vectorImage', 'isBlockedByUCF', 'isInClipboard', 'isOpenToPublic', 'isPremiumSubscriber', 'memberGHCIInformation', 'memberGHCInformation', 'memberGHCPassportInformation', 'pastPositions', 'niid', 'networkDistance'];
                const trimmedCandidate = _.omit(candidate, omitFields);
                const existingCachedCandidate = searchResultsScraper.scrapedCandidates[candidate.memberId];
                
                _pageCandidates.push(candidate);

                if (!existingCachedCandidate){
                    trimmedCandidate.firstName = tsUICommon.cleanseTextOfHtml(trimmedCandidate.firstName);
                    trimmedCandidate.lastName = tsUICommon.cleanseTextOfHtml(trimmedCandidate.lastName);
                    
                    searchResultsScraper.scrapedCandidates[candidate.memberId] = {candidate: trimmedCandidate, isSelected:false, dateScraped: new Date()};
                    if (trimmedCandidate.isJobSeeker || trimmedCandidate.isActivelyLooking){
                        await linkedInApp.upsertContact(trimmedCandidate);
                    }
                }
                else {
                    if (existingCachedCandidate.isSelected === true) {
                        linkedInApp.changeBadgeColor(candidate.memberId, 'red');
                    }

                    const existingIsJobSeeker = existingCachedCandidate.candidate.isJobSeeker || existingCachedCandidate.candidate.isActivelyLooking;
                    const scrapedIsJobSeeker = candidate.isJobSeeker || candidate.isActivelyLooking;
                    if ((existingIsJobSeeker === true && scrapedIsJobSeeker !== true)
                        || (existingIsJobSeeker !== true && scrapedIsJobSeeker === true)){
                        searchResultsScraper.scrapedCandidates[candidate.memberId] = {candidate: trimmedCandidate, isSelected:false};
                        await linkedInApp.upsertContact(trimmedCandidate);
                    }
                }
            });

            _highlightJobSeekers(candidatesInResults);

            $('.badges abbr').bind("click", (e) => {
                const element = $(e.currentTarget);

                const style = $(element).attr('style') || '';
                const isRed = style.indexOf('red') > -1;
                const changeColor = isRed? 'black' : 'red';

                $(element).attr('style', 'color:' + changeColor);

                const candidateMemberId = $('li').has(element).attr('id').replace('search-result-', '')
                const container = searchResultsScraper.scrapedCandidates[candidateMemberId];
                
                if (container !== undefined){
                    const candidate = container.candidate;
                    container.isSelected = !isRed;
                    const {memberId, firstName, lastName, location, networkConnection, isJobSeeker} = candidate;
                    linkedInCommon.callAlisonHookWindow('toggleCandidateSelection', {memberId, firstName, lastName, location, networkConnection, isJobSeeker, isSelected: !isRed});
                }
                else {
                    tsCommon.log({msg: 'Unable to find candidate:', helper});
                }

            });
        }
    }

    class SearchResultsScraper {
        scrapedCandidates = {};
        
        constructor(){
            var jsonString = window.localStorage.getItem(_localStorageItemName);
            if (jsonString !== null && jsonString !== undefined){
                this.scrapedCandidates = JSON.parse(jsonString);
            }
        }

        advanceToNextLinkedInResultPage = linkedInCommon.advanceToNextLinkedInResultPage;
        
        deselectCandidate = (memberId) => {
            if (this.scrapedCandidates[memberId] !== undefined){
                this.scrapedCandidates[memberId].isSelected = false;
            }
        };

        findCandidate = _searchCandidates;

        persistLastRecruiterProfile = (memberId) => {
            const candidateContainer = this.scrapedCandidates[memberId];
            if (candidateContainer && candidateContainer.candidate){
                candidateContainer.candidate.persistToLocalStorage = true;
                window.localStorage.setItem(_localStorageLastCandidateMemberId, memberId);
            }
            else {
                window.localStorage.setItem(_localStorageLastCandidateMemberId, '');
            }        
            
            return candidateContainer;
        }

        getCurrentRecruiterProfileCandidate = () => {
            const memberId = window.localStorage.getItem(_localStorageLastCandidateMemberId);
            return this.scrapedCandidates[memberId];
        }

        persistToLocalStorage = (daysOld = null) => {
            if (daysOld === 0){
                searchResultsScraper.clearLocalStorage();
                return;
            }

            let onlyJobSeekers = _filterDefaultCandidatesToPersistToLocalStorage(this.scrapedCandidates, daysOld);
            const jsonString = JSON.stringify(onlyJobSeekers);
            
            try {
                window.localStorage.setItem(_localStorageItemName, jsonString);
            }
            catch(e) {
                onlyJobSeekers = null; // free up this memory before making a recursive call
                const onlyRecentDays = dayDiff === null ? 1 : 0;
                this.persistToLocalStorage(onlyRecentDays);
            }
        }

        clearLocalStorage = () => {
            window.localStorage.removeItem(_localStorageItemName);
            this.scrapedCandidates = {};
        }

        addCurrentPageOfJobSeekersToProject = _addCurrentPageOfJobSeekersToProject;
        addAllJobSeekersToCurrentProject = _addJobSeekersToCurrentProject;
        suspendAddJobSeekersToCurrentProject = (val) => {_keepAddingToProject = !val;}

        getCandidateKeywordCount = _getCandidateKeywordCount;

        interceptSearchResults = _interceptSearchResults;
    }

    window.searchResultsScraper = new SearchResultsScraper();
})();

