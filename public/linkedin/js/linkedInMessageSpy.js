(() => {
    let __lastEdittableDiv = null;

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

        if (headerSpan != null){
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

    const _tsDomSpy = () => {
        __lastEdittableDiv = this;
        if (this.outerText.trim().length > 0 && this.outerText.indexOf('[firstName]') >= 0){
            const recipientName = _getFirstAndLastName(this);
            let text = this.innerHTML.split('[firstName]').join(recipientName.firstName);
            if (text != this.innerHTML){
                this.innerHTML = text;
                _addASpaceToTheMessage(text);
            }
        }
    }

    const _tsSendMessageButtonClickSpyHandler = () => {
        const recipientName = _getFirstAndLastName(__lastEdittableDiv);
        const messageText = $(__lastEdittableDiv).html();

        linkedInApp.recordMessageWasSent(recipientName, messageText);
    }

    const _tsSendConnectionRequestButtonClickSpyHandler = () => {
        const textArea = tsUICommon.findDomElement('textarea[name=“message”]');
        const text = textArea === null? 'NO NOTE IN REQUEST' : $(textArea).val();
    }

    const _attachTemplateProcessingListenerToMessageObjects = async () => {
        await tsCommon.sleep(1000);

        const editableDiv = tsUICommon.findDomElement('div[class*="msg-form__contenteditable"]');
        if (editableDiv == null){
            return;
        }

        tsUICommon.rebind(editableDiv, 'DOMSubtreeModified', _tsDomSpy);
        tsUICommon.rebind('button[class*="msg-form__send-button"]', 'click', _tsSendMessageButtonClickSpyHandler);

        if (tsUICommon.findDomElement('div[data-test-modal]') !== null){
            tsUICommon.rebind('button[aria-label=“Done”]', 'click', _tsSendConnectionRequestButtonClickSpyHandler);
        }
    }      
    
    class LinkedInMessageSpy {
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
                });
            }
        }
    }

    window.linkedInMessageSpy = new LinkedInMessageSpy();
})();
