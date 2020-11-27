(() => {
    const sendButtonFingerPrints = {};
    let setupCalled = false;


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

    const _findCandidateForHighlightedText = (startElement) => {
        let element = startElement;
        let found = $(element).find('[ts-message-id]')[0];
        let tsMsgId = null;

        while (!found && $(element).parent()){
            element = $(element).parent();
            found = element ? $(element).find('[ts-message-id]')[0] : null;
            if (found){
                tsMsgId = $(found).attr('ts-message-id');
            }
        }

        if (found) {
            const jsonString = $($(`#${tsMsgId}`)[0]).val();
            return JSON.parse(jsonString);
        }

        return found;
    }

    const _onPhoneNumberHighlighted = (evt , phoneNumber) => {
        const candidate = _findCandidateForHighlightedText(evt.target);
        console.log("A phone number has been highlighted");
    }

    const _onMessagePastedToTsClipboard = (evt, tsClpboardData) => {
        if (tsClpboardData.id){
            const candidate = _findCandidateForHighlightedText(evt.target);
            tsClpboardData.text = tsTemplateProcessor.convertToTemplate(tsClpboardData.text);
            tsClipboardRepository.save(tsClpboardData);
        }
    }

    const _setupTsClipboard = () => {
        if (!setupCalled){
            tsClipboard.enable(_onMessagePastedToTsClipboard);
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
            text = textAreaElement ? $(textAreaElement).text().replace("An error occurred. Please try again.", "") : '';
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
        await connectionLifeCycleLogic.recordCorrespondence(correspondence);
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

    const _setupSpy = async (messageWindow, messageWindowScraperCallback) => {
        if (!(messageWindow && messageWindowScraperCallback)){
            return;
        }

        const messageDialog = await messageWindowScraperCallback(messageWindow);
        if (!(messageDialog && messageDialog.candidate && messageDialog.header)){
            return;
        }

        try {
            const {candidate, header, sendButton, textArea, subject, type } = messageDialog;
            if (!_recordSendButtonFingerPrint(sendButton)){
                return;
            }

            const key = `${candidate.firstName}-${candidate.lastName}`;

            const tsLogoKey = `${key}-toggle`;
            if (!tsToolButton.containsButton(header, tsLogoKey)) {
                const messageGroupId = tsCommon.newGuid(true);

                tsToolButton.appendButton(header, "tiny", "tonkaSourceLogo", tsLogoKey, `record-message-switch ${messageGroupId}`, true);
                const alisonButton = tsToolButton.appendButton(header, "tiny", "hotAlison1", `${key}-popup`, 'message-action-menu-container', false);
                const menu = tsContactMenu.buildContactMenu(candidate);

                tsPopup.bindToClick(alisonButton, menu);

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
    }

    class CorrespondenceCommon {
        setupSpy = _setupSpy;
    }

    window.correspondenceCommon = new CorrespondenceCommon();

    $(document).ready(() => {
        $(document).bind('click', _onMouseClick);
    })
})();