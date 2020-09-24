(function() {
    const _localStorageItemName = opportunityConstants.localStorageKeys.SCRAPED_OPPORTUNITIES;

    const _getDurationFromDetail = (html) => {
        const regexp = /Role duration is estimated to be (\d+ \w+)/;
        
        const matches = html.match(regexp);
        
        if (matches && matches.length > 0) {
            return matches[1];
        }
        tsCommon.log("STAR Opportunity Detail: Could not scrape Duration.");
        return null;
    }

    const _getDetailsAndDescriptionFromDetail = (html) => {
        const regexp = /["]?View job in the.*STAR CP Opportunity Portal<\/a>/;
        
        const matches = html.split(regexp);
        
        if (matches && matches.length > 0) {
            return matches;
        }
        tsCommon.log("STAR Opportunity Detail: Could not scrape Details and Description.");
        return null;
    }

    const _getJobNumberFromDetail = (html) => {
        const regexp = /Client Job #: (\d+|\d+-\d+|MED\w\w\w\d+)/;
        
        const matches = html.match(regexp);
        
        if (matches && matches.length > 0) {
            return matches[1];
        }
        tsCommon.log("STAR Opportunity Detail: Could not scrape Job Number.");
        return null;
    }

    const _getPaymentTermsFromDetail = (html) => {
        const regexp = /PAYMENT TERMS: first payment is (\d+ \w+)/;
        
        const matches = html.match(regexp);
        
        if (matches && matches.length > 0) {
            return matches[1];
        }
        tsCommon.log("STAR Opportunity Detail: Could not scrape Payment Terms.");
        return null;
    }

    const _getRatesFromDetail = (html) => {
        // eslint-disable-next-line no-useless-escape
        const currencyRegExp = '[$]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{1,2})?';
        const re = `Rate Guidance: ((${currencyRegExp}) - (${currencyRegExp}))`;
        const regexp = new RegExp(re);
        
        const matches = html.match(regexp);

        if (matches && matches.length > 0) {
            const lowRate = tsCommon.convertCurrencyStringToNumber(matches[2]);
            const highRate = tsCommon.convertCurrencyStringToNumber(matches[3]);
            return tsCommon.calculateRateGuidance(lowRate, highRate);
        }
        tsCommon.log("STAR Opportunity Detail: Could not scrape Rate.");
        return null;
    }

    const _getStarNumberFromDetail = (html) => {
        const regexp = /STAR # (\d+)/;
        
        const matches = html.match(regexp);
        
        if (matches && matches.length > 0) {
            return matches[1];
        }
        tsCommon.log("STAR Opportunity Detail: Could not scrape STAR #.");
        return null;
    }

    const _getStatus = (status) => {
        switch (status.toLowerCase()) {
            case "closed":
                return opportunityScraperFactory.Status.CLOSED;
            case "open":
                return opportunityScraperFactory.Status.NEW;
            default:
                return opportunityScraperFactory.Status.NEW;
        }
    }

    const _interceptOpportunity = async (response) => {

        const firstPart = response.responseText.split("Hello Collaborative Provider,")[1];
        const secondParts = firstPart.split("www.STARcollaborative.com");
        
        const encodedHtml = secondParts[0];
        const decodedHtml = tsCommon.decodeHtml(encodedHtml);

        const results = _getDetailsAndDescriptionFromDetail(decodedHtml);
        
        const opportunity = {};
        if (results && results.length) {
            opportunity.details = results[0];
            opportunity.description = results[1];
        }

        let starNumber = '';

        if (opportunity.details) {
            opportunity.duration = _getDurationFromDetail(opportunity.details);
            opportunity.jobNumber = _getJobNumberFromDetail(opportunity.details);
            opportunity.paymentTerms = _getPaymentTermsFromDetail(opportunity.details)
            opportunity.rates = _getRatesFromDetail(opportunity.details);
            opportunity.rate = (opportunity.rates) ? opportunity.rates.candidateRateGuidance : '';
            
            starNumber = _getStarNumberFromDetail(opportunity.details);

            const cachedOpportunity = starPartnerScraper.scrapedOpportunities[starNumber];

            if (cachedOpportunity) {
                cachedOpportunity.opportunity = Object.assign(cachedOpportunity.opportunity, opportunity);
                starPartnerScraper.scrapedOpportunities[starNumber] = cachedOpportunity;
                opportunityScraperManager.upsertOpportunity(cachedOpportunity);
            } else {
                console.log(`STAR #${starNumber}: Intercepted this opportunity but could not locate a cached opportunity.`, 'WARN');
            }
        } else {
            console.log('STAR Opportunity: Intercepted opportunity but could not parse the details.', 'WARN');
        }
        
        return opportunity;
    }

    const _scrapeResults = async (confirmEach = false) => {
        let keepScraping = false;
        let confirmed = true;
        let currentPage = 1;

        // Scrape the listing of opportunities, there may be multiple pages
        do {
            tsCommon.log("Scraping current page, stand by...");

            const opportunitiesOnThisPage = _scrapeOpportunityList();
            tsCommon.persistToLocalStorage(_localStorageItemName, starPartnerScraper.scrapedOpportunities);

            tsCommon.log("Page " + currentPage + " scraped. " + opportunitiesOnThisPage + " opportunities on this page.");
            
            keepScraping = starUtils.advanceToNextOpportunityPage();
            if (keepScraping){
                //Wait for it to load
                // eslint-disable-next-line no-await-in-loop
                await tsCommon.sleep(5000);
            }
            else {
                tsCommon.log("Completed scraping STAR Collaborative opportunities. " + starPartnerScraper.scrapedOpportunities.length + " opportunities were scraped.");
            }
            currentPage++;
        }
        while(keepScraping)
    }

    const _scrapeOpportunityList = () => {
        const opportunityRows = $("#contacttable tbody tr").toArray();
        tsCommon.extendWebElements(opportunityRows);

        opportunityRows.forEach((opp) => {
            const newOpportunity = _scrapeOpportunity(opp, true);

            starPartnerScraper.scrapedOpportunities[newOpportunity.starNumber] = newOpportunity;
        });

        return opportunityRows.length;
    }

    const _scrapeOpportunity = (opp, confirmWhenDone = false) => {
        const oppColumns = opp.mineTags('td');
        // First column is just an image
        // 2nd column contains
        const starOpportunity = {};
        
        // Get the opportunity details
        const title = $(oppColumns[2].mineTag('span')).html();
        const company = $(oppColumns[3]).html().trim();
        const oppType = $(oppColumns[4]).html().trim();
        const status = $(oppColumns[5]).html().trim();

        const locationCity = $(oppColumns[7].mineTag('span')).html().trim();
        const locationState = $(oppColumns[8].mineTag('span')).html().trim();
        const jobNumber = $(oppColumns[9].mineTag('span')).html().trim();

        starOpportunity.opportunity = opportunityScraperFactory.newOpportunity({
            company,
            jobNumber,
            location: opportunityScraperFactory.getLocation(locationCity, locationState),
            partnerCompany: opportunityScraperFactory.PartnerCompany.STAR,
            status: _getStatus(status),
            title,
            type: opportunityScraperFactory.getType(oppType),
        });
        
        // Get STAR Opportunity details
        const cpJobUrlElement = oppColumns[1].mineTag('a');
        // Remove target _blank
        $(cpJobUrlElement).attr("target","");
        starOpportunity.cpJobUrl = $(cpJobUrlElement).attr('href');
        starOpportunity.starNumber = $(cpJobUrlElement).html().trim();

        const starOpportunityDetail = _scrapeOpportunityDetail(starOpportunity.cpJobUrl);

        return Object.assign(starOpportunity, starOpportunityDetail);
    }

    const _scrapeOpportunityDetail = async (jobUrl) => {
        const properUrl = jobUrl.replace('http://starcollaborativeportal.force','https://starcollaborativeportal.secure.force')
        return await tsCommon.httpGetText(properUrl);
    }

    class StarPartnerScraper {
        constructor() {
            tsCommon.clearLocalStorage(_localStorageItemName);
        }

        scrapedOpportunities = {};

        interceptOpportunity = _interceptOpportunity;
        scrapeResults = _scrapeResults;
        scrapeOpportunityDetail = _scrapeOpportunityDetail;
    }

    window.starPartnerScraper = new StarPartnerScraper();
})();

