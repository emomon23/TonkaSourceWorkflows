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
        const toDate = dates[1] === 'Present' ? new Date() : new Date(dates[1]);
        const daysDiff = Math.ceil(tsCommon.dayDifference(toDate, fromDate) + 30);

        result.years = Number.parseInt(daysDiff / 365);
        result.months = (daysDiff - (result.years * 365)) / 30.5;
        result.months = Number.parseInt(result.months) + 1;
        result.totalMonthsOnJob = Math.round(daysDiff / 30.5);
        result.startDate = fromDate;
        result.endDate = toDate;
        result.startDateMonth = fromDate.getMonth();
        result.startDateYear = fromDate.getFullYear();
        result.endDateMonth = toDate.getMonth();
        result.endDateYear = toDate.getFullYear();

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
            const li = positionLineItems[i];
            const job = {};
            job.jobTitle = $(li).find(_expSelectors.positionTitle).text().trim();
            job.rippedEmployer = $(li).find(_expSelectors.employer).next().text().trim();
            job.description = $(li).find(_expSelectors.experienceDescription).text().trim();
            
            //eg: Oct 2012 - Nov 2013
            let dateString = $(li).find(_expSelectors.dates).text().replace('Dates Employed', '').trim();
            job.durationData = _parseDateStringsForDurationData(dateString);

            result.push(job);
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

    const _scrapeNameAndLocation = () => {
        const selectors = linkedInSelectors.publicProfilePage;
        const flName = _scrapeFirstAndLastNameFromProfile();
        
        //Minneapolis-St. Paul
        //const location = $(selectors.location)[0].text.replace('Greater', '').replace('Area', '').trim();

        return {
            firstName: flName.firstName,
            lastName: flName.lastName,
        }
    }

    const _scrapeProfile = async () => {
            const scrapedCandidate =  _scrapeNameAndLocation();
            scrapedCandidate.source = 'PUBLIC_PROFILE';
            scrapedCandidate.linkedIn = window.location.href;

            await linkedInContactInfoScraper.scrapeContactInfo(scrapedCandidate);

            scrapedCandidate.positions = await _scrapeJobHistory();
            
            const cachedCandidate = await _findCachedCandidate(scrapedCandidate);
            if (cachedCandidate){
                scrapedCandidate.memberId = cachedCandidate.memberId;
            }
            
            //await linkedInApp.upsertContact(scrapedCandidate);
            console.log({scrapedCandidate})
            return scrapedCandidate;
    }

    class LinkedInPublicProfileScraper {
        scrapeProfile = _scrapeProfile;      
    }

    window.linkedInPublicProfileScraper = new LinkedInPublicProfileScraper();

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PUBLIC_PROFILE) {
            _scrapeProfile();
        }
    })
})();