(() => {
<<<<<<< HEAD
    const _runJobHistoryScraperJob = async(howMany) => {
        tsJobHistoryScrapeManager.begin(howMany);
=======
<<<<<<< HEAD
    _runJobHistoryScraperJob = async (howMany = 5, tagsFilter = null) => {
        await linkedInCommon.callAlisonHookWindow('runJobHistoryScraperJob', {howMany, tagsFilter});
>>>>>>> Jobseekers and Dashboard html pages
    }

    class TSCommand {
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
=======
    
    _launchDashboard = async () => {
        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonUI/dashboard/dashboard.html`;
        const dashboardWindow = window.open(url, "Dashboard", "scrollbars=yes,resizable=yes,width=1000,height=1000,top=0,left=0");

        await tsCommon.sleep(10000);

        if (!dashboardWindow){
            tsCommon.log("Unable to open dashboard.  CHECK POP UP BLOCKER?", "WARN");
        }
    }
    class TSCommand {
        constructor(){}

        launchDashboard = _launchDashboard;
>>>>>>> Jobseekers and Dashboard html pages
    }

    window.tsCommand = new TSCommand();
})();