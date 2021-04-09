(function () {
    let _grid = null;
    const _jobsFilter = {
        includeHidden: false,
        includeRecruiters: false,
        companies: null
    }

    const _toggleCompany = (e) => {
        const btn = e.target;
        const linkedInCompanyId = $(btn).attr('linkedInCompanyId');

        jobsController.toggleProspectStatus(linkedInCompanyId);
        _renderGrid(true);
    }

    const _onCompanyIdCellLoad = (d, dataCell) => {
        $(dataCell).append(d.linkedInCompanyLink);

        if (!isNaN(d.linkedInCompanyId)){
            const toggleButton = tsUICommon.addButton(dataCell, `toggle${d.key}`, 'T', 20, 20, _toggleCompany);
            $(toggleButton).attr('linkedInCompanyId', d.linkedInCompanyId);
        }
    }

    const _onTitleCellLoad = (d, dataCell) => {
        const careers = d.company.split(' ').join('+');
        const href = `http://www.google.com/search?q=${careers} careers`;
        const link = document.createElement('a');
        $(link).attr('href', href)
                .attr('target', '_blank')
                .text(d.title);

        $(dataCell).append(link);
    }

    const _onCompanyLoad = (d, cell) => {

        if (d.isProspect){
            const link = document.createElement('a');
            $(link).text(d.company)
                    .attr('href', '#')
                    .attr('companyId', d.linkedInCompanyId)
                    .attr('style', 'color:green; font-weight:bold')
                    .bind('click', (e) => {
                        // eslint-disable-next-line no-alert
                        alert($(e.target).attr('companyId'));
                    })

            $(cell).append(link);
        }
        else {
            $(cell).text(d.company);
        }
    }

    const _config = {
        keyProperty: 'key',
        headers: [
        { name: "Company", property: 'company', onLoad: _onCompanyLoad, headerStyle: "min-width: 250px" },
        { name: "LI Company", property: "linkedInCompanyLink", sortProp: "linkedInCompanyId", onLoad:_onCompanyIdCellLoad },
        { name: "Title", property: "title", onLoad: _onTitleCellLoad },
        { name: "Location", property: "location" },
        { name: "Age", property: "age", sort:'desc' },
        { name: "Last Verified", property: "lastVerifiedAge" },
    ]};

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
        $(searchButton).click(() => { _renderGrid(true)});

        const actionsButtonBar = _createButtonBarElement();

        $(searchContainer)
            .append('<span style="font-weight: bold"> Company: </span')
            .append(companyNameSearch)
            .append('<span style="font-weight: bold"> Size: </span')
            .append(sizeSearchSelect)
            .append(searchButton)
            .append(actionsButtonBar);

        // Create the results container
        const resultsContainer = $(document.createElement('div'))
            .attr('id', 'jobSearchResultsContainer')
            .attr('class', 'job-search-results');

        $(container).append(searchContainer);
        $(container).append(resultsContainer);

        $('#tsContent').append(container).show();
    }

    const _renderGrid = async (forceRefresh) => {
        $('#jobSearchResultsContainer').html("");
        _jobsFilter.companies = $("#tsCompanyNameSearch").val();

        // Defaulting the sort to name
        const sortHeader = _config.headers.find(h => h.sort);
        const sortBy = sortHeader ? sortHeader.sortProp || sortHeader.property : 'age';
        const desc = sortHeader && sortHeader.sort === "desc";

        let matchingJobs = await jobsController.search(_jobsFilter, forceRefresh);
        // Sort results
        tsArray.sortByObjectProperty(matchingJobs, sortBy, desc);

        const resultsContainer = $('div[class*="job-search-results"');

        // Massage the data for display
        matchingJobs = matchingJobs.map((j) => {
            // First set links to raw text, as some companies are not keyed properly to an existing LinkedIN company
            // Won't display ID if it's the same text as company name
            let linkedInCompanyLink = j.company;

            // If the ID is a number, we can create a linked to the LinkedIN company page.
            if (!isNaN(j.linkedInCompanyId)) {
                linkedInCompanyLink = $(document.createElement('a'))
                    .attr('target', '_blank')
                    .attr('href', `https://www.linkedin.com/recruiter/company/${j.linkedInCompanyId}`)
                    .text(j.linkedInCompanyId);
            }

            const dataUpdates = {
                linkedInCompanyLink
            };

            return { ...j, ...dataUpdates }
        });

        _grid = await tsUICommon.createDataGrid(_config, matchingJobs);

        $('#jobSearchResultsContainer').append(_grid.gridElement);
    }

    const _menuOption = () => {
        return $(document.createElement('div'))
            .attr('class', 'ts-menu-item')
            .click(_display)
            .text("Job Search");
    }

    const _getSelectedJobsFromGrid = () => {
        let selectedData = [];

        if (_grid){
            selectedData = _grid.getSelectedData();
        }

        if (selectedData.length === 0){
            // eslint-disable-next-line no-alert
            alert("No jobs selected");
        }

        return selectedData;
    }

    const _createButtonBarElement = () => {
        const buttonBar = document.createElement('span');

        // (containerId, buttonId, buttonText, height, width, clickFunction)
        tsUICommon.addButton(buttonBar, 'hideJobsBtn', 'H', 20, 20, _hideJobsActionClick);
        tsUICommon.addButton(buttonBar, 'flagCompaniesBtn', 'F', 20, 20, _flagJobsActionClick);
        tsUICommon.addButton(buttonBar, 'deleteJobsBtn', 'D', 20, 20, _deleteJobsActionClick);
        tsUICommon.addButton(buttonBar, 'assignCompanyNamesBtn', 'A', 20, 20, _associateCompanyNamesActionClick);

        return buttonBar;
    }

    const _hideJobsActionClick = async () => {
        const jobsSelected = _getSelectedJobsFromGrid();

        if (jobsSelected.length){
            await jobsController.hideJobs(jobsSelected);
            _renderGrid();
        }
    }

    const _flagJobsActionClick = async () => {
        const jobsSelected = _getSelectedJobsFromGrid();

        if (jobsSelected.length){
            await jobsController.flagCompaniesAsRecruiters(jobsSelected);
            _renderGrid();
        }
    }

    const _companyIdColumnLoad = (job) => {
        return 'Mike Emo';
    }

    const _deleteJobsActionClick = async () => {
        const jobsSelected = _getSelectedJobsFromGrid();

        if (jobsSelected.length){
            await jobsController.deleteJobs(jobsSelected);
            _renderGrid();
        }
    }

    const _associateCompanyNamesActionClick = async () => {
        const jobsSelected = _getSelectedJobsFromGrid();

        if (jobsSelected.length){
            // eslint-disable-next-line no-alert
            const companyId = prompt("Enter a NUMERIC company Id");

            if (companyId && !isNaN(companyId)){
                await jobsController.associateJobsToLinkedInCompany(jobsSelected, companyId);
                _renderGrid();
            }
        }
    }

    class JobSearchMenu {
        menuOption = _menuOption;
    }

    window.jobSearchMenu = new JobSearchMenu();
})();


