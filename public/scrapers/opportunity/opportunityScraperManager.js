(function() {
    // These are High Level 'Commands' that the app supports
    // that the alisonHook UI (or user) can call.

    const _scrapeOpportunities = async () => {
        /*
         * TODO: Loads the allisonApi.html window
         * Posts initialization message to new window
         * Ask scraper factor for scraper
         * Call scraper.scrapeOpportunities
         * Call via post Alison API Window saveOpportunity
         */

        const scraper = opportunityScraperFactory.getScraper();
        window.scrapedOpportunities = await scraper.scrapeResults();
    }

    class opportunityScraperManager {
        scrapeOpportunities = _scrapeOpportunities;
    }

    window.opportunityScraperManager = new opportunityScraperManager();

    // All messages posted back to the Target tab / tamper Monkey
    // should be routed to the TS object.
    tsCommon.setUpPostMessageListener('opportunityScraperManager');

    window.launchTonkaSource = async () => {
        const url = 'https://tonkasourceworkflows.firebaseapp.com/linkedin/alisonHook/alisonHook.html';
        window.alisonHookWindow = window.open(url, "Opportunity Manager", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=900,height=800,top=5000,left=5000");

        await tsCommon.sleep(2000);
        linkedInCommon.callAlisonHookWindow('initialization');
    }
    
    tsInterceptor.interceptResponse('get', '/PortalStarJob?', starPartnerScraper.interceptJob);

})();
