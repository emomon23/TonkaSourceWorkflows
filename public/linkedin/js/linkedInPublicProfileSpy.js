(() => {
    let __lastEditableDiv = null;

    const _getNumberOfMessageWindows = () => {
        return $('div[class*="msg-form__contenteditable"]').length;
    }

    const _getMessageModal_RecipientNameElement = (peerElement) => {
        let headerSpan = tsUICommon.findPreviousElement(peerElement, 'h4 span');
        let text = headerSpan && headerSpan.length > 0? headerSpan[0].textContent.trim() : null;

        if (!headerSpan || headerSpan.length === 0 || text === "New message" || text === "Messaging"){
            headerSpan = tsUICommon.findPreviousElement(peerElement, 'span[class*="artdeco-pill__text"]')
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

    const _addASpaceToTheMessage = async () => {
        await tsCommon.sleep(200);
        const paragraphElement = document.getElementsByClassName('msg-form__contenteditable')[0];
        paragraphElement.focus();

        document.execCommand('insertText', true, ' ');
    }

    const _processFirstNameTemplateReplacement = () => {
        if (__lastEditableDiv && __lastEditableDiv.outerText.trim().length > 0 && __lastEditableDiv.outerText.indexOf('[firstName]') >= 0){
            const recipientName = _getFirstAndLastName(__lastEditableDiv);
            let text = __lastEditableDiv.innerHTML.split('[firstName]').join(recipientName.firstName);
            if (text !== __lastEditableDiv.innerHTML){
                __lastEditableDiv.innerHTML = text;
                _addASpaceToTheMessage(text);
            }
        }
    }

    const _tsDomSpy = () => {
       _processFirstNameTemplateReplacement();
    }

    const _tsSendMessageButtonClickSpyHandler = () => {
        const recipientName = _getFirstAndLastName(__lastEditableDiv);
        const messageText = $(__lastEditableDiv).html();

        linkedInApp.recordMessageWasSent(recipientName, messageText);
    }

    const _tsSendConnectionRequestButtonClickSpyHandler = async () => {
        const textArea = tsUICommon.findFirstDomElement(['textarea[name*=“message”]', '#custom-message', 'textarea']);
        const text = textArea === null? 'NO NOTE IN REQUEST' : $(textArea).val();

        const publicProfile = await linkedInPublicProfile.scrapeProfile();
        const memberId = publicProfile && publicProfile.memberId? publicProfile.memberId: null;
        if (memberId === null){
            console.log("ERROR - unable to find memberId for this connection request.  Can't record this in Alison");
            return;
        }

        linkedInApp.recordConnectionRequestMade(memberId, text);
    }

    const _checkIfConnectionRequestModalIsPresent = () => {
         //Bind to the Connection Request "Done" button, if present
         const doneButtonSelectors = ['button[aria-label=“Done”]', 'button span:contains("Done")'];

         const doneButton = tsUICommon.findFirstDomElement(doneButtonSelectors)
         if (tsUICommon.findDomElement('div[data-test-modal]') !== null && doneButton !== null){
            tsUICommon.rebind(doneButton, 'click', _tsSendConnectionRequestButtonClickSpyHandler);
        }

    }

    const _attachTemplateProcessingListenerToMessageObjects = async () => {
        await tsCommon.sleep(1000);

        const editableDiv = tsUICommon.findDomElement('div[class*="msg-form__contenteditable"]');
        if (editableDiv === null){
            return;
        }

        __lastEditableDiv = editableDiv[0];
        tsUICommon.rebind(editableDiv, 'DOMSubtreeModified', _tsDomSpy);
        tsUICommon.rebind('button[class*="msg-form__send-button"]', 'click', _tsSendMessageButtonClickSpyHandler);

    }      
    
    class LinkedInPublicProfileSpy {
        constructor() {
            if (window.location.href.toLowerCase().indexOf('.linkedin.com/in/') > 0){
                console.log("Spy is spying - good news!");

                this.numberOfMessageWindows = _getNumberOfMessageWindows();
                
                $(document).bind('DOMSubtreeModified', () => {
                    const currentNumberOfMessageWindows = _getNumberOfMessageWindows();
                    if (this.numberOfMessageWindows !== currentNumberOfMessageWindows){
                        _attachTemplateProcessingListenerToMessageObjects();
                        this.numberOfMessageWindows = currentNumberOfMessageWindows;
                    }

                    _checkIfConnectionRequestModalIsPresent();
                });
            }
        }
    }

    window.linkedInPublicProfileSpy = new LinkedInPublicProfileSpy();
})();
