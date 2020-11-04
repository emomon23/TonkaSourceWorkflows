(function() {
    const _localStorageItemName = 'tsSearchResults_ScrapedCandidates';
    const _localStorageLastCandidateProfile = 'tsLastCandidateProfile';
    let _pageCandidates = [];
    let _pageLiTags = {};
    let _keepGatheringJobSeekerExperience = true;
    let _keepWalkingResultsPages = true;
    let _jobsGathered = {};
    let _user = null;

    const  _displayJobJumperAnalysis = (candidate) => {
        if (candidate
            && candidate.grades
            && candidate.grades.jobJumper){

                let searchResult = $(`#search-result-${candidate.memberId}`);

                searchResult = searchResult[0];

                const newDiv = document.createElement("div");
                $(newDiv).attr('class', "profile-grade-container");
                linkedInCommon.displayGrade('Job Jumper', newDiv, candidate.grades.jobJumper, [ { name: 'memberId', value: candidate.memberId }]);

                $(searchResult).prepend(newDiv);
        }
    }

    const _scrapeCandidateHtml = async (candidate) => {
        //Get data from HTML, not found in JSON.
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

        //just search the headline for 'Actively Looking';
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

            for (let h=0; h<isJobSeekerTexts.length; h++){
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
        _displayJobJumperAnalysis(candidate);
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

    const _shouldWeSkipGettingDetailsOnThisCandidate = (candidate) => {
        if (candidate.isTechnicallyRelevant === false){
            return true;
        }

        if (!candidate.detailsLastScrapedDate){
            return false;
        }

        const nowHelper = tsCommon.now();
        const daysOld = nowHelper.dayDiff(candidate.detailsLastScrapedDate);

        //If we hard code a number and run this the 1st time, we'll always
        //get all on the same date.  randomNumber should help break this up
        const skipIfLessThan = tsCommon.randomNumber(25, 35);
        return daysOld < skipIfLessThan;
    }

    const _gatherCurrentPageOfJobSeekersExperienceData = async(addToProjectConfiguration) => {
        try {
            tsUICommon.saveItemLocally('tsAutoScrapingInProgress', true);
            const addToProject = addToProjectConfiguration ? true : false;
            const minPercentMatch = addToProjectConfiguration ? addToProjectConfiguration.minPercentMatch || 49 : 100;
            const tagString = addToProjectConfiguration ? addToProjectConfiguration.tagString || null : null;

            //addToProject, minPercentMatch, tagString = null
            const seekers = _pageCandidates.filter(c => c.isJobSeeker === true || c.isActivelyLooking === true);
            let totalAdded = 0;

            if (seekers.length > 0){
                let names = seekers.map(s => `${s.firstName} ${s.lastName}`).join(', ');
                tsCommon.log(`# of seekers on this page ${seekers.length}. (${names})`);

                for (let i=0; i<seekers.length; i++){
                    // eslint-disable-next-line no-await-in-loop
                    const candidate = await candidateRepository.getCandidate(seekers[i].memberId);

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
                        searchResultsScraper.persistLastRecruiterProfile(candidate.memberId);

                        // eslint-disable-next-line no-await-in-loop
                        await tsCommon.randomSleep(2000, 3000);

                        var href = "https://www.linkedin.com" + $(`#search-result-${candidate.memberId} a`).attr('href');
                        const candidateWindow = window.open(href);

                        // eslint-disable-next-line no-await-in-loop
                        await tsCommon.waitTilTrue(() => {
                            //wait for linkedInRecruiterProfileScraper to exist.
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
                            candidateRepository.saveCandidate(expandedCandidate);
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
            currentPage+=1;
        }

        return null;
    }

    const _cleanJobHistoryCompanyNames = (candidate) => {
        const findAndReplace = [{find: '&#x2F;', replace: '/'}, {find: '&amp;', replace: '&'}];

        if (candidate && candidate.positions && candidate.positions.length > 0){
            candidate.positions.forEach((p) => {
                let companyName = p.companyName;
                findAndReplace.forEach((fr) => {
                    companyName = companyName.split(fr.find).join(fr.replace);
                });

                p.companyName = companyName;
            });
        }
    }

    const _persistLastRecruiterProfile = async (memberId) => {
        window.localStorage.setItem(_localStorageLastCandidateProfile, memberId);
    }

    const getCurrentRecruiterProfileCandidate = async() => {
        const memberId = window.localStorage.getItem(_localStorageLastCandidateProfile);
        return await candidateRepository.getCandidate(memberId);
    }

    const _trimScrapedCandidate = (scraped) => {
        const omitFields = ['APP_ID_KEY', 'CONFIG_SECRETE_KEY', 'authToken', 'authType', 'canSendMessage', 'companyConnectionsPath', 'currentPositions', 'degree', 'extendedLocationEnabled', 'facetSelections', 'findAuthInputModel', 'graceHopperCelebrationInterestedRoles', 'willingToSharePhoneNumberToRecruiters', 'vectorImage', 'isBlockedByUCF', 'isInClipboard', 'isOpenToPublic', 'isPremiumSubscriber', 'memberGHCIInformation', 'memberGHCInformation', 'memberGHCPassportInformation', 'pastPositions', 'niid', 'networkDistance', 'companyConnectionsPathNum', 'familiarName', 'fullName', 'isOpenProfile', 'memberInATSInfo', 'passedPrivacyCheck', 'projectStatuses', 'prospectId', 'views'];
        const result = _.omit(scraped, omitFields);

        result.firstName = tsUICommon.cleanseTextOfHtml(result.firstName);
        result.lastName = tsUICommon.cleanseTextOfHtml(result.lastName);

        _cleanJobHistoryCompanyNames(result);

        result.lastScrapedBy =  linkedInConstants.pages.RECRUITER_SEARCH_RESULTS;
        return result;
    }

    const _interceptSearchResults = async (responseObj) => {
        const interceptedResults = JSON.parse(responseObj.responseText);
        const candidatesInResults = interceptedResults.result.searchResults;
        _pageCandidates = [];
        _pageLiTags = {};

        _user = await linkedInApp.getAlisonLoggedInUser();

        if (candidatesInResults && candidatesInResults.length > 0){
            await _waitForResultsHTMLToRender(candidatesInResults[candidatesInResults.length -1]);

            positionAnalyzer.analyzeCandidatePositions(candidatesInResults);

            candidatesInResults.forEach(async (candidate) => {
                await _scrapeCandidateHtml(candidate);
                _pageCandidates.push(candidate);

                const trimmedCandidate = _trimScrapedCandidate(candidate);

                try {
                    candidateRepository.saveCandidate(trimmedCandidate);
                } catch (e) {
                    tsCommon.log(e.message, 'ERROR');
                }

                if (trimmedCandidate.isJobSeeker || trimmedCandidate.isActivelyLooking){
                    await linkedInApp.upsertContact(trimmedCandidate);
                }
            });

            linkedInRecruiterFilter.scrapeLinkedSearchFilters();
            const companyAnalytics = positionAnalyzer.createCompanyAverageDurationObject(candidatesInResults);
            linkedInApp.saveCompanyAnalytics(companyAnalytics);
        }
    }

    const _addCurrentPageOfJobSeekersToProject = async () => {
        //$($('#search-result-690582757')[0]).find('button:contains("Save to a project")').length
        for (let i=0; i<_pageCandidates.length; i++){
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

    const _touchSearchResultsPages = async (numberOfPages = 100, addJobSeekersToProject = false) => {
        if (addJobSeekersToProject) {
           await  _addCurrentPageOfJobSeekersToProject();
        }
        let advancedToNextPage = linkedInCommon.advanceToNextLinkedInResultPage();
        let currentPage = 0;

        while (advancedToNextPage && currentPage < numberOfPages && _keepWalkingResultsPages){
            // eslint-disable-next-line no-await-in-loop
            await  _addCurrentPageOfJobSeekersToProject();
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.randomSleep(15000, 5000);
            advancedToNextPage = linkedInCommon.advanceToNextLinkedInResultPage();
            currentPage+=1;
        }

        if (currentPage > 0){
            await  _addCurrentPageOfJobSeekersToProject();
        }
    }

    class SearchResultsScraper {
        advanceToNextLinkedInResultPage = linkedInCommon.advanceToNextLinkedInResultPage;
        persistLastRecruiterProfile = _persistLastRecruiterProfile;
        getCurrentRecruiterProfileCandidate = getCurrentRecruiterProfileCandidate;
        gatherCurrentPageOfJobSeekersExperienceData = _gatherCurrentPageOfJobSeekersExperienceData;
        gatherAllJobSeekersExperienceData = _gatherAllJobSeekersExperienceData;
        suspendGatherJobSeekersExperienceData = (val) => {_keepGatheringJobSeekerExperience = val ? false : true;}

        touchSearchResultsPages = _touchSearchResultsPages;
        suspendTouchSearchResults = (val) => { _keepWalkingResultsPages = val ? false : true;}

        interceptSearchResults = _interceptSearchResults;
    }

    window.searchResultsScraper = new SearchResultsScraper();
})();

