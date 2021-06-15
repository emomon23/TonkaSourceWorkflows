(() => {
    let _filters = null;
    let _allCandidates = null;

    const _renderASingleCandidate = (container, c) => {
        const candidateContainer = $(document.createElement('div'))

        const url = c.linkedInRecruiterUrl || '';
        const name = `${c.firstName} ${c.lastName}`;
        tsUICommon.createLink(candidateContainer, url, name, '_blank')
        $(container).append(candidateContainer);

        if (c.dateTsJobSeekerSet) {
            const date = new Date(c.dateTsJobSeekerSet);
            tsUICommon.createSpan(candidateContainer, `started looking: ${date.toLocaleDateString()}`);
        }
    }

    const _renderCandidates = (candidates) => {
        const searchContainer = $('#indexDbCandidateSearchContainer')[0];

        $(searchContainer).html('');

        candidates.forEach((c) => {
            _renderASingleCandidate(searchContainer, c);
        });
    }

    const _displayFilteredIndexDbCandidates = async () => {
        const isTsJobSeeker = $(_filters.isTsJobSeeker.inputElement).is(':checked');

        if (_allCandidates === null){
            _allCandidates = await candidateRepository.getAll();
        }

        const candidates = _allCandidates.filter((c) => {
            const cIsTsJobSeeker = c.isTsJobSeeker ? true : false;
            return cIsTsJobSeeker === isTsJobSeeker;
        });

        _renderCandidates(candidates);
    }

    _filters = {
        isTsJobSeeker: { label: {text: 'Is Job Seeker'}, input: {type: 'checkbox', checked: true, style: 'margin-left: 5px' }, inputBinding: {event: 'change', callback: _displayFilteredIndexDbCandidates }},
    }

    const _showHideFilterInput = (e) => {
        const isHidden = $(e.target).attr('current-state') === 'hidden';
        const filterContainer = $('#candidateFilterElement')[0];

        if (isHidden){
            $(filterContainer).show();
        }
        else {
            $(filterContainer).hide();
        }

        const text = isHidden ? 'Hide Filter' : 'Show Filter';
        const newState = isHidden ? 'show' : 'hidden';
        $(e.target).attr('current-state', newState)
                    .text(text);

    }

    const _createCandidateFilterDivContainer = () => {
        const filtersContainer = $(document.createElement('div'))
            .attr('id', 'candidateFilterElement')
            .hide();

        for (let k in _filters) {
            const filter = _filters[k];
            const labelAndInput = tsUICommon.createInput(filtersContainer, filter.label, filter.input);
            if (filter.inputBinding){
                $(labelAndInput.input).bind(filter.inputBinding.event, filter.inputBinding.callback);
            }
            filter.inputElement = labelAndInput.input;
        }

        const showHidFilterButton = $(document.createElement('button'))
                    .text('Show Filter')
                    .attr('current-state', 'hidden')
                    .attr('style', 'margin-top: 10px')
                    .bind('click', _showHideFilterInput);

        const filterRootContainer = $(document.createElement('div'))
                    .append(filtersContainer)
                    .append(showHidFilterButton);

        return filterRootContainer;
    }

    // Hook into this menu item
    const _display = async () => {
        const {baseContainer, searchContainer } = baseMenu.createSearchContainer('indexDbCandidateSearchContainer', 'index-db-candidate-search-container');
        const userInputFilterContainer = _createCandidateFilterDivContainer();

        $(baseContainer).append(userInputFilterContainer);

        _displayFilteredIndexDbCandidates();
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