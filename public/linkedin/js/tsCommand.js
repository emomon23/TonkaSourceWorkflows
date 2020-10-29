(() => {
    const _runJobHistoryScraperJob = async(howMany) => {
        tsJobHistoryScrapeManager.begin(howMany);
    }

    const _launchInMailBlaster = async () => {
        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonUI/inmailblast/inmailBlast.html`;
        const win = window.open(url, "InMail", "scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes,width=1000,height=1000,top=0,left=0");

        await tsCommon.sleep(5000);
        tsCommon.postMessageToWindow(win, 'givingYouAReferenceBackToLinkedInWindow', {});

        if (!win){
            tsCommon.log("Unable to open dashboard.  CHECK POP UP BLOCKER?", "WARN");
        }
    }

    const _launchSkillsGPASearch = async () => {
        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonUI/jobseekers/jobseekers.html`;
        const dashboardWindow = window.open(url, "Dashboard", "scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes,width=1000,height=1000,top=0,left=0");

        await tsCommon.sleep(10000);

        tsCommon.postMessageToWindow(dashboardWindow, 'givingYouAReferenceBackToLinkedInWindow', {});

        if (!dashboardWindow){
            tsCommon.log("Unable to open dashboard.  CHECK POP UP BLOCKER?", "WARN");
        }
    }

    class TSCommand {
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
        launchSkillsGPASearch = _launchSkillsGPASearch;
        launchInMailBlaster = _launchInMailBlaster;
    }

    window.tsCommand = new TSCommand();
})();