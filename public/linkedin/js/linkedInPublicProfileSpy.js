(() => {
    const _messageModalSelectors = linkedInSelectors.publicProfilePage.messageModal;
    const _connectionRequestSelectors = linkedInSelectors.publicProfilePage.connectionRequestModal;
   
    const _suspendedRecording = {};
    const _recordingStyleOn = 'height:20px;width:20px';
    const _recordingStyleOff = 'height:20px;width:20px;opacity:.2';

    const _toggleRecording = (img) => {
        const who = $(img).attr('who');
        if (_suspendedRecording[who]){
            _suspendedRecording[who] = undefined;
            $(img).attr('style', _recordingStyleOn);
        }
        else {
            _suspendedRecording[who] = true;
            $(img).attr('style', _recordingStyleOff);
        }
    }

    const _createRecordingButtonsForEachMessageModal = () => {
        $('.tsMessageRecordButton').remove();
        const footers = $(_messageModalSelectors.leftActionSection);

        footers.toArray().forEach((footer) => {
            const img = document.createElement('img');
            let forWho = _getFirstAndLastName(footer);
            forWho = `${forWho.firstName}${forWho.lastName}`;
           
            img.src = 'https://media-exp1.licdn.com/dms/image/C4E0BAQG13PuOrrmXTA/company-logo_100_100/0?e=1608768000&v=beta&t=052qHO34QXIUiOhBPvA9-MkB8byJwNbKiqjSuQ_wmj0';
            
            const recordingStyle = _suspendedRecording[forWho]? _recordingStyleOff : _recordingStyleOn;

            $(img).attr('who', forWho).attr('style', recordingStyle).attr('class', 'tsMessageRecordButton');
    
            $(img).bind('click', (e) => {
                _toggleRecording(e.target);
            });

            footer.append(img);
        });       
    }

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

    const _getFirstAndLastName = (peerElement = null) => {
        if (peerElement === null){
            peerElement = document.activeElement;
        }

        let result = {firstName: '', lastName: ''};
        const headerSpan = _getMessageModal_RecipientNameElement(peerElement);

        if (headerSpan !== null){
            const firstAndLastName = headerSpan.textContent.trim().split(' ');
            result.firstName = firstAndLastName[0];
            result.lastName = firstAndLastName.length > 1? firstAndLastName[1] : '';
        }

        return result;
    }

    const _addASpaceToTheMessage = async (activeDiv) => {
        await tsCommon.sleep(200);
        activeDiv.focus();

        document.execCommand('insertText', true, ' ');
    }

    const _processFirstNameTemplateReplacement = () => {
        const activeDiv = $(document.activeElement)[0];

        if (activeDiv && activeDiv.outerText.trim().length > 0 && activeDiv.outerText.indexOf('[firstName]') >= 0){
            const recipientName = _getFirstAndLastName();
            let text = activeDiv.innerHTML.split('[firstName]').join(recipientName.firstName);
            if (text !== activeDiv.innerHTML){
                activeDiv.innerHTML = text;
                _addASpaceToTheMessage(activeDiv);
            }
        }
    }

    const _tsSendMessageButtonClickSpyHandler = () => {
        const recipientName = _getFirstAndLastName();
        const fullName = `${recipientName.firstName}${recipientName.lastName}`;
        if (_suspendedRecording[fullName] === true){
            return;
        }

        const textEntry = tsUICommon.findPreviousElement(document.activeElement, _messageModalSelectors.textEntries);
        const messageText = textEntry? $(textEntry).text() : 'UNKNOWN';

        linkedInApp.recordMessageWasSent(recipientName, messageText);
    }

    const _tsSendConnectionRequestButtonClickSpyHandler = async () => {
        const textArea = tsUICommon.findFirstDomElement(_connectionRequestSelectors.connectionNoteTextEntries);
        const text = textArea === null? 'NO NOTE IN REQUEST' : $(textArea).val();

        const publicProfile = await linkedInPublicProfile.scrapeProfile();
        if (!publicProfile){
            tsCommon.log("Unable to record connection request, unable to scrape profile", "WARN");
            return;
        }
       
        linkedInApp.recordConnectionRequestMade(publicProfile, text);
    }

    const _checkIfConnectionRequestModalIsPresent = () => {
         //Bind to the Connection Request "Done" button, if present
         const doneButtonSelectors = _connectionRequestSelectors.connectionRequestDoneButtons;

         const doneButton = tsUICommon.findFirstDomElement(doneButtonSelectors)
         if (tsUICommon.findDomElements(_connectionRequestSelectors.connectionRequestModal) !== null && doneButton !== null){
            tsUICommon.rebind(doneButton, 'click', _tsSendConnectionRequestButtonClickSpyHandler);
        }

    }

    const _attachTemplateProcessingListenerToMessageObjects = async () => {
        await tsCommon.sleep(1000);

        const editableDivs = tsUICommon.findDomElements(_messageModalSelectors.textEntries);
        if (editableDivs === null){
            return;
        }

        tsUICommon.rebind(editableDivs, 'DOMSubtreeModified', _processFirstNameTemplateReplacement);
        tsUICommon.rebind(_messageModalSelectors.sendButtons, 'click', _tsSendMessageButtonClickSpyHandler);

        _createRecordingButtonsForEachMessageModal();
    }      
    
    class LinkedInPublicProfileSpy {
        constructor() {
            if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PUBLIC_PROFILE){
                tsCommon.log("LinkedInPublicProfile spy is spying - good news!");

                this.numberOfMessageWindows = _getNumberOfMessageWindows();
                
                this.intervalId = window.setInterval(() => {
                    const currentNumberOfMessageWindows = _getNumberOfMessageWindows();
                    if (this.numberOfMessageWindows !== currentNumberOfMessageWindows){
                        _attachTemplateProcessingListenerToMessageObjects();
                        this.numberOfMessageWindows = currentNumberOfMessageWindows;
                    }

                    _checkIfConnectionRequestModalIsPresent();
                }, 1500);
            }
        }

        getNearestFirstAndLastName = (startingSelector = null) => {
            startingSelector = startingSelector? startingSelector : document.activeElement;

            return _getFirstAndLastName(startingSelector);
        }
    }

    window.linkedInPublicProfileSpy = new LinkedInPublicProfileSpy();
})();
