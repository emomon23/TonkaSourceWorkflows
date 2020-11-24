(() => {
        // When the user clicks on div, open the popup
    let _activePopup = null;
    const _popups = [];

    const _closePopup = (popup = null) => {
        popup = popup ? popup : _activePopup;

        if (popup) {
            $(popup).hide();
            _activePopup = null;
    }
    }

    const _closeAllPopups = () => {
        for (let i = 0; i < _popups.length; i++){
            try {
                _closePopup(_popups[i]);
            }
            catch {
                console.log('close pop up error')
            }
        }
    }

    const _showPopup = (popup) => {
        if (!popup){
        return;
        }
        _closePopup();

        $(popup).show();

        const content = $(popup).find('.popupContent');
        $(content).hasClass('show') ? $(content).removeClass('show') : $(content).addClass('show');
        _activePopup = popup;
    }

    const _createPopupContainer = (container, popupContent) => {
        const popup = $(document.createElement('div')).attr('class', 'popup');
        const popupContentContainer = $(document.createElement('div')).attr('class', 'popupContent');

        const closeDiv = $(document.createElement('div'))
            .attr('style', 'text-align: right; margin-right: 15px');

        const closeButton = $(document.createElement('span'))
            .attr('class', 'ts-auto-popup-close-button')
            .attr('style', 'color:white')
            .text('x');

        $(closeDiv).append(closeButton);
        $(popup).append(popupContentContainer);

        if (typeof popupContent === "string"){
            $(popupContentContainer).html(popupContent);
        }
        else {
            $(popupContentContainer).append(popupContent);
        }

        $(popupContentContainer).prepend(closeDiv)

        container.oncontextmenu = () => {return false;}
        $(container).append(popup);

        $('.ts-auto-popup-close-button').click((e) => {
            if (_activePopup){
                _closePopup();
            }

            if (e && $(e).preventDefault) {
                $(e).preventDefault();
            }

            return false;
        });

        _popups.push(popup);
        return container;
    }

    const _findPopupInstance = (target) => {
        let found = $(target).find('.popup');
        if ((!(found && found.length)) && $(target).parent()){
            found = $($(target).parent()).find('.popup');
        }

        return found && found.length ? found[0] : null;
    }

    const _bindToRightClick = (container, popupContent) => {
        const popupContainer = _createPopupContainer(container, popupContent);
        $(popupContainer).mousedown((e) => {
            if(e.button === 2 ) {
                const popupInstance = _findPopupInstance(e.target);
                _showPopup(popupInstance);
                $(e).preventDefault;
                return false;
            }

            return true;
        });
    }

    const _bindToClick = (container, popupContent) => {
        const popupContainer = _createPopupContainer(container, popupContent);
        $(popupContainer).mousedown((e) => {
            if(e.button === 0) {
                const popupInstance = _findPopupInstance(e.target);
                _showPopup(popupInstance);
                $(e).preventDefault;
                return false;
            }

            return true;
        });
    }

    class TSPopup {
        bindToClick = _bindToClick;
        bindToRightClick = _bindToRightClick;
        closeAllPopups = _closeAllPopups;
        closePopup = () => { _closePopup() };
    }

    window.tsPopup = new TSPopup();
})();