(function() {
    const _getPublicProfile_MessageButtonSelector = (publicProfileWindow) => {
        let linkButton = tsCommon.findAHyperLink('/messaging/thread/', publicProfileWindow.document);
        if (linkButton != null){
            return {
                type: 'MESSAGE',
                clickable: linkButton
            }
        }

        linkButton = publicProfileWindow.document.querySelector('button[aria-label*="Connect with"]');
        if (linkButton != undefined && linkButton != null){
            return {
                type: 'CONNECTION REQUEST',
                clickable: linkButton
            }
        }

        return null;
    }

    const _SendMessage = (publicProfileWindow, messageToSend) => {
        messageToSend = messageToSend.trim();

        const paragraphElement = publicProfileWindow.document.querySelector('div[class*="msg-form__contenteditable"] p');
        const htmlElement = window.htmlToElement(messageToSend);
        paragraphElement.appendChild(htmlElement);
        publicProfileWindow.document.querySelector('div[id*="msg-form__contenteditable-placeholder"]').style.display = 'none';
    }

    const _SendConnectionRequest = async (publicProfileWindow, messageToSend) => {
        publicProfileWindow.document.querySelector('button[aria-label*="Add a note"]').click();
        await tsCommon.sleep(1000);
        publicProfileWindow.document.querySelector('textarea[name="message"]').outerText = messageToSend;

        const doneButton = publicProfileWindow.document.querySelector('button[aria-label="Done"]');
        doneButton.removeAttribute('disabled');
        doneButton.classList.remove('artdeco-button--disabled');
      //  doneButton.click();
    }

    const _navigateToPublicProfilePage = async (candidate) => {
        const href = `https://www.linkedin.com${candidate.linkedInRecruiterUrl}`;
        const publicProfileWindow = window.open(href);

        await tsCommon.sleep(5000);
        tsCommon.navigateToHyperLink(".com/in", publicProfileWindow);

        await tsCommon.sleep(5000);
        return publicProfileWindow;
    }

    const _processAnyTemplateText = (candidate, messageTemplate) => {
        let message = messageTemplate.split('[firstName]').join(candidate.firstName);
        message = message.split('firstName').join(candidate.firstName);

        message = message.split('[lastName]').join(candidate.lastName);
        message = message.split('lastName').join(candidate.lastName);

        return message;
    }

    const _sendLinkedInMessageOrConnectionRequestToCandidate = async (memberIdOrFirstNameAndLastName, messageToSend, connectionRequestToSend = null) => {
            
            if (connectionRequestToSend == null){
                connectionRequestToSend = messageToSend;
            }

            const candidate = searchResultsScraper.findCandidate(memberIdOrFirstNameAndLastName);

            if (candidate != undefined && candidate != null){
                messageToSend = _processAnyTemplateText(candidate, messageToSend);
                connectionRequestToSend = _processAnyTemplateText(candidate, connectionRequestToSend);

                publicProfileWindow = await _navigateToPublicProfilePage(candidate);
                
                const whatButtonIsAvailable = _getPublicProfile_MessageButtonSelector(publicProfileWindow);
                if (whatButtonIsAvailable == null){
                    console.log(`Unable to send a message to ${canidate.firstName} ${candidate.lastName}`);
                }
                else {
                    whatButtonIsAvailable.clickable.click();
                    await tsCommon.sleep(5000);

                    if (whatButtonIsAvailable.type === 'MESSAGE'){
                        _SendMessage(publicProfileWindow, messageToSend);
                    }
                    else {
                        _SendConnectionRequest(publicProfileWindow, connectionRequestToSend);
                      //  publicProfileWindow.close();
                    }
                }
            }
    }

    class LinkedInMessageSender {
        constructor() {}

        sendLinkedInMessageOrConnectionRequestToCandidate = _sendLinkedInMessageOrConnectionRequestToCandidate;
    }

    window.linkedInMessageSender = new LinkedInMessageSender();
})();