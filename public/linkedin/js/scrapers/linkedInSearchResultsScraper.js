(function () {
    const _localStorageItemName = 'tsSearchResults_ScrapedCandidates';
    const _localStorageLastCandidateProfile = 'tsLastCandidateProfile';
    let _pageCandidates = [];
    let _pageLiTags = {};
    let _keepGatheringJobSeekerExperience = true;
    let _keepWalkingResultsPages = true;
    let _jobsGathered = {};
    let _user = null;

    const _cleanseCandidateData = (candidatesInResults) => {
       candidatesInResults.forEach((c) => {
            c.firstName = tsUICommon.cleanseTextOfHtml(c.firstName);
            c.lastName = tsUICommon.cleanseTextOfHtml(c.lastName);
            c.city = tsUICommon.cleanseTextOfHtml(c.city);
            c.industry = tsUICommon.cleanseTextOfHtml(c.industry);
            c.headline = tsUICommon.cleanseTextOfHtml(c.headline);
            c.summary = tsUICommon.cleanseTextOfHtml(c.summary);
            _cleanJobHistory(c);
       })
    }

    const _highlightPendingConnectionRequests = async (interceptedCandidates) => {
        const memberIds = interceptedCandidates.map(c => c.memberId);
        const pendingRequestCandidatesMemberIds = (await tsConnectionHistoryRepo.getSubset(memberIds))
                                                        .filter(p => p.memberId && p.dateConnectionRequestAcceptanceRecorded && !isNaN(p.dateConnectionRequestAcceptanceRecorded) ? false : true)
                                                        .map(c => c.memberId);


        for (let i = 0; i < pendingRequestCandidatesMemberIds.length; i++){
            const memberId = pendingRequestCandidatesMemberIds[i];
            const element = $(`#search-result-${memberId} h3 a`)[0];

            if (element) {
                $(element).attr('style', 'border-top: dotted')
            }
        }
    }

    const _evaluatePositionKeywordMatch = (keywordsString, position) => {
        if (!(position && position.skills && keywordsString)){
            return 0;
        }

        let result = 0;
        const skills = position.skills.map(s => s.toUpperCase());
        for (let i = 0; i < skills.length; i++){
            if (keywordsString.indexOf(skills[i]) >= 0){
                if (position.current === true){
                    result = 3;
                }
                else {
                    const age = statistician.calculateMonthsSinceWorkedAtPosition(position);
                    result = age < 14 ? 2 : 1;
                }

                break;
            }
        }

        return result;
    }

    const _evaluateCandidateHeadlineKeywordMatch = (keywordsArray, candidate) => {
        const headline = candidate.headline ? candidate.headline.toUpperCase() : '';
        let result = 0;

        for (let i = 0; i < keywordsArray.length; i++){
            const ignoreKeywords = ["SEEKING", "CURRENTLY", "ACTIVELY", "OPEN", "LOOKING FOR"];
            let ignore = false;

            for (let j = 0; j < ignoreKeywords.length; j++){
                if (keywordsArray[i].startsWith(ignoreKeywords[j])){
                    ignore = true;
                    break;
                }
            }

            if ((!ignore) && headline.indexOf(keywordsArray[i]) >= 0){
                result = 3;
                break;
            }
        }

        return result;
    }

    const _displaySkillMatchAnalysis = (candidatesInResults) => {
        /*
        const filters = linkedInRecruiterFilter.scrapeLinkedSearchFilters();

        let keywords = Array.isArray(filters.keywordsPositiveMatchArray) ? filters.keywordsPositiveMatchArray : [];
        keywords = keywords
                    .map(k => k.split('"').join('').toUpperCase())
                    .filter(k => k.indexOf("RECRUITER") === -1
                                && k.indexOf("HR") === -1);

        const keywordStrings = keywords.join(" ");
        */
    }

    const  _displayGrades = (candidate) => {
        let searchResult = $(`#search-result-${candidate.memberId}`);
        searchResult = searchResult[0];
        const newDiv = document.createElement("div");
        $(newDiv).attr('class', "profile-grade-container");

        if (candidate && candidate.grades && candidate.grades.jobJumper) {

            const jjContainer = linkedInCommon.displayGrade('Job Jumper', newDiv, candidate.grades.jobJumper, [ { name: 'name', value: "JobJumper" }, { name: 'memberId', value: candidate.memberId } ]);
            if (jjContainer) {
                tsUICommon.createTooltip(jjContainer, (candidate.technicalYearString) ? candidate.technicalYearString : 'none');
            }
        }

        if (candidate && candidate.statistics && candidate.statistics.grades) {
            const muContainer = linkedInCommon.displayGrade('Months Using', newDiv, candidate.statistics.grades.cumulativeMonthsUsing);
            const wmContainer = linkedInCommon.displayGrade('Within Months', newDiv, candidate.statistics.grades.cumulativeWithinMonths);

            // Lets add tooltips to Months Using / Within Months
            const skillsFilter = tsUICommon.getItemLocally(tsConstants.localStorageKeys.CANDIDATE_FILTERS);
            if (skillsFilter && skillsFilter.skills
                && candidate.statistics && candidate.statistics.skillStatistics) {
                const skillNames = skillsFilter ? Object.keys(skillsFilter.skills) : [];

                const howMonthsUsingWasCalculated = [];
                const howWithinMonthsWasCalculated = [];
                skillNames.forEach((skill) => {
                    const skillStats = candidate.statistics.skillStatistics[skill];
                    if (skillStats && skillStats.grades) {
                        howMonthsUsingWasCalculated.push(`${skill}: ${skillStats.grades.monthsUsing.calculatedBy}`);
                        howWithinMonthsWasCalculated.push(`${skill}: ${skillStats.grades.withinMonths.calculatedBy}`);
                    }
                })
                // Add the tooltips
                if (muContainer && howMonthsUsingWasCalculated.length) {
                    tsUICommon.createTooltip(muContainer, howMonthsUsingWasCalculated.join("<br/><br/>"));
                }
                if (wmContainer && howWithinMonthsWasCalculated.length) {
                    tsUICommon.createTooltip(wmContainer, howWithinMonthsWasCalculated.join("<br/><br/>"));
                }
            }

                $(searchResult).prepend(newDiv);
        }
    }

    const _scrapeCandidateHtml = async (candidate) => {
        // Get data from HTML, not found in JSON.
        const liTag = $(`#search-result-${candidate.memberId}`);
        tsCommon.extendWebElement(liTag);
        _pageLiTags[candidate.memberId] = liTag;

        const profileLink = liTag.mineElementWhereClassContains('profile-link');
        candidate.linkedInRecruiterUrl = $(profileLink).attr("href");

        const imageTag = liTag.mineTag('img');
        candidate.imageUrl = imageTag ? $(imageTag).attr('src') : '';

        const cityState = candidate.location ? candidate.location.split(',') : [""];
        candidate.city = cityState[0];
        candidate.state = cityState.length > 1 ? cityState[1].trim() : "";

        if (candidate.degree){
            let networkConnection = candidate.degree.replace('FIRST_DEGREE', '1').replace('SECOND_DEGREE', '2').replace('THIRD_DEGREE', 3);
            if ('123'.indexOf(networkConnection) === -1){
                networkConnection = '4';
            }

            if (!candidate.alisonConnections){
                candidate.alisonConnections = {};
            }

            if (_user !== null){
                candidate.alisonConnections[_user] = networkConnection;
            }
        }

        // just search the headline for 'Actively Looking';
        if (candidate.headline && candidate.headline.length && !candidate.isJobSeeker){
            const isJobSeekerTexts = ['seeking new opportunit',
                                        'seeking an opportun',
                                        'seeking opportunit',
                                        'seeking a opportunit',
                                        'seeking employment',
                                        'seeking entry ',
                                        'currently seeking ',
                                        'actively seeking ',
                                        'actively looking ',
                                        'currently looking ',
                                        'opentowork',
                                        'open to work',
                                        'looking for new',
                                        'looking for a']

            for (let h = 0; h < isJobSeekerTexts.length; h++){
                const lookFor = isJobSeekerTexts[h];
                let lookIn = tsUICommon.cleanseTextOfHtml(candidate.headline).toLowerCase();
                lookIn = tsString.stripExcessSpacesFromString(lookIn);

                if (lookIn.indexOf(lookFor) >= 0){
                    candidate.isActivelyLooking = true;
                    break;
                }
            }
        }

        _highlightIfCandidateIsJobSeeker(candidate);
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

    const _highlightIfCandidateIsJobSeeker = (candidate) => {
        try {
            if (candidate.isJobSeeker || candidate.isActivelyLooking){
                const styleColor = candidate.isJobSeeker ? 'color:orange' : 'color:firebrick';
                const jobSeekerElement = tsUICommon.findFirstDomElement([`a[href*="${candidate.memberId}"]`, `a:contains("${candidate.fullName}")`]);
                if (jobSeekerElement !== null){
                    const newLabel = '** ' + $(jobSeekerElement).text();
                    $(jobSeekerElement).attr('style', styleColor).text(newLabel);
                }
            }
        }
        catch(e) {
            tsCommon.log(`Unable to highlight job seekers.  ${e.message}. ${e}.`)
        }
    }

    const _shouldWeSkipGettingDetailsOnThisCandidate = (candidate) => {
        if (candidate.isTechnicallyRelevant === false){
            return true;
        }

        if (!candidate.detailsLastScrapedDate){
            return false;
        }

        const nowHelper = tsCommon.now();
        const daysOld = nowHelper.dayDiff(candidate.detailsLastScrapedDate);

        // If we hard code a number and run this the 1st time, we'll always
        // get all on the same date.  randomNumber should help break this up
        const skipIfLessThan = tsCommon.randomNumber(25, 35);
        return daysOld < skipIfLessThan;
    }

    const _gatherCurrentPageOfJobSeekersExperienceData = async (addToProjectConfiguration) => {
        try {
            tsUICommon.saveItemLocally('tsAutoScrapingInProgress', true);
            const addToProject = addToProjectConfiguration ? true : false;
            const minPercentMatch = addToProjectConfiguration ? addToProjectConfiguration.minPercentMatch || 49 : 100;
            const tagString = addToProjectConfiguration ? addToProjectConfiguration.tagString || null : null;

            // addToProject, minPercentMatch, tagString = null
            const seekers = _pageCandidates.filter(c => c.isJobSeeker === true || c.isActivelyLooking === true);
            let totalAdded = 0;

            if (seekers.length > 0){
                let names = seekers.map(s => `${s.firstName} ${s.lastName}`).join(', ');
                tsCommon.log(`# of seekers on this page ${seekers.length}. (${names})`);

                for (let i = 0; i < seekers.length; i++){
                    // eslint-disable-next-line no-await-in-loop
                    const candidate = await candidateController.getCandidate(seekers[i].memberId);

                    const shouldWeSkipCandidate = _shouldWeSkipGettingDetailsOnThisCandidate(candidate);

                    if (shouldWeSkipCandidate){
                        if (addToProject){
                            const selector = linkedInSelectors.searchResultsPage.addToProjectButton(candidate.memberId);
                            const saveToProjectProjectButton = tsUICommon.findFirstDomElement([selector]);

                            if (saveToProjectProjectButton) {
                                saveToProjectProjectButton.click();
                                // eslint-disable-next-line no-await-in-loop
                                await tsCommon.randomSleep(5000, 8000);
                            }
                        }
                    }
                    else {
                        linkedInSearchResultsScraper.persistLastRecruiterProfile(candidate.memberId);

                        // eslint-disable-next-line no-await-in-loop
                        await tsCommon.randomSleep(2000, 3000);

                        var href = "https://www.linkedin.com" + $(`#search-result-${candidate.memberId} a`).attr('href');
                        const candidateWindow = window.open(href);

                        // eslint-disable-next-line no-await-in-loop
                        await tsCommon.waitTilTrue(() => {
                            // wait for linkedInRecruiterProfileScraper to exist.
                            return candidateWindow.linkedInRecruiterProfileScraper ? true : false;
                        }, 15000);

                        // eslint-disable-next-line no-await-in-loop
                        await tsCommon.sleep(15000);

                        // eslint-disable-next-line no-await-in-loop
                        const expandedCandidate =  await candidateWindow.linkedInRecruiterProfileScraper.scrapeProfile(tagString);

                        _jobsGathered[candidate.memberId] = true;

                        // wait 30 to 45 seconds to proceed
                        // eslint-disable-next-line no-await-in-loop
                        await tsCommon.randomSleep(22000, 45000);
                        if (addToProject && expandedCandidate && expandedCandidate.lastSearchFilterMatch){
                            const keywordMatch = expandedCandidate.lastSearchFilterMatch;

                            if (keywordMatch && keywordMatch.percentMatch > minPercentMatch){
                                const saveToProjectButton = $(candidateWindow.document).find(linkedInSelectors.recruiterProfilePage.saveButton);
                                if (saveToProjectButton){
                                    saveToProjectButton.click();
                                    // eslint-disable-next-line no-await-in-loop
                                    await tsCommon.randomSleep(3000, 6000);
                                }
                            }
                        }

                        // eslint-disable-next-line no-await-in-loop
                        try {
                            candidateController.saveCandidate(expandedCandidate);
                        } catch (e) {
                            tsCommon.log(e.message, 'ERROR');
                        }

                        candidateWindow.close();
                    }
                }
            }

            return totalAdded;
        } catch (e) {
            tsCommon.log({ error: 'Error gathering experience data', message: e.message });
        } finally {
            tsUICommon.saveItemLocally('tsAutoScrapingInProgress', false);
        }

        return null;
    }

    const _gatherAllJobSeekersExperienceData = async (addToProjectConfiguration = null) => {
        const totalPages = addToProjectConfiguration ? addToProjectConfiguration.totalPages || 41 : 41;
        console.log(`Will gather data for the for the next ${totalPages} number of pages`);
        let currentPage = 0;

        while(currentPage < totalPages && _keepGatheringJobSeekerExperience){
            // eslint-disable-next-line no-await-in-loop
            await _gatherCurrentPageOfJobSeekersExperienceData(addToProjectConfiguration);

            if (!linkedInCommon.advanceToNextLinkedInResultPage()){
                break;
            }

            // eslint-disable-next-line no-await-in-loop
            await tsCommon.randomSleep(3000, 5000);
            currentPage += 1;
        }

        return null;
    }

    const _walkTheSearchResultsPages = async (keywordMatchCriteria, useSkillStatistics = false) => {
        for (let i = 0; i < 40; i++){
            for (let k = 0; k < _pageCandidates.length; k++){
                const candidate = _pageCandidates[k];
                const match = statistician.doesCandidateMatchForClipboard(candidate, keywordMatchCriteria, useSkillStatistics);

                if (match) {
                    const checkBox = $(`#search-result-${candidate.memberId} input[type*="checkbox"]`)[0];
                    if (checkBox){
                        $(checkBox).prop('checked', true);
                    }
                }
            }

            $('#top-bar').addClass('profile-selected');
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(400);
            $('button[data-action*="clipboard-add"] li-icon').click();

            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(3000);

            if (!linkedInCommon.advanceToNextLinkedInResultPage()){
                break;
            }

            // eslint-disable-next-line no-await-in-loop
            await tsCommon.randomSleep(6000, 9000);
        }

        console.log("DONE - walkTheSearchResultsPages");
    }

    const _cleanJobHistory = (candidate) => {
        const findAndReplace = [{find: '&#x2F;', replace: '/'}, {find: '&amp;', replace: '&'}];

        if (candidate && candidate.positions && candidate.positions.length > 0){
            candidate.positions.forEach((p) => {
                let companyName = p.companyName;
                findAndReplace.forEach((fr) => {
                    companyName = companyName.split(fr.find).join(fr.replace);
                });

                p.companyName = tsUICommon.cleanseTextOfHtml(companyName);
                p.title = tsUICommon.cleanseTextOfHtml(p.title);
                p.displayText = tsUICommon.cleanseTextOfHtml(p.displayText);
            });
        }
    }

    const _persistLastRecruiterProfile = async (memberId) => {
        window.localStorage.setItem(_localStorageLastCandidateProfile, memberId);
    }

    const getCurrentRecruiterProfileCandidate = async () => {
        const memberId = window.localStorage.getItem(_localStorageLastCandidateProfile);
        return await candidateController.getCandidate(memberId);
    }

    const _mergeFields = (sourceObj, destinationObj, fieldNames) => {
        fieldNames.forEach((fieldName) => {
            if ((sourceObj[fieldName] !== undefined && sourceObj[fieldName] !== null)
                && sourceObj[fieldName] !== destinationObj[fieldName]) {
                    destinationObj[fieldName] = sourceObj[fieldName];
            }
        });
    }

    const _mergeScrapedCandidateWithDbCandidate = (dbC, scrapedC) => {
        dbC.lastName = dbC.lastName === "undefined" ? scrapedC.lastName : dbC.lastName;
        dbC.firstName = scrapedC.firstName;

        _mergeFields(scrapedC, dbC, ["degree", "headline", "industry", "isJobSeeker", "isPremiumSubscriber", "location", "canSendMessage", "companyConnectionsPathNum", "extendedLocationEnabled", "index", "networkDistance", "niid", "profileLocked", "prospectId", "score", "sharedNumConnections", "summary", "willingToSharePhoneNumberToRecruiters"]);

        if (Array.isArray(scrapedC.position)){
            scrapedC.positions.forEach((position) => {
                const positionIdentifyingValue = position.companyId || position.companyName;
                const dbPosition = dbC.positions.find(p => p.startDateMonth === position.startDateMonth && (p.companyId === positionIdentifyingValue || p.companyName === positionIdentifyingValue));

                if (dbPosition){
                    _mergeFields(position, dbPosition, ["companyName", "companyType", "companyUrl", "current", "displayText", "endDateMonth", "endDateYear", "searchCompanyUrl", "searchTitleUrl", "title"])
                }
                else {
                    dbC.positions.push(position);
                    isDirty = true;
                }
            });
        }

        return dbC;
    }

    const _mergeScrapedCandidatesWithDbCandidates = async (scrapedCandidates) => {
        const memberIds = scrapedCandidates.map(c => c.memberId);
        const resultCandidates = [];
        const dbCandidates = await candidateRepository.getSubset(memberIds);

        if (!Array.isArray(dbCandidates)){
            return scrapedCandidates;
        }

        scrapedCandidates.forEach((scraped) => {
            const dbCandidate = dbCandidates.find(c => c.memberId === scraped.memberId);
            if (dbCandidate){
                const merged = _mergeScrapedCandidateWithDbCandidate(dbCandidate, scraped);
                resultCandidates.push(merged);
            }
            else {
                resultCandidates.push(scraped);
            }
        });

        return resultCandidates;
    }

    const _trimScrapedCandidate = (scraped) => {
        const omitFields = ['APP_ID_KEY', 'CONFIG_SECRETE_KEY', 'authToken', 'authType', 'canSendMessage', 'companyConnectionsPath', 'currentPositions', 'degree', 'extendedLocationEnabled', 'facetSelections', 'findAuthInputModel', 'graceHopperCelebrationInterestedRoles', 'willingToSharePhoneNumberToRecruiters', 'vectorImage', 'isBlockedByUCF', 'isInClipboard', 'isOpenToPublic', 'isPremiumSubscriber', 'memberGHCIInformation', 'memberGHCInformation', 'memberGHCPassportInformation', 'pastPositions', 'niid', 'networkDistance', 'companyConnectionsPathNum', 'familiarName', 'fullName', 'isOpenProfile', 'memberInATSInfo', 'passedPrivacyCheck', 'projectStatuses', 'prospectId', 'views'];
        const result = _.omit(scraped, omitFields);

        result.lastScrapedBy =  linkedInConstants.pages.RECRUITER_SEARCH_RESULTS;
        return result;
    }

    const _interceptSearchResults = async (responseObj) => {
        const interceptedResults = JSON.parse(responseObj.responseText);
        let candidatesInResults = interceptedResults.result.searchResults;

        _pageCandidates = [];
        _pageLiTags = {};

        _user = await linkedInApp.getAlisonLoggedInUser();

        if (candidatesInResults && candidatesInResults.length > 0){
            await _waitForResultsHTMLToRender(candidatesInResults[candidatesInResults.length - 1]);
            _cleanseCandidateData(candidatesInResults);

            // candidatesInResults = await _mergeScrapedCandidatesWithDbCandidates(candidatesInResults);

            _highlightPendingConnectionRequests(candidatesInResults);

            positionAnalyzer.analyzeCandidatesPositions(candidatesInResults);

            for (let i = 0; i < candidatesInResults.length; i++) {
                const candidate = candidatesInResults[i];
                // eslint-disable-next-line no-await-in-loop
                await _scrapeCandidateHtml(candidate);

                _pageCandidates.push(candidate);

                // Process Statistics
                // Put the skills on each position
                positionAnalyzer.analyzeCandidatePositions(candidate);
                candidate.statistics = statistician.processStatistics(candidate, 'ALL_SKILLS');

                // Calculate Skill Statistics Grades
                statistician.calculateSkillsStatistics([candidate.statistics], false);

                _displayGrades(candidate);

                console.log({candidate});

                const trimmedCandidate = _trimScrapedCandidate(candidate);

                try {
                    // eslint-disable-next-line no-await-in-loop
                    await candidateController.saveCandidate(trimmedCandidate);
                } catch (e) {
                    tsCommon.log(e.message, 'ERROR');
                }
            }

            _displaySkillMatchAnalysis(candidatesInResults);

            linkedInRecruiterFilter.scrapeLinkedSearchFilters();
            const companyAnalytics = positionAnalyzer.processCompanyAnalytics(candidatesInResults);
            linkedInApp.saveCompanyAnalytics(companyAnalytics);
        }
    }

    const _addCurrentPageOfJobSeekersToProject = async () => {
        // $($('#search-result-690582757')[0]).find('button:contains("Save to a project")').length
        for (let i = 0; i < _pageCandidates.length; i++){
            const candidate = _pageCandidates[i];
            if (candidate.isJobSeeker || candidate.isActivelyLooking){
                const memberId = candidate.memberId;
                saveButtonQuery = linkedInSelectors.searchResultsPage.addToProjectButton(memberId);
                if ($(saveButtonQuery).length > 0){
                    $(saveButtonQuery)[0].click();
                    // eslint-disable-next-line no-await-in-loop
                    await tsCommon.randomSleep(3000, 6000);
                }
            }
        }
    }

    const _getContactInfoForEachCandidateInResult = async () => {
        const profileLinks = $('a[href*="recruiter/profile/"]');

        // TBD, not sure if hitting all these profiles is a good idea
    }

    const _touchSearchResultsPages = async (numberOfPages = 100, addJobSeekersToProject = false, getContactInfo = false) => {
        if (addJobSeekersToProject) {
           await  _addCurrentPageOfJobSeekersToProject();
        }
        let advancedToNextPage = linkedInCommon.advanceToNextLinkedInResultPage();
        let currentPage = 0;

        while (advancedToNextPage && currentPage < numberOfPages && _keepWalkingResultsPages){
            if (addJobSeekersToProject){
                // eslint-disable-next-line no-await-in-loop
                await  _addCurrentPageOfJobSeekersToProject();
            }

            if (getContactInfo) {
                // eslint-disable-next-line no-await-in-loop
                await _getContactInfoForEachCandidateInResult();
            }

            // eslint-disable-next-line no-await-in-loop
            await tsCommon.randomSleep(15000, 5000);
            advancedToNextPage = linkedInCommon.advanceToNextLinkedInResultPage();
            currentPage += 1;
        }

        if (currentPage > 0){
            await  _addCurrentPageOfJobSeekersToProject();
        }
    }

    const _getCurrentSearchResultsPageListOfMemberIds = () => {
        return _pageCandidates && _pageCandidates.map ? _pageCandidates.map(c => c.memberId) : [];
    }

    class LinkedInSearchResultsScraper {
        advanceToNextLinkedInResultPage = linkedInCommon.advanceToNextLinkedInResultPage;
        persistLastRecruiterProfile = _persistLastRecruiterProfile;
        walkTheSearchResultsPages = _walkTheSearchResultsPages;
        getCurrentRecruiterProfileCandidate = getCurrentRecruiterProfileCandidate;
        gatherCurrentPageOfJobSeekersExperienceData = _gatherCurrentPageOfJobSeekersExperienceData;
        gatherAllJobSeekersExperienceData = _gatherAllJobSeekersExperienceData;
        suspendGatherJobSeekersExperienceData = (val) => {_keepGatheringJobSeekerExperience = val ? false : true;}

        touchSearchResultsPages = _touchSearchResultsPages;
        suspendTouchSearchResults = (val) => { _keepWalkingResultsPages = val ? false : true;}

        getCurrentSearchResultsPageListOfMemberIds = _getCurrentSearchResultsPageListOfMemberIds;
        interceptSearchResults = _interceptSearchResults;
    }

    window.linkedInSearchResultsScraper = new LinkedInSearchResultsScraper();
})();

