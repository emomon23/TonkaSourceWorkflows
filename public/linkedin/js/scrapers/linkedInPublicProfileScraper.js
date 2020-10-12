(() => {
    const _expSelectors = linkedInSelectors.publicProfilePage.experience;

    const _findCachedCandidate = (scrapedCandidate) => {
        return searchResultsScraper ? searchResultsScraper.findCandidate(`${scrapedCandidate.firstName} ${scrapedCandidate.lastName}`) : null;
    }

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

    const _parseDateStringsForDurationData = (dateStrings) => {
        const result = {};
        
        const dates = dateStrings.split('–').map(d => d.trim());
        //durationData: { years: months: totalMonthsOnJob: startDate, endDate, startDateMonth, startDateYear, ageOfPositionInMonths: (0 = present)}

        if (dates.length !== 2){
            return null;
        }

        const fromDate = new Date(dates[0]);
        const isPresent = dates[1] === 'Present';
        const toDate = isPresent ? null : new Date(dates[1]);
        
        result.isPresent = isPresent;
        result.startDateMonth = fromDate.getMonth() +1;
        result.startDateYear = fromDate.getFullYear();

        if (toDate){
            result.endDateMonth = toDate.getMonth();
            result.endDateYear = toDate.getFullYear();
        }

        return result;       
    }

    const _scrapeJobHistory = async () => {
        const result = [];

        await _expandJobHistory();
        let positionLineItems = tsUICommon.findDomElements(_expSelectors.positionListItems);

        if (!positionLineItems || positionLineItems.length === 0){
            return null;
        }

        for (var i=0; i<positionLineItems.length; i++) {
            try {
                const li = positionLineItems[i];
                const job = {};
                job.title = $(li).find(_expSelectors.positionTitle).text().trim();
                job.companyName = $(li).find(_expSelectors.employer).next().text().trim().split('\n')[0];
                job.description = $(li).find(_expSelectors.experienceDescription).text().trim();
                
                //eg: Oct 2012 - Nov 2013
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
            catch { 
                tsCommon.log("unable to get entire job history");
            }
        }
      
        return result;
    }

    const _scrapeFirstAndLastNameFromProfile = () => {
        let element = tsUICommon.findFirstDomElement(['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")']);
        if (element === null){
            return null;
        }

        let wholeName =  $(element).prop("tagName") === "BUTTON" ? $(element).attr('aria-label') : $(element).text();
        ["Connect with ", "Share ", "Save ","’s profile via message", "' profile via message", "profile via message", "'s profile to PDF", "' profile to PDF", "profile to PDF", "Report or block"].forEach((remove) => {
            wholeName = wholeName.split(remove).join('');
        })

        wholeName = wholeName.split(',')[0].trim(); //This will handle "Alan Haggerty, MCEE"
        if (wholeName.indexOf('(') === 0){
            wholeName = wholeName.substr(wholeName.indexOf(' ')); //This will handle "(75) Alan Haggerty"
        }

        const firstAndLast = wholeName.split(' ');
        let result = {}

        if (firstAndLast.length > 1){
            result.firstName = firstAndLast[0];
            firstAndLast.splice(0, 1);
            result.lastName = firstAndLast.join(' ');
        }

        return result;
    }

    const _scrapeNameLocationDegree = () => {
        const selectors = linkedInSelectors.publicProfilePage;
        const flName = _scrapeFirstAndLastNameFromProfile();
        
        //Minneapolis-St. Paul
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

    const _scrapeProfile = async () => {
            const scrapedCandidate =  _scrapeNameLocationDegree();
            scrapedCandidate.source = 'PUBLIC_PROFILE';
            scrapedCandidate.linkedIn = window.location.href;

            if (scrapedCandidate.isFirstConnection){
                await linkedInContactInfoScraper.scrapeContactInfo(scrapedCandidate);
            }

            scrapedCandidate.positions = await _scrapeJobHistory();
            const now = tsCommon.now();
            scrapedCandidate.positionsLastScraped = now;

            const cachedCandidate = await _findCachedCandidate(scrapedCandidate);
            if (cachedCandidate){
                scrapedCandidate.memberId = cachedCandidate.memberId;
            }
            
            return scrapedCandidate;
    }

    const _searchForPublicProfile = async(contact, sendConnectionRequest) => {
        const selectors = linkedInSelectors.publicProfilePage.search;
        const searchInput = $(selectors.searchInput); 
        
        if (!(contact.firstName && contact.lastName && contact.positions && contact.positions.length > 0 && contact.positions[0].companyName && contact.positions[0].companyName.length > 0)){
            console.log("Not enough information to search for this contact");
            return null;
        }

        let searchString = `${contact.firstName} ${contact.lastName} `;
        let counter = 0;
        for (let i=0; i<contact.positions.length; i++){
            const cn = contact.positions[i].companyName;
            if (cn && cn.length > 0){
                searchString+= cn;
                counter+=1;
                if (counter >= 3){
                    break;
                }
                searchString+= ' ';
            }
        }

        searchInput.focus()
        await tsCommon.sleep(500);
        document.execCommand('insertText', true, `${searchString}\n`);
        await tsCommon.sleep(3000);

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

    class LinkedInPublicProfileScraper {
        scrapeProfile = _scrapeProfile; 
        searchForPublicProfile = _searchForPublicProfile;     
    }

    window.linkedInPublicProfileScraper = new LinkedInPublicProfileScraper();
})();