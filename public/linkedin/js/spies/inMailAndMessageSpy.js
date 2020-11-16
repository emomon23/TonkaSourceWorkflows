(() => {
    const _menuHtml = `<ul><li><a class='tsHelper' role='createContact' href='#'>Create Contact</a></li><li><a class='tsHelper' role='schedule' href='#'>Schedule call</a></li><li><a class='tsHelper' role='hide' href='#'>Hide<a></li></ul>`;
    let _div = null;
    let _currentPage = '';

    const _appendDiv = (target) => {
        const targetClass = $(target).attr('class') || ''

        if (targetClass.indexOf('tsHelper') === -1){
            $(target).append(_div);

            $('.tsHelper').click((e) => {
                const role = $(e.target).attr('role');
                if (role === 'createContact'){
                    inMailAndMessageSpyCreateContactClick();
                } else if (role === 'schedule'){
                    inMailAndMessageSpySchedulePhoneCallClick();
                } else {
                    inMailAndMessageSpyHideMenu();
                }

            });
        }
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
        return numbers && numbers.length === 1 ? numbers[0] : null;
}


    const _highlightedTextContainsPhoneNumber = (highlightedText) => {
        return _getPhoneNumber(highlightedText) ? true : false;
    }

    const _copyToClipboard = async (highlightedText) => {
        const phoneNumber = _getPhoneNumber(highlightedText);
        const fullNameSelector = $('#mailbox-content h3 a');
        const fullName = $(fullNameSelector).text();
        const textToCopy = `${fullName} ${phoneNumber}`;
        await tsUICommon.copyToClipboard(textToCopy);
    }

    const _processMouseUp = async (e) => {
        const highlightedText = _getHighlightedText();
        if (_highlightedTextContainsPhoneNumber(highlightedText)){
            _appendDiv(e.target);
        }
    }

    inMailAndMessageSpyCreateContactClick = async () => {
        const text = _getHighlightedText();

        await _copyToClipboard(text);
        window.open('https://contacts.google.com/?hl=en&tab=mC');
        $(_div).remove();
    }

    inMailAndMessageSpySchedulePhoneCallClick = async () => {
        const text = _getHighlightedText();

        await _copyToClipboard(text);
        window.open('https://calendar.google.com/calendar/u/0/r?tab=mc')
        $(_div).remove();
    }

    inMailAndMessageSpyHideMenu = () => {
        $(_div).remove();
        return false;
    }

     $(document).ready(() => {
        _currentPage = linkedInCommon.whatPageAmIOn();
        _div = document.createElement('div');
        $(_div).attr('class', 'ts-menu-div');
        _div.innerHTML = _menuHtml;

        if (_currentPage === linkedInConstants.pages.RECRUITER_INMAIL
            || _currentPage === linkedInConstants.pages.PUBLIC_PROFILE) {

                document.onmouseup = _processMouseUp;
        }
     });
})();