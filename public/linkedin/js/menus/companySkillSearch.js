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
        const skillSearchButton = $(document.createElement('button'))
            .attr('id', 'skillSearchButton')
            .attr('class', 'ts-button-li')
            .text('Search');

        // Set Search Action
        $(skillSearchButton).click(_getResults);

        $(skillSearchContainer).append('<span>Skill(s)<span>').append(skillSearchInput).append(skillSearchButton);

        // Create the results container
        const resultsContainer = $(document.createElement('div'))
            .attr('id', 'companySkillSearchResultsContainer')
            .attr('class', 'company-skill-search-results');

        $(container).append(skillSearchContainer);
        $(container).append(resultsContainer);

        $('#tsContent').append(container).show();
    }

    const _getResults = async () => {
        $('#companySkillSearchResultsContainer').html("");
        const skillSearch = $("#tsSkillSearch").val();

        let matchingSkillCompanies = await skillCompaniesController.search(skillSearch);

        const resultsContainer = $('div[class*="company-skill-search-results"');

        const headers = [
            { name: "ID", property: "companyId" },
            { name: "Company", property: "name" },
            { name: "Industry", property: "industry" },
            { name: "Size", property: "size" },
            { name: "Website", property: "website" },
            { name: "Skills", property: "skills" }
        ];

        // Massage the data for display

        matchingSkillCompanies = matchingSkillCompanies.map((sc) => {
            const nameLink = $(document.createElement('a'))
                .attr('target', '_blank')
                .attr('href', `https://www.linkedin.com/recruiter/company/${sc.companyId}`)
                .text(sc.name);

            const idLink = $(document.createElement('a'))
                .attr('target', '_blank')
                .attr('href', `https://www.linkedin.com/recruiter/company/${sc.companyId}`)
                .text(sc.companyId);

            const dataUpdates = {
                companyId: idLink,
                name: nameLink
            };

            return { ...sc, ...dataUpdates }
        });

        const grid = tsUICommon.createDataGrid(headers, matchingSkillCompanies);

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


