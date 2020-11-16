(() => {
    let _currentPage = '';

    const _getHighlightedText = () => {
        const highlight = document.getSelection ? document.getSelection().toString() : document.selection.createRange().toString();
        return highlight;
    }

    const _highlightedTextContainsPhoneNumber = (highlightedText) => {

    }

    const _scrapeContactNameAndNumber = (highlightedText) => {
        let fullNameSelector = $('#mailbox-content h3 a');
    }

    const _processMouseUp = async () => {
        const highlightedText = _getHighlightedText();
        if (_highlightedTextContainsPhoneNumber(highlightedText)){
            // eslint-disable-next-line no-alert
            if (confirm('Save phone number to your contacts?')) {
                const data = _scrapeContactNameAndNumber(highlightedText);
                // persist phone number
            }
        }
    }

     $(document).ready(() => {
        _currentPage = linkedInCommon.whatPageAmIOn();

        if (_currentPage === linkedInConstants.pages.RECRUITER_INMAIL
            || _currentPage === linkedInConstants.pages.PUBLIC_PROFILE) {

                document.onmouseup = _processMouseUp;
        }
     });
})();