(() => {
    const _expSelectors = linkedInSelectors.publicProfilePage.experience;

    const _expandJobHistory = async () => {
        await tsUICommon.scrollTilTrue(() => {
            return $(_expSelectors.seeMorePositions).length > 0;
        });

        let showMore = $(_expSelectors.seeMorePositions).length > 0 ? $(_expSelectors.seeMorePositions)[0] : null;
        while (showMore) {
                showMore.scrollIntoView();
                showMore.click();
                showMore = $(_expSelectors.seeMorePositions).length > 0 ? $(_expSelectors.seeMorePositions)[0] : null;
                // eslint-disable-next-line no-await-in-loop
                await tsCommon.sleep(500);
        }

        $(_expSelectors.showMoreJobDescriptionText).click();
        await tsCommon.sleep(500);
    }

    const KEEP_TRYING = 'keep trying';
    const FOUND_EM = 'found them';
    const STOP_TRYING = 'stop trying';

    const _parseDateStringsForDurationData = (dateStrings) => {
        const result = {};

        const dates = dateStrings.split('–').map(d => d.trim());
        // durationData: { years: months: totalMonthsOnJob: startDate, endDate, startDateMonth, startDateYear, ageOfPositionInMonths: (0 = present)}

        if (dates.length !== 2){
            return null;
        }

        const fromDate = new Date(dates[0]);
        const isPresent = dates[1] === 'Present';
        const toDate = isPresent ? null : new Date(dates[1]);

        result.isPresent = isPresent;
        result.startDateMonth = fromDate.getMonth() + 1;
        result.startDateYear = fromDate.getFullYear();

        if (toDate){
            result.endDateMonth = toDate.getMonth() + 1;
            result.endDateYear = toDate.getFullYear();
        }

        return result;
    }

    const _scrapeRawExperienceText = () => {
        let result = '';

        try {
            const experienceSection = $(_expSelectors.experienceSection)[0];
            let text = $(experienceSection).text().split('\n').join(' ').trim();
            result = tsString.stripExcessSpacesFromString(text);
        } catch (e){
            console.log(`Error in linkedInPublicProfileScraper._scrapeRawExperienceText. ${e.message}`);
        }

        return result;
    }

    const _scrapeCompanyRoles = (li) => {
        const multipleRoles = $(li).find('ul').length > 0;
        if (!multipleRoles){
            return null;
        }

        const companyName = $(li).find('h3:contains("Company")').text().split('Company Name').join('').split('\n').join('').trim();
        const roleListItems = $(li).find('ul li');
        const result = [];

        let showMore = $(li).find('button[class*="see-more-inline"]');
        showMore = showMore.length > 0 ? showMore[0] : null;
        if (showMore){
            showMore.click();
        }

        roleListItems.toArray().forEach((roleListItem) => {
            try {
                const title = $(roleListItem).find('h3').text().split('\n').join('').split('Title').join('').trim();
                const rawDatesString = $(roleListItem).find('h4:contains("Dates Employed")').text().split('Dates Employed').join('').split('\n').join('').trim();
                const description = $(roleListItem).find('p[class*="description"]').text().trim();

                const role = linkedInCommon.parseJobDurationDateRangeString(rawDatesString);
                role.title = title;
                role.description = description;
                role.companyName = companyName;

                result.push(role);
            }
            catch(e){
                tsCommon.log(`ERROR in publicProfileScraper _scrapeCompanyRoles. ${e.message}`, "ERROR");
            }
        });

        return result;
    }

    const _scrapeJobHistory = async () => {
        let result = [];

        await _expandJobHistory();
        let positionLineItems = tsUICommon.findDomElements(_expSelectors.positionListItems);

        if (!positionLineItems || positionLineItems.length === 0){
            return null;
        }

        for (var i = 0; i < positionLineItems.length; i++) {
            try {
                const li = positionLineItems[i];
                const multipleRoles =  _scrapeCompanyRoles(li);

                if (multipleRoles && multipleRoles.length > 0){
                    result = result.concat(multipleRoles);
                }
                else {
                    const companyName = $(li).find(_expSelectors.employer).next().text().trim().split('\n')[0].trim();

                    const job = {};
                    job.title = $(li).find(_expSelectors.positionTitle).text().trim();
                    job.companyName = companyName;
                    job.description = $(li).find(_expSelectors.experienceDescription).text().split(':').join(';').trim();

                    if (!job.description || job.description.length === 0){
                        job.description = "EMPTY";
                    }

                    // eg: Oct 2012 - Nov 2013
                    let dateString = $(li).find(_expSelectors.dates).text().replace('Dates Employed', '').trim();
                    const durationData = _parseDateStringsForDurationData(dateString);
                    if (durationData && job.companyName && job.companyName.length > 0){
                        job.startDateMonth = durationData.startDateMonth;
                        job.startDateYear = durationData.startDateYear;

                        if (!durationData.isPresent){
                            job.endDateMonth = durationData.endDateMonth;
                            job.endDateYear = durationData.endDateYear;
                        }

                        result.push(job);
                    }
                }
            }
            catch (e) {
                tsCommon.log("unable to get entire job history");
            }
        }

        return result;
    }

    const _scrapeFirstAndLastNameFromProfile = async () => {
        let element = tsUICommon.jQueryWait(['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")']);
        if (element === null){
            return null;
        }

        let wholeName =  $(element).prop("tagName") === "BUTTON" ? $(element).attr('aria-label') : $(element).text();
        ["Connect with ", "Share ", "Save ","’s profile via message", "' profile via message", "profile via message", "'s profile to PDF", "' profile to PDF", "profile to PDF", "Report or block"].forEach((remove) => {
            wholeName = wholeName.split(remove).join('');
        })

        if (wholeName.length === 0){
            wholeName = $('ul[class*="pv-top-card"] li[class*="inline"]')[0].textContent.trim();
        }
        wholeName = wholeName.split(',')[0].trim(); // This will handle "Alan Haggerty, MCEE"
        if (wholeName.indexOf('(') === 0){
            wholeName = wholeName.substr(wholeName.indexOf(' ')); // This will handle "(75) Alan Haggerty"
        }

        const result = tsString.parseOutFirstAndLastNameFromString(wholeName);
        return result;
    }

    const _scrapeNameLocationDegree = async () => {
        const selectors = linkedInSelectors.publicProfilePage;
        const flName = await _scrapeFirstAndLastNameFromProfile();

        // Minneapolis-St. Paul
        const locationAreaElement = $(selectors.location)[0];
        const locationAreaString = $(locationAreaElement).text().trim().replace('Greater', '').replace('Area', '').trim();
        const isFirstConnection = $(selectors.fullName).find(selectors.degreeConnection).length > 0;

        const result = {
            firstName: flName.firstName,
            lastName: flName.lastName,
            areas: locationAreaString.split('-').map(s => s.trim()),
            isFirstConnection: isFirstConnection
        }

        const seeMoreSummaryButton = $(selectors.aboutSummarySeeMore);

        if (seeMoreSummaryButton){
            seeMoreSummaryButton.click();
            result.summary = $(selectors.aboutSummary).text().trim();
        }

        return result;
    }

    const _scrapedFakeUser = () => {
        try {
            const result = $($('img[class*="me-photo"]')[0]).attr('alt');
            return result && result.length > 0 ? result : null;
        } catch(e) {
            return null;
        }
    }

    const _scrapeHeadline = () => {
        const h2 = $('section[class*="pv-top-card"] h2')[0];
        let result = h2 ? $(h2).text().trim() : '';

        return tsUICommon.cleanseTextOfHtml(result);
    }

    const _scrapeImageUrl = () => {
        const img = $('section[class*="pv-top-card"] img[class*="pv-top-card__photo"]')[0];
        return img ? $(img).attr('src') : '';
    }

    const _scrapeProfile = async (includeJobHistory = true) => {
            const fakeUser = _scrapedFakeUser();
            const scrapedCandidate =  await _scrapeNameLocationDegree();
            scrapedCandidate.linkedIn = window.location.href;

            scrapedCandidate.headline = _scrapeHeadline();
            scrapedCandidate.imageUrl = _scrapeImageUrl();

            if (includeJobHistory) {
                scrapedCandidate.positions = await _scrapeJobHistory();
                scrapedCandidate.rawExperienceText = _scrapeRawExperienceText();
                scrapedCandidate.positionsLastScraped = (new Date()).getTime();
            }

            if (fakeUser){
                scrapedCandidate.scrapedBy = fakeUser;
            }

            return scrapedCandidate;
    }

    const _cleanSearchString = (searchString) => {
        searchString = searchString.split("&amp;").join("&").split('&#x27;').join("'");

        let startIndex = searchString.indexOf("(");
        if (startIndex === -1){
            return searchString;
        }

        let endIndex = searchString.indexOf(")", startIndex);
        if (endIndex === -1){
            return searchString;
        }

        const replace = searchString.substr(startIndex, (endIndex - startIndex) + 1);
        const cleaned = searchString.split(replace).join(' ');

        return _cleanSearchString(cleaned);
    }

    const _addCompanyNameToSearchIsUniqueEnough = async (appendToSearch) => {
        const cleaned = _cleanSearchString(appendToSearch);

        const selectors = linkedInSelectors.publicProfilePage.search;
        const searchInput = $(selectors.searchInput);

        searchInput.focus()
        await tsCommon.sleep(500);
        document.execCommand('insertText', true, ` ${cleaned}`);
        console.log(`appended ${cleaned} to search`)
        await tsCommon.sleep(8000);

        const searchInputOverlayList = $(selectors.searchInputOverlayList);
        const length = $(searchInputOverlayList).length;

        if (length === 1){
            return STOP_TRYING
        }

        if (length === 2){
            return $(searchInputOverlayList)[1].textContent.indexOf('See all result') ? FOUND_EM : STOP_TRYING;
        }

        if (length > 2){
            return KEEP_TRYING;
        }
        return STOP_TRYING;
    }

    const _getCompanyNames = (seeker) => {
        if (!(seeker && seeker.positions)){
            return [];
        }

        let result = seeker.positions.map(p => {
            if (typeof p === "string"){
                return p;
            }

            return p.companyName ? p.companyName : '';
        });

        result = [...new Set(result)];
        return result.length === 1 && result[0] === '' ? [] : result;
    }

    const _searchForPublicProfile = async (contact, sendConnectionRequest) => {
        const selectors = linkedInSelectors.publicProfilePage.search;
        const searchInput = $(selectors.searchInput);

        const companyNames = _getCompanyNames(contact);

        if (!(contact.firstName && contact.lastName && companyNames.length > 0)){
            console.log("Not enough information to search for this contact");
            return null;
        }

        // search with minimal infomation 1st (their name and 1st company name - eg Jon Nelson Hollander)
        let searchString = `${contact.firstName} ${contact.lastName} ${companyNames[0]}`;
        $(searchInput).val('');
        let searchListResult = await _addCompanyNameToSearchIsUniqueEnough(searchString);


        let positionIndex = 1;
        while (searchListResult === KEEP_TRYING){
            // jon nelson hollander wasn't enough, add 1 company at a time until we find him or should stop looking
            if (companyNames.length <= positionIndex){
                break;
            }

            const appendCompany = companyNames[positionIndex];
            // eslint-disable-next-line no-await-in-loop
            searchListResult = await _addCompanyNameToSearchIsUniqueEnough(appendCompany);
            positionIndex += 1;
        }

        if (searchListResult !== FOUND_EM){
            return null;
        }

        const searchInputOverlayList = $(selectors.searchInputOverlayList);
        if (searchInputOverlayList && searchInputOverlayList.length > 0 && $(searchInputOverlayList)[0].textContent.trim().indexOf('See all results') === -1){
            ($(searchInputOverlayList)[0]).click();
            await tsCommon.sleep(3000);
        }

        const searchResultsListItems = $(selectors.searchResultsListItems);
        if (searchResultsListItems && searchResultsListItems.length > 0){
            const profileLinks = $($(searchResultsListItems)[0]).find(selectors.searchResultListItemProfileLink);
            if (profileLinks && profileLinks.length > 0){
                profileLinks[0].click();
                await tsCommon.sleep(2000);
            }
        }

        const result = await _scrapeProfile();
        console.log({searchResult: result});

        if (sendConnectionRequest){
            try {
                let button = $(linkedInSelectors.publicProfilePage.connectWithButton);
                if (button && $(button).length > 0){
                    $(button)[0].click();
                    await tsCommon.sleep(3000);

                    button = $(linkedInSelectors.publicProfilePage.connectionNoNoteSendButton)[0];
                    button.click();
                }
            }
            catch(e){
                console.log(`Unable to send connection request to ${candidate.firstName} ${candidate.lastName}.  ${e.message}`);
            }
        }

        return result;
    }

    const _goHome = async () => {
        const anchors = $('a[href*="/feed/"]:contains("Home")');
        if (anchors.length > 0){
            anchors[0].click();
            await tsCommon.sleep(3000);
        }
    }

    class LinkedInPublicProfileScraper {
        scrapeProfile = _scrapeProfile;
        searchForPublicProfile = _searchForPublicProfile;
        goHome = _goHome;
    }

    window.linkedInPublicProfileScraper = new LinkedInPublicProfileScraper();

    const _delayReady = async () => {
        tsCommon.sleep(1000);
        const currentProfile = await _scrapeProfile(false);
        linkedInPublicProfileScraper.currentProfileLite = currentProfile;

        const candidate = await candidateController.searchForCandidate(currentProfile);
        if (candidate){
            const container = $('main section')[0];

            tsConfirmCandidateSkillService.displayTSConfirmedSkillsForCandidate(container, candidate)
            tsConfirmCandidateSkillService.displayTSNote(container, candidate);
            tsConfirmCandidateSkillService.displayPhoneAndEmail(container, candidate);
        }

        $('input[class*="search-global-typeahead"]').keydown(() => {
            linkedInPublicProfileScraper.currentProfileLite = null;
            tsConfirmCandidateSkillService.clearUI();
        })
    }

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PUBLIC_PROFILE) {
            _delayReady();
        }
    });
})();