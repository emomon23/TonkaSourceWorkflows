(function () {
    const F_KEY = 70;
    let fKeyDown = false;

    let _grid = null;
    const _jobsFilter = {
        includeHidden: false,
        includeRecruiters: false,
        companies: null,
        type: null,
        group: null
    }

    const _toggleCompany = async (e) => {
        const btn = e.target;
        const linkedInCompanyId = $(btn).attr('linkedInCompanyId');

        // eslint-disable-next-line no-alert
        const group = prompt("Which group do you want this company in (eg 'A', 'B')?");

        jobsController.toggleProspectStatus(linkedInCompanyId, group);

        const companyNameDiv = $(e.target).parent().parent().find('div')[0];
        if (companyNameDiv){
            const groups = await competitorRepository.getDistinctProspectGroups();
            let text = $(companyNameDiv).text();

            groups.forEach((g) => {
                text = text.replace(` - (${g.toUpperCase()})`, '');
            });

            let style = 'font-weight:bold; color:green';

            if (group && group.length){
                text += ` - (${group.toUpperCase()})`;
            }
            else {
                style = '';
            }

            $(companyNameDiv).text(text)
                    .attr('style', style);
        }

    }

    const _companyNameClick = (e) => {
        const companyName = $(e.target).attr('companyName');
        $('#tsCompanyNameSearch').val(companyName);
        _renderGrid(true);
    }

    const _onCompanyIdCellLoad = (d, dataCell) => {
        $(dataCell).append(d.linkedInCompanyLink);

        if (!isNaN(d.linkedInCompanyId)){
            const toggleButton = tsUICommon.addButton(dataCell, `toggle${d.key}`, 'T', 20, 20, _toggleCompany, 'Assign company id to a group');
            $(toggleButton).attr('linkedInCompanyId', d.linkedInCompanyId);
        }
    }

    const onTitleCellClick = async (e) => {
        const button = e.target;
        const href = $(button).attr('href');

        const jobsWindow = window.open(href);
        await tsCommon.sleep(3000);

        jobsWindow.postMessage({action: 'autoScrapeCareers'}, "*");
        $(button).attr('style', "color:orange");
    }

    const _onTitleCellLoad = (d, dataCell) => {
        const careers = d.company.split(' ').join('+');
        const href = `http://www.google.com/search?q=${careers} careers`;
        tsUICommon.createButton({container: dataCell, element: 'span', text:d.title, style: `color:blue`, attr: {href}, onclick: onTitleCellClick});

    }

    const _clearCompanyFilter = () => {
        if ($('#tsCompanyNameSearch').val().length){
            $('#tsCompanyNameSearch').val('');
            _renderGrid(true);
        }
    }

    const _onCompanyLoad = (d, cell) => {

        let text = d.company;
        if (d.group && d.group.length){
            text += ` - (${d.group})`;
        }

        if (d.isProspect){
            const link = document.createElement('a');
            $(link).text(text)
                    .attr('href', '#')
                    .attr('companyId', d.linkedInCompanyId)
                    .attr('companyName', d.company)
                    .attr('style', 'color:green; font-weight:bold')
                    .bind('click', _companyNameClick)

            $(cell).append(link);
        }
        else {
            $(cell)
                .text(d.company)
                .attr('companyName', d.company)
                .bind('dblclick', (e) => {
                    if (fKeyDown){
                        _flagJobsActionClick();
                    }
                });
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
        { name: "Last Contact", property: "lastContacted"}
    ]};

    const _getCompanyCount = (arrayOfJobs) => {
        const coIndex = {};
        const unknownCompanyId = arrayOfJobs.find(j => !j.linkedInCompanyId || isNaN(j.linkedInCompanyId))
        let result = 0;

        if (unknownCompanyId){
            arrayOfJobs.forEach((j) => {
                const cleanedCompanyName = j.company.replace(', Inc.', '').replace(', Inc', '').replace(' Inc', '').replace(', LLC', '').replace(' LLC', '').replace('-', '').toLowerCase();
                coIndex[cleanedCompanyName.split(' ')[0]] = true;
            });
        }
        else {
            arrayOfJobs.forEach((j) => {
                coIndex[j.linkedInCompanyId] = true;
            });
        }

        for(let k in coIndex){
            result += 1;
        }
        return result;
    }

    const _display = async () => { // jobSearch.js
        const containers = baseMenu.createSearchContainer('jobSearchContainer', 'job-search-container');
        const container = containers.baseContainer;
        const searchContainer = containers.searchContainer;

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
        const groupFilter = await _createGroupFilterDropdown();
        const countLabel = _createCountLabel();

        $(searchContainer)
            .append('<span id="companyLabel" style="font-weight: bold"> Company: </span>')
            .append(companyNameSearch)
            .append('<span style="font-weight: bold"> Size: </span>')
            .append(sizeSearchSelect)
            .append(searchButton)
            .append(actionsButtonBar)
            .append(groupFilter)
            .append(countLabel);

        // Create the results container
        const resultsContainer = $(document.createElement('div'))
            .attr('id', 'jobSearchResultsContainer')
            .attr('class', 'job-search-results');

        $(container).append(resultsContainer);

        await tsCommon.sleep(50);
        $('#companyLabel').click(_clearCompanyFilter);


        $(document)
            .bind('keydown', (e) => {
                if (e.keyCode === F_KEY){
                    fKeyDown = true;
                }
            })
            .bind('keyup', (e) => {
                if (e.keyCode === F_KEY){
                    fKeyDown = false;
                }
            });
    }

    const _renderGrid = async (forceRefresh) => {
        $('#jobSearchResultsContainer').html("");
        _jobsFilter.companies = $("#tsCompanyNameSearch").val().replace(', Inc.', '').replace(', Inc', '');

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
        const uniqueCompanyCount = _getCompanyCount(matchingJobs);

        $('#jobSearchResultsContainer').append(_grid.gridElement);
        $('#countLabel').text(`Unique Company Count: @${uniqueCompanyCount}.   Total Rows: ${matchingJobs.length}`);
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
        tsUICommon.addButton(buttonBar, 'hideJobsBtn', 'H', 20, 20, _hideJobsActionClick, 'hide job');
        tsUICommon.addButton(buttonBar, 'flagCompaniesBtn', 'F', 20, 20, _flagJobsActionClick, 'flag company as recruiter');
        tsUICommon.addButton(buttonBar, 'deleteJobsBtn', 'D', 20, 20, _deleteJobsActionClick, 'delete job');
        tsUICommon.addButton(buttonBar, 'assignCompanyNamesBtn', 'A', 20, 20, _associateCompanyNamesActionClick, 'Assign a numeric company id to the selected (highlighted) company rows');

        return buttonBar;
    }

    const _createCountLabel = () => {
        const span = $(document.createElement('span'))
                        .attr('style', 'margin-left:300px; font-weight:bold')
                        .attr('id', 'countLabel');

        return span;
    }

    const _onFilterGroupClick = (e) => {
        const filter = $(e.target).val();
        _jobsFilter.group = null;

        if (filter === 'ALL'){
            _jobsFilter.type = null;
        }
        else {
            _jobsFilter.type = 'prospect';
            if (filter !== 'ALL-GROUPS'){
                _jobsFilter.group = filter;
            }
        }

        _renderGrid(true);
    }

    const _createGroupFilterDropdown = async () => {
        const dropdownContainer = document.createElement('span');
        const dropdown = document.createElement('select');
        $(dropdown).attr('id', 'groupFilter')
                   .attr('name', 'groupFilter')
                   .attr('style', 'width: auto; margin-left:15px')
                   .change(_onFilterGroupClick);

        $(dropdownContainer).append(dropdown);

        let option = $(document.createElement('option'))
                    .attr('value', 'ALL')
                    .text('All Jobs');
        $(dropdown).append(option);

        option = $(document.createElement('option'))
                    .attr('value', 'ALL-GROUPS')
                    .text('All Groups');
        $(dropdown).append(option);


        const groups = await competitorRepository.getDistinctProspectGroups();
        groups.forEach((g) => {
            option = $(document.createElement('option'))
                    .attr('value', g)
                    .text(g);

            $(dropdown).append(option);
        });

        return dropdownContainer
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


