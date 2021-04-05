(function () {
    const _display = () => {
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

        const companyNameSearch = $(document.createElement('input'))
            .attr('id', 'tsCompanyNameSearch')
            .attr('name', 'companyNameSearch');

        const sizeOptions = [
            {
                value: "",
                text: "--Choose--"
            },
            {
                value: "1",
                text: "1"
            },
            {
                value: "2-10",
                text: "2-10"
            },
            {
                value: "11-50",
                text: "11-50"
            },
            {
                value: "51-200",
                text: "51-200"
            },
            {
                value: "201-500",
                text: "201-500"
            },
            {
                value: "501-1000",
                text: "501-1000"
            },
            {
                value: "1001-5000",
                text: "1001-5000"
            },
            {
                value: "5001-10000",
                text: "5001-10000"
            },
            {
                value: "10000+",
                text: "10000+"
            }
        ];

        const sizeSearchSelect = $(document.createElement('select'))
            .attr('id', 'tsSizeSearch')
            .attr('name', 'sizeSearch')
            .attr('style', 'width: auto');

        sizeOptions.forEach((size) => {
            const sizeOption = $(document.createElement('option'))
                .attr('value', size.value)
                .text(size.text);
            $(sizeSearchSelect).append(sizeOption)
        })

        const skillSearchButton = $(document.createElement('button'))
            .attr('id', 'skillSearchButton')
            .attr('class', 'ts-button-li')
            .attr('style', 'margin-left: 5px;')
            .text('Search');

        // Set Search Action
        $(skillSearchButton).click(_getResults);

        $(skillSearchContainer)
            .append('<span style="font-weight: bold">Skill(s): <span>')
            .append(skillSearchInput)
            .append('<span style="font-weight: bold"> Company: </span')
            .append(companyNameSearch)
            .append('<span style="font-weight: bold"> Size: </span')
            .append(sizeSearchSelect)
            .append(skillSearchButton);

        // Create the results container
        const resultsContainer = $(document.createElement('div'))
            .attr('id', 'companySkillSearchResultsContainer')
            .attr('class', 'company-skill-search-results');

        $(container).append(skillSearchContainer);
        $(container).append(resultsContainer);

        $('#tsContent').append(container).show();
    }

    const _displayPersonnelDetails = (contacts) => {
        if (!contacts || contacts.length === 0) {
            return "";
        }

        const container = $(document.createElement('div'));
        for (let i = 0; i < contacts.length; i++) {
            const c = contacts[i];

            const linkedToProfile = $(document.createElement('a'))
                .attr('target', '_blank')
                .attr('href', 'https://www.linkedin.com' + c.linkedInRecruiterUrl)
                .text(c.firstName + ' ' + c.lastName);
            const recruiterProfileLink = $(document.createElement('div')).append(linkedToProfile);

            const headline = $(document.createElement('div')).text(c.headline);

            $(container)
                .append(recruiterProfileLink)
                .append(headline);

            if (c.phone) {
                $(container).append($(document.createElement('div')).text(c.phone));
            }
            if (c.email) {
                $(container).append($(document.createElement('div')).text(c.email));
            }

            $(container).append('<br/>');
        }

        return container;
    }

    const _displayCompanyPersonnel = async (personnel) => {
        $('#companySkillSearchResultsContainer').html("");

        const headers = [
            { name: "CEO", property: "ceo"},
            { name: "C-Level", property: "cLevel"},
            { name: "HR", property: "hr"},
            { name: "DEV Mgrs", property: "devManagers"},
            { name: "QA Mgrs", property: "qaManagers"},
            { name: "DEV", property: "dev"}
        ];

        const data = [{
            ceo: _displayPersonnelDetails(personnel.ceo),
            cLevel: _displayPersonnelDetails(personnel.cLevel),
            hr: _displayPersonnelDetails(personnel.hr),
            devManagers: _displayPersonnelDetails(personnel.devManagers),
            qaManagers: _displayPersonnelDetails(personnel.qaManagers),
            dev: _displayPersonnelDetails(personnel.dev)
        }];

        const grid = await tsUICommon.createDataGrid(headers, data);

        $('#companySkillSearchResultsContainer').append(grid);
    }

    const _displayCompanyPersonnelSummary = async (companySummaryDoc) => {
        const personnel = await candidateController.findBizDevelopmentContacts(companySummaryDoc.name);

        console.log(personnel);
        const personnelSummaryEl = $(document.createElement('div'))
            .text(`CEO(${personnel.ceo.length}) C(${personnel.cLevel.length}) HR(${personnel.hr.length}) DEV(${personnel.devManagers.length})`)
            .click(async () => {
                await _displayCompanyPersonnel(personnel);
            });

        return personnelSummaryEl;
    }

    const _getResults = async () => {
        $('#companySkillSearchResultsContainer').html("");
        const skillSearch = $("#tsSkillSearch").val();
        const sizeSearch = $("#tsSizeSearch").val();
        const companyNameSearch = $("#tsCompanyNameSearch").val();

        // Defaulting the sort to name
        const sortBy = 'name';

        let matchingSkillCompanies = await skillCompaniesController.search(skillSearch, sizeSearch, companyNameSearch);
        // Sort results
        tsArray.sortByObjectProperty(matchingSkillCompanies, sortBy);

        const resultsContainer = $('div[class*="company-skill-search-results"');

        const headers = [
            { name: "ID", property: "companyIdLink", headerStyle: "max-width: 50px" },
            { name: "Company", property: "nameLink", headerStyle: "min-width: 250px" },
            { name: "Industry", property: "industry", headerStyle: "min-width: 220px" },
            { name: "Size", property: "size", headerStyle: "min-width: 75px"},
            { name: "Personnel", property: "personnel", headerStyle: "min-width: 250px", onLoadAsync: _displayCompanyPersonnelSummary },
            { name: "Website", property: "website" },
            { name: "Jobs (MN)", linkName: "MN", property: "mnJobsUrl" },
            { name: "Jobs (US)", linkName: "US", property: "usaJobsUrl" },
            { name: "Skills", property: "skills" }
        ];

        // Massage the data for display
        matchingSkillCompanies = matchingSkillCompanies.map((sc) => {
            // First set links to raw text, as some companies are not keyed properly to an existing LinkedIN company
            // Won't display ID if it's the same text as company name
            let nameLink = sc.name;
            let idLink = "";

            // If the ID is a number, we can create a linked to the LinkedIN company page.
            if (!isNaN(sc.companyId)) {
                nameLink = $(document.createElement('a'))
                    .attr('target', '_blank')
                    .attr('href', `https://www.linkedin.com/recruiter/company/${sc.companyId}`)
                    .text(sc.name);

                idLink = $(document.createElement('a'))
                    .attr('target', '_blank')
                    .attr('href', `https://www.linkedin.com/recruiter/company/${sc.companyId}`)
                    .text(sc.companyId);
            }

            const dataUpdates = {
                idLink: idLink,
                nameLink: nameLink
            };

            return { ...sc, ...dataUpdates }
        });

        const grid = await tsUICommon.createDataGrid(headers, matchingSkillCompanies);

        $('#companySkillSearchResultsContainer').append(grid);
    }

    const _menuOption = () => {
        return $(document.createElement('div'))
            .attr('class', 'ts-menu-item')
            .click(_display)
            .text("Company Skill Search");
    }

    class CompanySkillSearchMenu {
        menuOption = _menuOption;
    }

    window.companySkillSearchMenu = new CompanySkillSearchMenu();
})();


