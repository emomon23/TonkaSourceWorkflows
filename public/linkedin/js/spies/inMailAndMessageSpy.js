(() => {
    const _createContactMenu = `<ul><li><a class='tsHelper' role='createContact' href='#'>Create Contact</a></li><li><a class='tsHelper' role='schedule' href='#'>Schedule call</a></li><li><a class='tsHelper' role='hide' href='#'>Hide<a></li></ul>`;
    const _scheduleMeetingMenu = `<ul><li><a class='tsHelper' role='schedule' href='#'>Schedule item</a></li><li><a class='tsHelper' role='recordCorrespondence' href='#'>Record Correspondence</a></li><li><a class='tsHelper' role='hide' href='#'>Hide<a></li></ul>`;

    let _createContactDiv = null;
    let _scheduleItemDiv = null;
    let _activeMenu = null;
    let _currentPage = '';
    let _lastHighlightedText = '';

    const _appendMenuDivToTarget = (target, menuDiv) => {
        const targetClass = $(target).attr('class') || ''

        if (targetClass.indexOf('tsHelper') === -1){
            _lastHighlightedText = _getHighlightedText();
            $(target).append(menuDiv);
            _activeMenu = menuDiv;

            $('.tsHelper').click(async (e) => {
                e.preventDefault();
                const role = $(e.target).attr('role');
                if (role === 'createContact'){
                    await inMailAndMessageSpyCreateContactClick();
                } else if (role === 'schedule'){
                    await inMailAndMessageSpySchedulePhoneCallClick();
                } else if (role === 'recordCorrespondence'){
                    await inMailAndMessageSpyRecordCorrespondence()
                }
                else {
                    inMailAndMessageSpyHideMenu();
                }
            });
        }
    }

    const _checkIfPublicMessagingIsPresent = () => {
        return $('button[class*="msg-overlay-bubble-header"] span:contains("Messaging")').length > 0;
    }

    const _getHighlightedText = () => {
        const highlight = document.getSelection ? document.getSelection().toString() : document.selection.createRange().toString();
        return highlight;
    }

    const _getPhoneNumber = (input) => {
        // eslint-disable-next-line
        const _phoneNumberReg = /(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
        const matchAll = [...input.matchAll(_phoneNumberReg)];
        const temp = matchAll.length === 1 ? matchAll[0] : null;

        const numbers = temp ? temp.filter(n => n ? true : false).map(n => n.trim()) : null;
        return numbers && numbers.length === 1 ? numbers[0] : '';
}


    const _highlightedTextContainsPhoneNumber = (highlightedText) => {
        return _getPhoneNumber(highlightedText) ? true : false;
    }

    const _highlightedTextContainsContactName = (highlightedText) => {
        return highlightedText && highlightedText.split && highlightedText.split(' ').length === 2;
    }

    const _getFullName = () => {
        let result = null;
        const containsPhoneNumber = _highlightedTextContainsPhoneNumber(_lastHighlightedText);
        if ((!containsPhoneNumber) && _lastHighlightedText && _lastHighlightedText.split && _lastHighlightedText.split(' ').length === 2){
            return _lastHighlightedText;
        }

        let fullName = '';
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.RECRUITER_INMAIL){
            const fullNameSelector = $('#mailbox-content h3 a');
            fullName = $(fullNameSelector).text();
        } else {
            const p = document.activeElement;
            const header = tsUICommon.findPreviousElement(p, 'h4');
            if (header){
                fullName = $(header).text();
                fullName = fullName.split('\n').join('').split('3 people in this conversation').join('');
                fullName = tsString.stripExcessSpacesFromString(fullName).trim();
            }
        }

        return fullName.toLowerCase() === 'new message' || fullName.split(' ').length > 2 ? '' : fullName;
    }

    const _copyToClipboard = async (highlightedText) => {
        const phoneNumber = _getPhoneNumber(highlightedText);
        const fullName = _getFullName();
        const textToCopy = `${fullName} ${phoneNumber}`;
        await tsUICommon.copyToClipboard(textToCopy);

        return fullName;
    }

    const _processMouseUp = async (e) => {
        const highlightedText = _getHighlightedText();
        if (_highlightedTextContainsPhoneNumber(highlightedText)){
            _appendMenuDivToTarget(e.target, _createContactDiv);
        }
        else if (_highlightedTextContainsContactName(highlightedText)){
            _appendMenuDivToTarget(e.target, _scheduleItemDiv);
        }
    }

    inMailAndMessageSpyCreateContactClick = async () => {
        await _copyToClipboard(_lastHighlightedText);
        $(_activeMenu).remove();
        _activeMenu = null;
        window.open('https://contacts.google.com/?hl=en&tab=mC');
    }

    inMailAndMessageSpySchedulePhoneCallClick = async () => {
        const contactName = await _copyToClipboard(_lastHighlightedText);
        $(_activeMenu).remove();
        _activeMenu = null;
        window.open('https://calendar.google.com/calendar/u/0/r?tab=mc');

        if (contactName){
            await connectionLifeCycleLogic.recordCallScheduled(contactName);
        }
    }

    inMailAndMessageSpyRecordCorrespondence = async () => {
        if (_lastHighlightedText) {
            await connectionLifeCycleLogic.recordCorrespondence(_lastHighlightedText);
        }

        $(_activeMenu).remove();
    }

    inMailAndMessageSpyHideMenu = () => {
        $(_activeMenu).remove();
        _activeMenu = null;
    }

    const _initializeMenuDivs = () => {
        _createContactDiv = document.createElement('div');
        $(_createContactDiv).attr('class', 'ts-menu-div');
        _createContactDiv.innerHTML = _createContactMenu;

        _scheduleItemDiv = document.createElement('div');
        $(_scheduleItemDiv).attr('class', 'ts-menu-div');
        _scheduleItemDiv.innerHTML = _scheduleMeetingMenu;
    }

     $(document).ready(() => {
        _currentPage = linkedInCommon.whatPageAmIOn();

        const publicMessagingIsPresent = _checkIfPublicMessagingIsPresent();

        if (_currentPage === linkedInConstants.pages.RECRUITER_INMAIL || publicMessagingIsPresent) {
            document.onmouseup = _processMouseUp;

            _initializeMenuDivs();
        }
     });
})();