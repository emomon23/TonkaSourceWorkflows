(() => {
    const imDialogSelector = 'div[class*="msg-overlay-conversation-bubble--"]';
    let activeProfile = null;
    let activeMsgId = null;

    const _checkIfPublicMessagingIsPresent = () => {
        return $('button[class*="msg-overlay-bubble-header"] span:contains("Messaging")').length > 0;
    }

    const _findClosestTSMessageId = (startElement) => {
        try {
            let element = startElement;
            let found = $(element).find('[ts-message-id]')[0];

            while ((!found) && element){
               console.log("checking parent");
               element = element.parentElement;
               found = element ? $(element).find('[ts-message-id]')[0] : null;
            }

            return found ? $(found).attr('ts-message-id') : "no";
        } catch (e) {
            tsCommon.logError(e, '_findClosestTSMessageId');
            return null;
        }
    }

    const _getClosestCandidate = async (startElement) => {
        if (startElement) {
            const msgId = _findClosestTSMessageId(startElement);
            if (msgId){
                activeMsgId = msgId;
                const hiddenValue = $(`#${msgId}`)[0];
                const jsonString = $(hiddenValue).val();
                activeProfile = JSON.parse(jsonString);
            }
        }

        const msg = activeProfile ? activeProfile.firstName : 'None';
        console.log(`active profile: ${msg}`);
    }

    const _getCandidateFromHeader = (messagingDialog) => {
        let recipientElement = $(messagingDialog).find('h4 a span')[0];
        let imageUrlElement = $(messagingDialog).find('img[class*="EntityPhoto"]')[0];

        if (!(recipientElement && imageUrlElement)){
            return null;
        }

        let recipientFullNameArray = recipientElement.textContent.split('\n').join('').trim().split(' ');
        const imageUrl = $(imageUrlElement).attr('src');

        const result = {
            firstName: recipientFullNameArray[0],
            lastName: '',
            imageUrl: imageUrl
        };

        if (recipientFullNameArray.length > 1){
            result.lastName = recipientFullNameArray[recipientFullNameArray.length - 1];
        }

        return result;
    }

    const _scrapePublicMessageModalWindow = (messagingDialog) => {

        const header = $(messagingDialog).find('header section div h4')[0];
        const candidate = _getCandidateFromHeader(messagingDialog);
        const textArea = $(messagingDialog).find('div[class*="msg-form__contenteditable"][role*="textbox"]')[0];
        const sendButton = $(messagingDialog).find('button[class*="msg-form__send-button"][type*="submit"]')[0];

        return {
            header,
            candidate,
            textArea,
            sendButton,
            type: 'public-im'
        }
    }

    const _getActiveMessageCandidate = async () => {
        return activeProfile;
    }

    const _customPasteHandler = async (data) => {
        const text = data.text;
        const div = $(`div[ts-message-id*="${activeMsgId}"] div[class*="msg-form__contenteditable"]`)[0];
        let replaceText = div ? $(div).text() : '';
        replaceText = tsUICommon.cleanseTextOfHtml(replaceText);

        await tsUICommon.executeDelete(div, replaceText.length);
        document.execCommand('insertText', true, text);
    }

    const _preparePublicMessageDialogForContact = async (messagingDialog) => {
        const msgId = await correspondenceCommon.setupSpy(messagingDialog, _scrapePublicMessageModalWindow, _getActiveMessageCandidate, _customPasteHandler);
        if (msgId){
            $(messagingDialog).attr('ts-message-id', msgId);
            const header = $(messagingDialog).find('header')[0];
            if (header){
                $(header).attr('ts-message-id', msgId);
            }

            await tsCommon.sleep(100);
            _getClosestCandidate(messagingDialog);
        }

        const msgTextAreas = $('div[class*="msg-overlay-conversation-bubble--"] div[class*="msg-form__contenteditable"]');

        $(msgTextAreas)
            .focus((e) => {
                _getClosestCandidate(e.target);
            });

    }

    const _prepareTheExistingMessagingDialogs = async () => {
        await tsCommon.sleep(500);
        const existingMessageBoxes = $(imDialogSelector);

        for (let i = 0; i < existingMessageBoxes.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await _preparePublicMessageDialogForContact(existingMessageBoxes[i], true);
        }
    }

    const _listenForMessageDialogsToBeDisplayed = () => {
        $('div[class*="msg-overlay-list-bubble__convo-card-content--v2"]').click((e) => {
            _prepareTheExistingMessagingDialogs();
        })
    }

    const _refreshProfileScraper = async () => {
        await tsCommon.sleep(1000);
        linkedInPublicProfileScraper.currentProfileLite = await linkedInPublicProfileScraper.scrapeProfile(false);
    }

    const _delayDocReady = async () => {
        await tsCommon.sleep(1000);
        if (_checkIfPublicMessagingIsPresent()) {
            _listenForMessageDialogsToBeDisplayed();
            await _prepareTheExistingMessagingDialogs();
            activeProfile = null;
        }

        $('section[class*="msg-overlay-bubble-header"] h4 a[href*="/in/"]').click(() => {
            _refreshProfileScraper();
        })
    }

    $(document).ready(() => {
        _delayDocReady();
    });
})();