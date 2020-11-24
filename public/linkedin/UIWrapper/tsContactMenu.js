(() => {
    const _createMenuItem = (container, text, className, contact) => {
        const listItem = document.createElement('li');
        const link = $(document.createElement('a'))
                        .attr('href', '#')
                        .attr('class', `contact-menu-item ${className}`)
                        .text(text);

        if (contact){
            $(link).attr('memberId', contact.memberId)
                    .attr('firstName', contact.firstName)
                    .attr('lastName', contact.lastName)
                    .attr('contactHeader', contact.header)
                    .attr('imageUrl', contact.imageUrl)
        }

        $(listItem).append(link);
        $(container).append(listItem);
    }

    const _buildContactMenu = (contactIdentifier) => {
        const li = document.createElement('ol');
        _createMenuItem(li, 'Record Contact', 'record-contact', contactIdentifier);
        _createMenuItem(li, 'Scrape Contact Info', 'scrape-info', contactIdentifier);
        _createMenuItem(li, 'Schedule a Call', 'schedule-call', contactIdentifier);

        return li;
    }

    class TSContactMenu {
        buildContactMenu = _buildContactMenu
    }

    window.tsContactMenu = new TSContactMenu();
})();