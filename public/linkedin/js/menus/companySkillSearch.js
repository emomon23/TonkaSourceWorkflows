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

        $(skillSearchContainer).append('<span>Skill(s): <span>').append(skillSearchInput).append(skillSearchButton);

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
            { name: "ID", property: "companyId", headerStyle: "max-width: 50px" },
            { name: "Company", property: "name", headerStyle: "min-width: 250px" },
            { name: "Industry", property: "industry", headerStyle: "min-width: 220px" },
            { name: "Size", property: "size", headerStyle:"min-width: 75px"},
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


