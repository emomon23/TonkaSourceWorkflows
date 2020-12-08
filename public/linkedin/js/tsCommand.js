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
    const _createTonkaSourceMenu = () => {
        const tsMenu = $(document.createElement('div')).attr('id', 'tsMenu').attr('class', 'ts-menu');


        const companySkillSearch = $(document.createElement('div'))
            .attr('class', 'ts-menu-item')
            .click(_displayCompanySkillSearchHtml)
            .text("Company Skill Search");

        const menuItem2 = $(document.createElement('div')).attr('class', 'ts-menu-item').click(() => {
            const html = "REPORT 2";
            $('#tsContent').html(html).show();
        }).text("REPORT 2");

        const menuItem3 = $(document.createElement('div')).attr('class', 'ts-menu-item').click(() => {
            const html = "REPORT 3";
            $('#tsContent').html(html).show();
        }).text("REPORT 3");

        const toggleButton = $(document.createElement('button')).click(() => {
            $('#tsContent').toggle();
        }).text("Show/Hide").attr('class', 'ts-menu-button-toggle ts-button-li');

        tsMenu.append(companySkillSearch).append(menuItem2).append(menuItem3).append(toggleButton);

        return tsMenu;
    }

    const _displayCompanySkillSearchHtml = () => {
        // Clear the content
        $('#tsContent').html("");
        const container = $(document.createElement('div'))
            .attr('id', 'companySkillSearchContainer')
            .attr('class', 'company-skill-search-container');

        // Create the Skill Search elements
        const skillSearchContainer = $(document.createElement('div'));
        const skillSearchInput = $(document.createElement('input'))
            .attr('id', 'tsSkillSearch')
            .attr('name', 'skillSearch');
        const skillSearchButton = $(document.createElement('button'))
            .attr('id', 'skillSearchButton')
            .attr('class', 'ts-button-li')
            .text('Search')
            .click(_getSkillSearchResults);
        $(skillSearchContainer).append('<span>Skill(s)<span>').append(skillSearchInput).append(skillSearchButton);

        // Create the results container
        const resultsContainer = $(document.createElement('div'))
            .attr('id', 'companySkillSearchResultsContainer')
            .attr('class', 'company-skill-search-results');

        $(container).append(skillSearchContainer);
        $(container).append(resultsContainer);

        $('#tsContent').append(container).show();
    }

    const _getSkillSearchResults = async () => {
        $('#companySkillSearchResultsContainer').html("");
        const skillSearch = $("#tsSkillSearch").val();

        const matchingSkillCompanies = await skillCompaniesController.search(skillSearch);

        const resultsContainer = $('div[class*="company-skill-search-results"');

        const headers = [
            { name: "ID", property: "companyId" },
            { name: "Company", property: "name" },
            { name: "Skills", property: "skills" }
        ];
        const grid = _createDataGrid(headers, matchingSkillCompanies);

        $('#companySkillSearchResultsContainer').append(grid);
    }

    const _createDataGrid = (configs, data, type = 'COMPANY_SUMMARY') => {
        const grid = $(document.createElement('div')).attr('class', 'table');

        // Loop through configs and create headers
        const headerRow = $(document.createElement('div')).attr('class', 'table-header');
        configs.forEach((c) => {
            const header = $(document.createElement('div')).attr('class', 'table-header-cell').text(c.name);
            $(headerRow).append(header);
        });

        const tableBody = $(document.createElement('div')).attr('class', 'table-body');
        // Loop through Data and apply attributes to columns
        data.forEach((d) => {
            const dataRow = $(document.createElement('div')).attr('class', 'table-row');
            configs.forEach((c) => {
                const dataCell = $(document.createElement('div')).attr('class', 'table-cell')

                // Create a link for Company Name if this is COMPANY_SUMMARY
                if (type === 'COMPANY_SUMMARY' && (c.property === 'companyId' || c.property === 'name') && !isNaN(parseInt(d['companyId']))) {
                    const link = $(document.createElement('a'))
                        .attr('target', '_blank')
                        .attr('href', `https://www.linkedin.com/recruiter/company/${d['companyId']}`)
                        .text(d[c.property]);
                    $(dataCell).append(link);
                } else {
                    let propData = d[c.property];
                    if (Array.isArray(propData)) {
                        propData = propData.sort().join(', ');
                    }
                    $(dataCell).text(propData);
                }
                $(dataRow).append(dataCell);
            })
            $(tableBody).append(dataRow);
        });

        return $(grid).append(headerRow).append(tableBody);
    }

    const _launchTonkaSourceMenu = () => {
        const tsContainer = $(document.createElement('div')).attr('id', 'tsContainer').attr('class', 'ts-container');
        const tsContent = $(document.createElement('div')).attr('id', 'tsContent').attr('class', 'ts-content');
        const tsMenu = _createTonkaSourceMenu();
        $(tsContainer).append(tsMenu).append(tsContent);
        $('body').prepend(tsContainer);
    }

    const _launchConnectionRequestBlaster = async () => {
        const crStats = await connectionLifeCycleLogic.displayStatsConsoleLogMessage();

        const memberIds = searchResultsScraper.getCurrentSearchResultsPageListOfMemberIds();
        if (!memberIds || memberIds.length === 0){
            console.log("No member ids available on current page, refresh the result pane");
            return;
        }

        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonUI/connectionRequestBlast/connectionRequestBlast.html`;
        const win = window.open(url, "InMail", "scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes,width=1000,height=1000,top=0,left=0");

        await tsCommon.sleep(5000);
        tsCommon.postMessageToWindow(win, 'givingYouAReferenceBackToLinkedInWindow', crStats);

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
        const jobSeekers = await candidateController.getJobSeekers();
        const contractors = await candidateController.getContractors();

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

    const _setTSConfiguration = (key, value) => {
        tsConfig.set(key,value);
    }

    const _getTSConfiguration = (key) => {
       return tsConfig.get(key);
    }

    class TSCommand {
        runJobHistoryScraperJob = _runJobHistoryScraperJob;
        launchTonkaSourceMenu = _launchTonkaSourceMenu;
        launchSkillsGPASearch = _launchSkillsGPASearch;
        launchInMailBlaster = _launchInMailBlaster;
        launchConnectionRequestBlaster = _launchConnectionRequestBlaster;
        runDailyJobSeekerReport = _runDailyJobSeekerReport;

        launchDashboard = _launchDashboard;
    }

    window.tsCommand = new TSCommand();

    window.setTSConfiguration = _setTSConfiguration;
    window.getTSConfiguration = _getTSConfiguration
})();