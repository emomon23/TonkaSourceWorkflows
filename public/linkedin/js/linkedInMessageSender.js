(function() {
    const _getPublicProfile_MessageButtonSelector = (publicProfileWindow) => {
        let linkButton = tsCommon.findAHyperLink('/messaging/thread/', publicProfileWindow.document);
        if (linkButton !== null){
            return {
                type: 'MESSAGE',
                clickable: linkButton
            }
        }

        linkButton = publicProfileWindow.document.querySelector('button[aria-label*="Connect with"]');
        if (linkButton !== undefined && linkButton !== null){
            return {
                type: 'CONNECTION REQUEST',
                clickable: linkButton
            }
        }

        return null;
    }

    const _sendMessage = async (publicProfileWindow, messageToSend) => {
        messageToSend = messageToSend.trim();

        await tsCommon.sleep(2000);
        const paragraphElement = publicProfileWindow.document.getElementsByClassName('msg-form__contenteditable')[0];
        paragraphElement.focus();

        publicProfileWindow.document.execCommand('insertText', true, messageToSend);
        await tsCommon.sleep(1000);
        publicProfileWindow.document.getElementsByClassName('msg-form__send-button')[0].click();
        await tsCommon.sleep(1000);

        $('button[data-control-name*="close_conversation_window"]').click();
    }

    const _sendConnectionRequest = async (publicProfileWindow, messageToSend) => {
        publicProfileWindow.document.querySelector('button[aria-label*="Add a note"]').click();
        await tsCommon.sleep(800);
        publicProfileWindow.document.querySelector('textarea[name="message"]').outerText = messageToSend;

        const doneButton = publicProfileWindow.document.querySelector('button[aria-label="Done"]');
        doneButton.removeAttribute('disabled');
        doneButton.classList.remove('artdeco-button--disabled');
        await tsCommon.sleep(200);
        doneButton.click();
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
            
            if (connectionRequestToSend === null){
                connectionRequestToSend = messageToSend;
            }

            const candidate = searchResultsScraper.findCandidate(memberIdOrFirstNameAndLastName);

            if (candidate !== undefined && candidate !== null){
                messageToSend = _processAnyTemplateText(candidate, messageToSend);
                connectionRequestToSend = _processAnyTemplateText(candidate, connectionRequestToSend);

                publicProfileWindow = await _navigateToPublicProfilePage(candidate);
                tsInterceptor.copyToAnotherWindow(publicProfileWindow);

                candidate.linkedIn = publicProfileWindow.location.href;

                await linkedInApp.upsertContact(candidate);

                const whatButtonIsAvailable = _getPublicProfile_MessageButtonSelector(publicProfileWindow);
                if (whatButtonIsAvailable === null){
                    tsCommon.log(`Unable to send a message to ${candidate.firstName} ${candidate.lastName}`);
                }
                else {
                    whatButtonIsAvailable.clickable.click();
                    await tsCommon.sleep(5000);

                    if (whatButtonIsAvailable.type === 'MESSAGE'){
                        await _sendMessage(publicProfileWindow, messageToSend);
                        //linkedInMessageSpy should pick up that a message was sent
                    }
                    else {
                        await _sendConnectionRequest(publicProfileWindow, connectionRequestToSend);
                        linkedInApp.recordConnectionRequestMade(memberIdOrFirstNameAndLastName, connectionRequestToSend);
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