(() => {
    const publicInMailSelector = 'div[class*="msg-overlay-conversation-bubble--default"]:contains("New message")';

    const _scrapeContactIdentifer = async (messageWindowReference) => {
        let messageWindow = messageWindowReference ? messageWindowReference : null;

        if (!messageWindow) {
            messageWindow = $(publicInMailSelector);
            if (messageWindow.length !== 1){
                return null;
            }

            messageWindow = messageWindow[0];
        }

        const imageElement = $(messageWindow).find('img[class*="presences-entity"]')[0];
        const nameElement = $(messageWindow).find('a[href*="/in/"][class*="msg-compose"]')[0];
        const headlineElement = $(messageWindow).find('div[class*="msg-compose__occupation"]')[0];

        if (!nameElement){
            return null;
        }

        const wholeName = $(nameElement).text().trim();
        const nameObject = tsString.parseOutFirstAndLastNameFromString(wholeName);

        const firstName = nameObject.firstName;
        const lastName = nameObject.lastName;
        const headline = headlineElement ? $(headlineElement).text().trim() : '';
        const imageUrl = imageElement ? $(imageElement).text().trim() : '';

        return {
            firstName,
            lastName,
            headline,
            imageUrl
        }
    }

    const _scapeContactFromPublicMessageWindow = async (messageWindow) => {
        const buttonContainer = $(messageWindow).find('header section h4')[0];
        const subject = $(messageWindow).find('input[name*="subject"]')[0];
        const textArea = $(messageWindow).find('textarea[class*="msg-form__contenteditable"][role*="textbox"]')[0];
        const sendButton = $(messageWindow).find('button[class*="msg-form__send-button"][type*="submit"]')[0];
        const candidate = await _scrapeContactIdentifer(messageWindow);

        return {
            candidate,
            sendButton,
            textArea,
            subject,
            header: buttonContainer,
            type: 'public-in-mail'
        }
    }


    const _spyOnPublicMessageWindows = async () => {
        await tsCommon.sleep(1000);
        const inMailWindows = $(publicInMailSelector);

        if (inMailWindows.length > 0){
            for (let i = 0; i < inMailWindows.length; i++) {
                correspondenceCommon.setupSpy(inMailWindows[i], _scapeContactFromPublicMessageWindow, _scrapeContactIdentifer);
            }
        }
    }

    const _delayDocReady = async () => {
        await tsCommon.sleep(1000);
        const messageDropdownButton = $('button[class*="artdeco-dropdown__trigger"]');

        if (messageDropdownButton.length > 0){
            $(messageDropdownButton).click(async () => {
                tsCommon.sleep(1000);
                const publicMessageButtonElement = $('a[class*="message-anywhere-button"]');
                $(publicMessageButtonElement).click(() => {
                    _spyOnPublicMessageWindows();
                });
            });
        }
    }

    $(document).ready(() => {
        _delayDocReady();
    })
})();