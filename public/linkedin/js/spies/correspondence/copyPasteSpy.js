(() => {
    const SHIFT = 16;
    const CONTROL = 17;
    const OPTION = 18;
    const COMMAND = 91;
    const SPACE = 32;
    const A_KEY = 65
    const C_KEY = 67;
    const V_KEY = 86;
    const X_KEY = 88;
    const DELETE = 8;
    const BACK_SPACE = 46;
    const ZERO = 48;
    const ONE = 49;

    let _shiftIsDown = null;
    let _optionIsDown = null;
    let _commandIsDown = null;
    let _ctrlIsDown = null;
    let _a_key_isDown = null;
    let _c_key_isDown = null;
    let _v_key_isDown = null;
    let _x_key_isDown = null;
    let _numberCurrentlyDown = null;

    const _getHighlightedText = () => {
        let text = "";
        if (typeof window.getSelection !== "undefined") {
            text = window.getSelection().toString();
        } else if (typeof document.selection !== "undefined") {
            text = document.selection.createRange().text;
        }

        if (text && text.length > 0){
            _highlightTextEvent(text);
        }
    }

    const _getPhoneNumber = (input) => {
        // eslint-disable-next-line
        const _phoneNumberReg = /(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
        const matchAll = [...input.matchAll(_phoneNumberReg)];
        const temp = matchAll.length === 1 ? matchAll[0] : null;

        const numbers = temp ? temp.filter(n => n ? true : false).map(n => n.trim()) : null;
        return numbers && numbers.length === 1 ? numbers[0] : '';
    }

    const _isPhoneNumber = (text) => {
        const nbr = _getPhoneNumber(text);
        return nbr && nbr.length > 0;
    }

    const _keyDown = (e) => {
        const code = e.keyCode;
        switch (code) {
            case SHIFT :
                _shiftIsDown = true;
                break;
            case A_KEY :
                _a_key_isDown = true;
                break;
            case OPTION :
                _optionIsDown = true;
                break;
            case CONTROL :
                _ctrlIsDown = true;
                break;
            case COMMAND :
                _commandIsDown = true;
                break;
            case X_KEY :
                _x_key_isDown = true;
                break;
            case C_KEY :
                _c_key_isDown = true;
                break;
            case V_KEY :
                _v_key_isDown = true;
                break;
        }

        if (code >= 48 && code <= 57){
            _numberCurrentlyDown = true;
        }

        _evaluateKeyPressCombinations();
    }

    const _keyUp = (e) => {
        const code = e.keyCode;
        switch (code) {
            case SHIFT :
                _shiftIsDown = false;
                break;
            case A_KEY :
                _a_key_isDown = false;
                break;
            case OPTION :
                _optionIsDown = false;
                break;
            case CONTROL :
                _ctrlIsDown = false;
                break;
            case COMMAND :
                _commandIsDown = false;
                break;
            case X_KEY :
                _x_key_isDown = false;
                break;
            case C_KEY :
                _c_key_isDown = false;
                break;
            case V_KEY :
                _v_key_isDown = false;
                break;
        }

        if (code >= 48 && code <= 57){
            _numberCurrentlyDown = false;
        }
    }

    const _evaluateKeyPressCombinations = () => {
        if (_commandIsDown){
            if (_c_key_isDown || _x_key_isDown){
                _ctrlCopyEvent();
            }

            if (_commandIsDown && _v_key_isDown){
                _ctrlPasteEvent();
            }

            if (_a_key_isDown){
                _getHighlightedText();
            }
        }

    }

    const _ctrlCopyEvent = () => {
        console.log("copy event fired");
    }

    const _ctrlPasteEvent = () => {
        console.log("paste event fired");
    }

    const _highlightTextEvent = (text) => {
        console.log('highlight event fired');
        if (_isPhoneNumber(text)){
            _phoneNumberHighlightedEvent(_getPhoneNumber(text));
        }
    }

    const _phoneNumberHighlightedEvent = (phoneNumber) => {
        console.log(`phoneNumber Highlighted: ${phoneNumber}`);
    }

    const _delayReady = async () => {
        await tsCommon.sleep(1000);

        $(document)
            .bind('keydown', _keyDown)
            .bind('keyup', _keyUp);

        $(document).bind('mouseup', _getHighlightedText);
    }

    $(document).ready(() => {
       _delayReady();
    })
})();