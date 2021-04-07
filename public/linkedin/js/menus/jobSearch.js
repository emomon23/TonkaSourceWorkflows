(function () {
    const _display = () => {
        // Clear the content
        $('#tsContent').html("");
        const container = $(document.createElement('div'))
            .attr('id', 'jobSearchContainer')
            .attr('class', 'job-search-container');

        // Create the Search elements
        const searchContainer = $(document.createElement('div'));

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

        const searchButton = $(document.createElement('button'))
            .attr('id', 'jobSearchButton')
            .attr('class', 'ts-button-li')
            .attr('style', 'margin-left: 5px;')
            .text('Search');

        // Set Search Action
        $(searchButton).click(_getResults);

        $(searchContainer)
            .append('<span style="font-weight: bold"> Company: </span')
            .append(companyNameSearch)
            .append('<span style="font-weight: bold"> Size: </span')
            .append(sizeSearchSelect)
            .append(searchButton);

        // Create the results container
        const resultsContainer = $(document.createElement('div'))
            .attr('id', 'jobSearchResultsContainer')
            .attr('class', 'job-search-results');

        $(container).append(searchContainer);
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
        $('#jobSearchResultsContainer').html("");

        const config = {
            keyProperty: key,
            headers: [
            { name: "CEO", property: "ceo"},
            { name: "C-Level", property: "cLevel"},
            { name: "HR", property: "hr"},
            { name: "DEV Mgrs", property: "devManagers"},
            { name: "QA Mgrs", property: "qaManagers"},
            { name: "DEV", property: "dev"}
        ]};

        const data = [{
            ceo: _displayPersonnelDetails(personnel.ceo),
            cLevel: _displayPersonnelDetails(personnel.cLevel),
            hr: _displayPersonnelDetails(personnel.hr),
            devManagers: _displayPersonnelDetails(personnel.devManagers),
            qaManagers: _displayPersonnelDetails(personnel.qaManagers),
            dev: _displayPersonnelDetails(personnel.dev)
        }];

        const grid = await tsUICommon.createDataGrid(config, data);

        $('#jobSearchResultsContainer').append(grid.gridElement);
    }

    const _displayCompanyPersonnelSummary = async (jobDoc) => {
        const personnel = await candidateController.findBizDevelopmentContacts(jobDoc.company);

        const personnelSummaryEl = $(document.createElement('div'))
            .text(`CEO(${personnel.ceo.length}) C(${personnel.cLevel.length}) HR(${personnel.hr.length}) DEV(${personnel.devManagers.length})`)
            .click(async () => {
                await _displayCompanyPersonnel(personnel);
            });

        return personnelSummaryEl;
    }

    const _getResults = async () => {
        $('#jobSearchResultsContainer').html("");
        const companyNameSearch = $("#tsCompanyNameSearch").val();

        // Defaulting the sort to name
        const sortBy = 'age';
        const desc = true;

        let matchingJobs = await jobsController.search(companyNameSearch);
        // Sort results
        tsArray.sortByObjectProperty(matchingJobs, sortBy, desc);

        const resultsContainer = $('div[class*="job-search-results"');

        const config = {
            headers: [
            { name: "Company", property: "nameLink", headerStyle: "min-width: 250px" },
            { name: "Industry", property: "industry", headerStyle: "min-width: 220px" },
            { name: "Size", property: "size", headerStyle: "min-width: 75px"},
            { name: "Title", property: "title" },
            { name: "Location", property: "location" },
            { name: "Age", property: "age", sort:'desc' },
            { name: "Personnel", property: "personnel", headerStyle: "min-width: 250px", onLoadAsync: _displayCompanyPersonnelSummary },
            { name: "Last Verified", property: "lastVerifiedAge" },
        ]};

        // Massage the data for display
        matchingJobs = matchingJobs.map((j) => {
            // First set links to raw text, as some companies are not keyed properly to an existing LinkedIN company
            // Won't display ID if it's the same text as company name
            let nameLink = j.company;

            // If the ID is a number, we can create a linked to the LinkedIN company page.
            if (!isNaN(j.linkedInCompanyId)) {
                nameLink = $(document.createElement('a'))
                    .attr('target', '_blank')
                    .attr('href', `https://www.linkedin.com/recruiter/company/${j.linkedInCompanyId}`)
                    .text(j.company);
            }

            const dataUpdates = {
                nameLink: nameLink
            };

            return { ...j, ...dataUpdates }
        });

        const grid = await tsUICommon.createDataGrid(config, matchingJobs);

        $('#jobSearchResultsContainer').append(grid.gridElement);
    }

    const _menuOption = () => {
        return $(document.createElement('div'))
            .attr('class', 'ts-menu-item')
            .click(_display)
            .text("Job Search");
    }

    class JobSearchMenu {
        menuOption = _menuOption;
    }

    window.jobSearchMenu = new JobSearchMenu();
})();


