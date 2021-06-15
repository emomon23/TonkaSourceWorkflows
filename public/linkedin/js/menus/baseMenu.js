(() => {
    const _createSearchContainer = (containerId, containerClass) => {
        $('#tsContent').html("");

        const searchContainer = $(document.createElement('div'));

        const baseContainer = $(document.createElement('div'))
            .attr('id', containerId)
            .attr('class', containerClass);

        // Create the Skill Search elements


        $(baseContainer).append(searchContainer);
        $('#tsContent').append(baseContainer).show();

        return {
            baseContainer,
            searchContainer
        }

    }

     class BaseMenu {
        createSearchContainer = _createSearchContainer;
    }

    window.baseMenu = new BaseMenu();
})();