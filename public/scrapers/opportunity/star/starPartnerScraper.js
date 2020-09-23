(function() {
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

    const _scrapeResults = async (confirmEach = false) => {
        var opportunities = [];
        var keepScraping = false;
        var confirmed = true;
        var currentPage = 1;

        // Scrape the listing of opportunities, there may be multiple pages
        do {
            tsCommon.log("Scraping current page, stand by...");

            const opportunitiesOnThisPage = _scrapeCurrentPageOpportunityResults(opportunities);

            tsCommon.log("Page " + currentPage + " scraped. " + opportunitiesOnThisPage + " opportunities on this page.");
            
            keepScraping = starUtils.advanceToNextOpportunityPage();
            if (keepScraping){
                //Wait for it to load
                // eslint-disable-next-line no-await-in-loop
                await tsCommon.sleep(5000);
            }
            else {
                tsCommon.log("Completed scraping STAR Collaborative opportunities. " + opportunities.length + " opportunities were scraped.");
            }
            currentPage++;
        }
        while(keepScraping)

        return opportunities;
    }

    const _scrapeCurrentPageOpportunityResults = (opportunities) => {
        const opportunityRows = $("#contacttable tbody tr").toArray();
        tsCommon.extendWebElements(opportunityRows);

        opportunityRows.forEach((opp) => {
            const newOpportunity = _scrapeOpportunity(opp, true);

            opportunities.push(newOpportunity);
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
        starOpportunity.JobNumber = $(cpJobUrlElement).html().trim();

        var starOpportunityDetail = _scrapeOpportunityDetail(starOpportunity.cpJobUrl);

        return Object.assign(starOpportunity, starOpportunityDetail);
    }

    const _scrapeOpportunityDetail = async (jobUrl) => {
        // $(jobLink).attr("target","");
        // $(jobLink)[0].click();

        return await tsCommon.httpGetText(jobUrl);

    }

    const _interceptJob = async (response) => {

        const encodedHtml = response.responseText.split("Hello Collaborative Provider,")[1].split("www.STARcollaborative.com")[0]
        const decodedHtml = tsCommon.decodeHtml(encodedHtml);
        const jobDetailsObj = $('<div></div>').html(decodedHtml).children();
        // eslint-disable-next-line no-alert
        alert($(jobDetailsObj).html());
        console.log($(jobDetailsObj).html());
    }

    class StarPartnerScraper {
        constructor(){}

        scrapeResults = _scrapeResults;
        scrapeOpportunityDetail = _scrapeOpportunityDetail;
        interceptJob = _interceptJob;
    }

    window.starPartnerScraper = new StarPartnerScraper();
})();

