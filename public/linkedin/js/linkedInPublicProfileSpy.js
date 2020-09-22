(() => {
    let __numberOfMessageWindowsPresent = 0;
    const _messagesThatNeedASpacedInsertedBeforeSending = {};
    const _messageModalSelectors = linkedInSelectors.publicProfilePage.messageModal;
    const _connectionRequestSelectors = linkedInSelectors.publicProfilePage.connectionRequestModal;
    
    const _getNumberOfMessageWindows = () => {
        return $(_messageModalSelectors.textEntries).length;
    }

    const _getMessageModal_RecipientNameElement = (peerElement) => {
        let headerSpan = tsUICommon.findPreviousElement(peerElement, _messageModalSelectors.activeMessageModalHeader);
        let text = headerSpan && headerSpan.length > 0? headerSpan[0].textContent.trim() : null;

        if (!headerSpan || headerSpan.length === 0 || text === "New message" || text === "Messaging"){
            headerSpan = tsUICommon.findPreviousElement(peerElement, _messageModalSelectors.multipleMessageRecipientPills);
        }

        return headerSpan && headerSpan.length > 0? headerSpan[0]: null;
    }

    const _getFirstAndLastName = (peerElement) => {
        let result = {firstName: '', lastName: ''};
        const headerSpan = _getMessageModal_RecipientNameElement(peerElement);

        if (headerSpan !== null){
            const firstAndLastName = headerSpan.textContent.trim().split(' ');
            result.firstName = firstAndLastName[0];
            result.lastName = firstAndLastName.length > 1? firstAndLastName[1] : '';
        }

        return result;
    }

    const _addASpaceToTheMessage = async (textEntry) => {
        const id = tsUICommon.getOrCreateElementId(textEntry);

        if (_messagesThatNeedASpacedInsertedBeforeSending[id] === true){
            //This is the bug fix so we don't sent 'Hello [firstName] ...'
            await tsCommon.sleep(200);
            textEntry.focus();
            document.execCommand('insertText', true, ' ');
        }
    }

    const _processFirstNameTemplateReplacement = () => {
        const textEntry = document.activeElement;

        let text = textEntry && textEntry.outerText? textEntry.outerText.trim() : '';

        if (text.indexOf('[firstName]') >= 0){
            const recipientName = _getFirstAndLastName(textEntry);
            text = textEntry.innerHTML.split('[firstName]').join(recipientName.firstName);
            if (text !== textEntry.innerHTML){
                textEntry.innerHTML = text;
                const id = tsUICommon.getOrCreateElementId(textEntry);
                _messagesThatNeedASpacedInsertedBeforeSending[id] = true;
            }
        }
    }

    const _tsSendMessageButtonClickSpyHandler = () => {
        const sendButton = document.activeElement;

        const recipientName = _getFirstAndLastName(sendButton);

        const textEntry = tsUICommon.findPreviousElement(_messageModalSelectors.textEntries);
        _addASpaceToTheMessage(textEntry);

        const messageText = $(textEntry).html();

        console.log({recipientName, messageText});
        //linkedInApp.recordMessageWasSent(recipientName, messageText);
    }

    const _tsSendConnectionRequestButtonClickSpyHandler = async () => {
        const textArea = tsUICommon.findFirstDomElement(_connectionRequestSelectors.connectionNoteTextEntries);
        const text = textArea === null? 'NO NOTE IN REQUEST' : $(textArea).val();

        const publicProfile = await linkedInPublicProfile.scrapeProfile();
        const memberId = publicProfile && publicProfile.memberId? publicProfile.memberId: null;
        if (memberId === null){
            console.log("ERROR - unable to find memberId for this connection request.  Can't record this in Alison");
            return;
        }

        console.log({memberId, text});
       // linkedInApp.recordConnectionRequestMade(memberId, text);
    }

    const _checkIfConnectionRequestModalIsPresent = () => {
         //Bind to the Connection Request "Done" button, if present
         const doneButtonSelectors = _connectionRequestSelectors.connectionRequestDoneButtons;
         const doneButton = tsUICommon.findFirstDomElement(doneButtonSelectors)
            
         if (tsUICommon.findDomElement(_connectionRequestSelectors.connectionRequestModal) && doneButton){
            tsUICommon.rebind(doneButton, 'click', _tsSendConnectionRequestButtonClickSpyHandler);
        }
    }

    const _attachTemplateProcessingListenerToMessageObjects = async () => {
        await tsCommon.sleep(1000);

        const allEditableMessageWindowDivs = tsUICommon.findDomElements(_messageModalSelectors.textEntries);
        if (allEditableMessageWindowDivs === null){
            return;
        }

        tsUICommon.rebind(allEditableMessageWindowDivs, 'DOMSubtreeModified', _processFirstNameTemplateReplacement);
        tsUICommon.rebind(_messageModalSelectors.sendButtons, 'click', _tsSendMessageButtonClickSpyHandler);

    }   
    
    const _monitorMessageModals = () => {
        const currentNumberOfMessageWindows = _getNumberOfMessageWindows();
        
        if (__numberOfMessageWindowsPresent !== currentNumberOfMessageWindows){
            _attachTemplateProcessingListenerToMessageObjects();
            __numberOfMessageWindowsPresent = currentNumberOfMessageWindows;
        }

        _checkIfConnectionRequestModalIsPresent();
    }
    
    class LinkedInPublicProfileSpy {
        constructor() {
            if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PUBLIC_PROFILE){
                console.log("Spy is spying - good news!");

                __numberOfMessageWindowsPresent = _getNumberOfMessageWindows();
                tsUICommon.rebind(document, 'DOMSubtreeModified', _monitorMessageModals);
            }
        }
    }

    window.linkedInPublicProfileSpy = new LinkedInPublicProfileSpy();
})();
