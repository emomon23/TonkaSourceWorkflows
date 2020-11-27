(() => {
    let _phoneNumberHighlightCallback = null
    let _onTextCopied = null;

    let listeningForCopy = false;

    const _getHighlightedText = () => {
        let text = null;
        if (typeof window.getSelection !== "undefined") {
            text = window.getSelection().toString();
        } else if (typeof document.selection !== "undefined") {
            text = document.selection.createRange().text;
        }

        return text;
    }

    const _getPhoneNumber = (highlightedText) => {
        // eslint-disable-next-line
        const _phoneNumberReg = /(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
        const matchAll = [...highlightedText.matchAll(_phoneNumberReg)];
        const temp = matchAll.length === 1 ? matchAll[0] : null;

        const numbers = temp ? temp.filter(n => n ? true : false).map(n => n.trim()) : null;
        return numbers && numbers.length === 1 ? numbers[0] : '';
    }

    const _promptForCopyToTsClipboard = async (e, highlightedText) => {
        if (highlightedText && highlightedText.length > 0 && highlightedText.split(' ').length > 3){
            // eslint-disable-next-line no-alert
            const clipboardNameOrNumber = window.prompt("Save to TS Clipboard?  Clipboard Name?");

            if (clipboardNameOrNumber && clipboardNameOrNumber.length > 0){
                if (_onTextCopied){
                    _onTextCopied(e, {id:clipboardNameOrNumber, text:highlightedText})
                }
                else {
                    await window.tsClipboardRepository.save({id: clipboardNameOrNumber, text:highlightedText});
                }
            }
        }
    }

    const _listenForCopy = () => {
        if (!listeningForCopy) {
            $(document).bind('mouseup', (e) => {
                const highlightedText = _getHighlightedText();
                if (!highlightedText){
                    return;
                }

                const phoneNumber = _getPhoneNumber(highlightedText);

                if (phoneNumber && phoneNumber.length){
                    if (_phoneNumberHighlightCallback){
                        _phoneNumberHighlightCallback(e, phoneNumber)
                    }
                }
            });

            $(document).bind('copy', (e) => {
                const highlightedText = _getHighlightedText();
               _promptForCopyToTsClipboard(e, highlightedText);
            });


            listeningForCopy = true;
        }
    }

    const _enable = (onCopyToTSClipboard = null) => {
        _listenForCopy();
        _onTextCopied = onCopyToTSClipboard;
        return this;
    }

    const _onPhoneNumberHighlight = (callback) => {
        _listenForCopy();
        _phoneNumberHighlightCallback = callback;
        return this;
    }
    class TSClipboard {
        enable = _enable;
        onPhoneNumberHighlight = _onPhoneNumberHighlight;
    }

    window.tsClipboard = new TSClipboard();
})();
