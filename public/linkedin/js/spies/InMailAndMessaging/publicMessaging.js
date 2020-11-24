(() => {

    const _checkIfPublicMessagingIsPresent = () => {
        return $('button[class*="msg-overlay-bubble-header"] span:contains("Messaging")').length > 0;
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
            sendButton
        }
    }

    const _preparePublicMessageDialogForContact = async (messagingDialog) => {
        correspondenceCommon.setupSpy(messagingDialog, _scrapePublicMessageModalWindow);
    }

    const _prepareTheExistingMessagingDialogs = async () => {
        await tsCommon.sleep(500);
        const existingMessageBoxes = $('div[class*="msg-overlay-conversation-bubble--"]');

        for (let i = 0; i < existingMessageBoxes.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await _preparePublicMessageDialogForContact(existingMessageBoxes[i]);
        }
    }

    const _listenForMessageDialogsToBeDisplayed = () => {
        $('div[class*="msg-overlay-list-bubble__convo-card-content--v2"]').click((e) => {
            _prepareTheExistingMessagingDialogs();
        })
    }

    const _delayDocReady = async () => {
        await tsCommon.sleep(1000);
        if (_checkIfPublicMessagingIsPresent()) {
            _listenForMessageDialogsToBeDisplayed();
            _prepareTheExistingMessagingDialogs();
        }
    }

    $(document).ready(() => {
        _delayDocReady();
    });
})();