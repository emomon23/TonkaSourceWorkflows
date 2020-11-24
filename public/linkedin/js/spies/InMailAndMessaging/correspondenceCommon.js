(() => {

    const _getHighlightedText = () => {
        const highlight = document.getSelection ? document.getSelection().toString() : document.selection.createRange().toString();
        return highlight;
    }

    const _highlightedTextContainsPhoneNumber = (highlightedText) => {
        return _getPhoneNumber(highlightedText) ? true : false;
    }

    const _highlightedTextContainsContactName = (highlightedText) => {
        return highlightedText && highlightedText.split && highlightedText.split(' ').length === 2;
    }

    const _getPhoneNumber = (input) => {
        // eslint-disable-next-line
        const _phoneNumberReg = /(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
        const matchAll = [...input.matchAll(_phoneNumberReg)];
        const temp = matchAll.length === 1 ? matchAll[0] : null;

        const numbers = temp ? temp.filter(n => n ? true : false).map(n => n.trim()) : null;
        return numbers && numbers.length === 1 ? numbers[0] : '';
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

    const _copyToClipboard = async (highlightedText) => {
        const phoneNumber = _getPhoneNumber(highlightedText);
        const fullName = _getFullName();
        const textToCopy = `${fullName} ${phoneNumber}`;
        await tsUICommon.copyToClipboard(textToCopy);

        return fullName;
    }

    _setupSpy = async (messageWindow, messageWindowScraperCallback) => {
        if (!(messageWindow && messageWindowScraperCallback)){
            return;
        }

        const messageDialog = await messageWindowScraperCallback(messageWindow);
        if (!(messageDialog && messageDialog.candidate && messageDialog.header)){
            return;
        }

        try {
            const {candidate, header, sendButton, textArea } = messageDialog;

            const key = `${candidate.firstName}-${candidate.lastName}`;

            const tsLogoKey = `${key}-toggle`;
            if (!tsToolButton.containsButton(header, tsLogoKey)) {
                tsToolButton.appendButton(header, "tiny", "tonkaSourceLogo", tsLogoKey, 'record-message-switch');
                const alisonButton = tsToolButton.appendButton(header, "tiny", "hotAlison1", `${key}-popup`, 'message-action-menu-container', false);
                const menu = tsContactMenu.buildContactMenu(candidate);

                tsPopup.bindToClick(alisonButton, menu);
            }
        } catch (e) {
            console.log(e);
        }
    }

    class CorrespondenceCommon {
        setupSpy = _setupSpy;
    }

    window.correspondenceCommon = new CorrespondenceCommon();
})();