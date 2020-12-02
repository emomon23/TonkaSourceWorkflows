(() => {
    const sendButtonFingerPrints = {};
    let setupCalled = false;
    let customCandidateScraperCallback = null;
    let customPasteHandlerCallback = null;

    const _createFingerPrint = (button) => {
        const classValue = $(button).attr('class') || '';
        const type = $(button).attr('type') || '';
        const id = $(button).attr('id') || '';

        return `${id.trim()}-${classValue.trim()}-${type.trim()}`;
    }

    const _recordSendButtonFingerPrint = (button) => {
        const fingerPrint = _createFingerPrint(button);
        if ((!fingerPrint) || fingerPrint.length < 3){
            return false;
        }

        if (!sendButtonFingerPrints[fingerPrint]){
            sendButtonFingerPrints[fingerPrint] = true;
        }

        return true;
    }

    const _onPhoneNumberHighlighted = async (evt , phoneNumber) => {
        const candidate = await customCandidateScraperCallback();
        tsPopup.showPopup(candidate, 'csp', phoneNumber);
    }

    const _onMessageCopiedToTsClipboard = (evt, tsClipboardData) => {
        try {
            if (tsClipboardData.id){
                const candidate = customCandidateScraperCallback();
                tsClipboardData.text = tsTemplateProcessor.convertToTemplate(tsClipboardData.text);
                tsClipboardRepository.save(tsClipboardData);
            }
        } catch (e) {
            tsCommon.logError(e, '_onMessageCopiedToTsClipboard');
        }
    }

    const _onMessagePastedFromTsClipboard = async (evt, osClipboardText, tsClipboardRawText) => {
        try {
            const candidate = await customCandidateScraperCallback();
            const textToPaste = tsTemplateProcessor.processTemplate(tsClipboardRawText, candidate);

            if (tsClipboardRawText && tsClipboardRawText.length) {
                if (customPasteHandlerCallback){
                    customPasteHandlerCallback({event: evt, text: textToPaste});
                    return;
                }
                else {
                    const element = document.activeElement;
                    await tsUICommon.executeDelete(element, osClipboardText.length);
                    await tsCommon.sleep(200);
                    document.execCommand('insertText', true, textToPaste);
                }
            }
        } catch (e) {
            tsCommon.logError(e, '_onMessagePastedFromTsClipboard');
        }
    }

    const _setupTsClipboard = () => {
        if (!setupCalled){
            tsClipboard.enable(_onMessageCopiedToTsClipboard, _onMessagePastedFromTsClipboard);
            tsClipboard.onPhoneNumberHighlight(_onPhoneNumberHighlighted);

            setupCalled = true;
        }
    }

    const _doesTargetFingerPrintMatchASendButton = (target) => {
        const fingerPrint = _createFingerPrint(target);
        return sendButtonFingerPrints[fingerPrint] ? true : false;
    }

    const _getCandidateFromHiddenInput = (tsMsgId) => {
        const input = $(`#${tsMsgId}`)[0];
        if (!input){
            return null;
        }

        const jsonString = $(input).val();
        return JSON.parse(jsonString);
    }

    const _getMessageSent = async (element) => {
        const parent = $(element).parent();
        const tsMsgId = $(parent).attr('ts-message-id');
        const type = $(parent).attr('msg-type');
        const candidate = _getCandidateFromHiddenInput(tsMsgId);

        let textAreaElement = $(`[ts-message-text-area-id*="${tsMsgId}"]`)[0];
        let text = '';
        let subject = null;

        if (textAreaElement){
             text = textAreaElement ? $(textAreaElement).text() : '';
             text = text.length > 0 ? text : $(textAreaElement).val();

             let subjectElement = $(`input[type="text"][class*="compose-subject"]`)[0];
             subject = subjectElement ? $(subjectElement).val() : null;
        }

        if (text === '') {
            await tsCommon.sleep(1000);
            textAreaElement = $('div[class*="message-container"]');
            textAreaElement = textAreaElement.length ? textAreaElement[textAreaElement.length - 1] : null;
            text = textAreaElement ? $(textAreaElement).text() : '';

            const stupidStringsInLinkedIn = ['An error occurred. Please try again.', 'An error occurred.', 'An error occured.', 'Please try again'];
            stupidStringsInLinkedIn.forEach((s) => {
                text = text.split(s).join('');
            })
            text = text.split('\n').filter(t => t && t.trim().length > 0).join('');
        }

        const toggleButton = $(`img[class*="${tsMsgId}"]`)[0];
        let state = true;
        if (toggleButton){
            state = $(toggleButton).attr('state') === "1" ? true : false;
        }

        return {
            candidate,
            text,
            subject,
            type,
            recordCorrespondence: state
        }
    }

    const _sendButtonClick = async (element) => {
        const correspondence = await _getMessageSent(element);
        if (correspondence && correspondence.text.length){
            await connectionLifeCycleLogic.recordCorrespondence(correspondence);
        }
        else {
            tsCommon.logError('Unable to get text send in correspondenceCommon._sendButtonClick');
        }
    }

    const _onMouseClick = (e) => {
        const element = e.target;
        if (_doesTargetFingerPrintMatchASendButton(element)){
            _sendButtonClick(element);
        }
    }

    const _createHiddenInput = (id, candidate) => {
        const json = JSON.stringify(candidate);
        const input = document.createElement('input');
        $(input)
            .attr('type', 'hidden')
            .attr('id', id)
            .val(json)

        return input;
    }

    const _alisonButtonClick = async (e) => {
        let msgId = $(e.target).attr('ts-message-id');
        if (!msgId) {
            msgId = $(e.target.parentElement).attr('ts-message-id');
        }

        const candidateSearch = _getCandidateFromHiddenInput(msgId);
        const candidate = await candidateController.searchForCandidate(candidateSearch);

        let menuItems = 'cspir';
        if (candidate.email) {
            menuItems += 'e';
        }

        if (candidate.phone) {
            menuItems += 'n'
        }

        // eslint-disable-next-line no-alert
        tsPopup.showPopup(candidate, menuItems)
    }

    const _setupSpy = async (messageWindow, messageWindowScraperCallback, customCandidateScraper, customPasteHandler = null) => {
        customCandidateScraperCallback = customCandidateScraper;
        customPasteHandlerCallback = customPasteHandler;
        let messageGroupId = null;

        if (!(messageWindow && messageWindowScraperCallback)){
            return null;
        }

        const messageDialog = await messageWindowScraperCallback(messageWindow);
        if (!(messageDialog && messageDialog.candidate && messageDialog.header)){
            return null;
        }

        try {
            const {candidate, header, sendButton, textArea, subject, type } = messageDialog;
            if (!_recordSendButtonFingerPrint(sendButton)){
                return null;
            }

            const key = `${candidate.firstName}-${candidate.lastName}`;

            const tsLogoKey = `${key}-toggle`;
            if (!tsToolButton.containsButton(header, tsLogoKey)) {
                messageGroupId = tsCommon.newGuid(true);

                tsToolButton.appendButton(header, "tiny", "tonkaSourceLogo", tsLogoKey, `record-message-switch ${messageGroupId}`, true);
                const alisonButton = tsToolButton.appendButton(header, "tiny", "hotAlison1", `${key}-popup`, 'message-action-menu-container', false);

                $(alisonButton)
                    .addClass('alisonButton')
                    .attr('ts-message-id', messageGroupId)
                    .click(_alisonButtonClick);

                const hiddenInput = _createHiddenInput(messageGroupId, candidate);

                $(textArea).attr('ts-message-text-area-id', messageGroupId);
                $($(sendButton).parent())
                    .attr('ts-message-id', messageGroupId)
                    .attr('msg-type', type)
                    .append(hiddenInput);

                if (subject) {
                    $(subject).attr('ts-message-subject-id');
                }
            }
        } catch (e) {
            console.log(e);
        }

        _setupTsClipboard();
        return messageGroupId;
    }

    class CorrespondenceCommon {
        setupSpy = _setupSpy;
    }

    window.correspondenceCommon = new CorrespondenceCommon();

    $(document).ready(() => {
        $(document).bind('click', _onMouseClick);
    })
})();