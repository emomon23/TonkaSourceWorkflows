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

    const _delayBinding = async () => {
        await tsCommon.sleep(1000);
        $('.contact-menu-item').click(async (e) => {
            tsPopup.closePopup();
        });
    }

    const _buildContactMenu = (contactIdentifier) => {
        const list = document.createElement('ul');
        _createMenuItem(list, 'Record Contact', 'record-contact', contactIdentifier);
        _createMenuItem(list, 'Scrape Contact Info', 'scrape-info', contactIdentifier);
        _createMenuItem(list, 'Schedule a Call', 'schedule-call', contactIdentifier);

        const listContainer = $(document.createElement('div'))
                                        .append(list);

        _delayBinding();

        return listContainer;
    }

    class TSContactMenu {
        buildContactMenu = _buildContactMenu
    }

    window.tsContactMenu = new TSContactMenu();
})();