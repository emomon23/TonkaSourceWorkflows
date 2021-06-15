(() => {

    const _display = async () => {
        // eslint-disable-next-line no-alert
        alert('Not implemented yet');
    }

    const _menuOption = () => {
        return $(document.createElement('div'))
            .attr('class', 'ts-menu-item')
            .click(_display)
            .text("IndexDB Candidate Search");
    }


    class IndexDbCandidateSearch {
        menuOption = _menuOption;
    }

    window.indexDbCandidateSearchMenu = new IndexDbCandidateSearch();
})();