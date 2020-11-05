(() => {
    const _runJobHistoryScraperJob = async (howMany) => {
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

    const _launchDashboard = async () => {
        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonUI/dashboard/dashboard.html`;
        const jobSeekers = await candidateRepository.getJobSeekers();
        const contractors = await candidateRepository.getContractors();

        const list = jobSeekers.concat(contractors);

        console.log(`There are ${jobSeekers.length} current job seekers`);


        const dashboardWindow = window.open(url, "Dashboard", "scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes,width=1000,height=1000,top=0,left=0");
        await tsCommon.sleep(4000);

        if (dashboardWindow) {
            for (let i = 0; i < list.length; i++){
                tsCommon.postMessageToWindow(dashboardWindow, 'acceptJobSeeker', list[i]);
                // eslint-disable-next-line no-await-in-loop
                await tsCommon.sleep(100);
            }

            tsCommon.postMessageToWindow(dashboardWindow, 'marshallingCandidatesDone');
        }
        else {
            tsCommon.log("Unable to open dashboard.  CHECK POP UP BLOCKER?", "WARN");
        }
    }

    const _runDailyJobSeekerReport = async () => {
        const openUrl = 'https://www.linkedin.com' + $('a[class*="product"]')[0].getAttribute('href');
        const jobWindow = window.open(openUrl);
        await tsCommon.sleep(7000);

        $(jobWindow.document).find('a[title*="MyConnectionsLooking"]')[0].click();
        await tsCommon.sleep(7000);

        $(jobWindow.document).find('a[class*="talent-pool-link"]')[0].click()
        await tsCommon.sleep(8000);

        const pageOneLink = $(jobWindow.document).find('a[title="Page 1"]')[0];
        if (pageOneLink){
            pageOneLink.click();
            await tsCommon.sleep(8000);
        }

        await jobWindow.searchResultsScraper.gatherAllJobSeekersExperienceData();
        await tsCommon.sleep(2000);

        jobWindow.close();

        _launchDashboard();
    }

    class TSCommand {
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
        launchSkillsGPASearch = _launchSkillsGPASearch;
        launchInMailBlaster = _launchInMailBlaster;
        runDailyJobSeekerReport = _runDailyJobSeekerReport;

        launchDashboard = _launchDashboard;
    }

    window.tsCommand = new TSCommand();
})();