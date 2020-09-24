(function() {
    // These are High Level 'Commands' that the app supports
    // that the alisonHook UI (or user) can call.

    const _scrapeOpportunities = async () => {
        const scraper = opportunityScraperFactory.getScraper();
        window.scrapedOpportunities = await scraper.scrapeResults();
    }

    const _upsertOpportunity = async (opportunity) => {
        tsCommon.log({ message: "Saving Opportunity", opportunity: opportunity });
        await tsCommon.callAlisonHookWindow('saveOpportunity', opportunity);
        return null;
    }

    class opportunityScraperManager {
        scrapeOpportunities = _scrapeOpportunities;
        upsertOpportunity = _upsertOpportunity;
    }

    window.opportunityScraperManager = new opportunityScraperManager();
    
    tsInterceptor.interceptResponse('get', '/PortalStarJob?', starPartnerScraper.interceptOpportunity);

    $(document).ready(() => {
        tsCommon.sleep(10000);
        _scrapeOpportunities();
    });

})();
