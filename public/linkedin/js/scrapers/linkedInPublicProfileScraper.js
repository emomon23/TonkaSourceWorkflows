(() => {
    const _expSelectors = linkedInSelectors.publicProfilePage.experience;

    const _findCachedCandidate = (scrapedCandidate) => {
        return searchResultsScraper ? searchResultsScraper.findCandidate(`${scrapedCandidate.firstName} ${scrapedCandidate.lastName}`) : null;
    }

    const _expandJobHistory = async () => {
        let showMore = tsUICommon.findFirstDomElement([_expSelectors.seeMorePosition]);
            
        while (showMore && showMore.length > 0 && $(showMore[0]).text().indexOf('fewer') === -1){
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.randomSleep(3000, 5000);
            showMore[0].click();

            tsUICommon.findFirstDomElement([_expSelectors.seeMorePosition]);
        }

        await tsUICommon.sleep(300);
    }

    const _parseDateStringsForDurationData = (dateStrings) => {
        const result = {};
        const dates = dateStrings.split(' - ');
        //durationData: { years: months: totalMonthsOnJob: startDate, endDate, startDateMonth, startDateYear, ageOfPositionInMonths: (0 = present)}

        if (dates.length !== 2){
            return null;
        }

        const fromDate = new Date(dates[0]);
        const toDate = dates[1] === 'Present' ? new Date() : new Date(dates[1]);
        const daysDiff = tsCommon.dayDifference(fromDate, toDate);

        result.years = Number.parseInt(daysDiff / 365);
        result.months = (daysDiff - (result.years * 365)) / 30.5;
        result.months = Number.parseInt(result.months) + 1;
        result.totalMonthsOnJob = daysDiff / 30.5;
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
            job.employer = $(li).find(_expSelectors.positionCompany).text().trim();
            job.description = $(li).find(_expSelectors.experienceDescription).text().trim();
            job.location = $($(li).find(_expSelectors.location)[0]).text().trim();

            //eg: Oct 2012 - Nov 2013
            let dateString = $(li).find(_expSelectors.dates).text().replace('Dates Employed', '').trim();
            job.durationData = _parseDateStringsForDurationData(dateString);

            result.push(job);
        }
      
        return result;
    }

    const _scrapeNameAndLocation = (candidate) => {
       /*fullName: 'ul[class*="pv-top-card"] li',
        degreeConnection: 'ul[class*="pv-top-card"] span',
        location: 'ul[class*="list-bullet"] li*/
        const selectors = linkedInSelectors.publicProfilePage;

        //Alan Haggerty, MSEE
        const fullName = $(selectors.fullName)[0].textContent.trim();
        const degrees = $(selectors.degreeConnection)[0].textContent.trim();
        
        //Minneapolis-St. Paul
        const location = $(selectors.location)[0].text.replace('Greater', '').replace('Area', '').trim();



    }

    const _scrapeProfile = async () => {
            const scrapedCandidate = await linkedInContactInfoScraper.scrapeContactInfo(cachedCandidate);
            _scrapeNameAndLocation(scrapedCandidate);
            scrapedCandidate.positions = await _scrapeJobHistory();

            const cachedCandidate = await _findCachedCandidate();
            if (cachedCandidate) {
                ca
                searchResultsScraper.persistToLocalStorage();
            }
            await linkedInApp.upsertContact(scrapedCandidate);

            return updatedCandidate;
       
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