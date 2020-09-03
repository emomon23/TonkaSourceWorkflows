(function() {
    let messageButton = null;
    let pendingButton = null;
    let connectButton = null;

    const _getLinkedInMessageTextParagraph = (candidate) => {
        const baseQuery = `div[class*="msg-overlay-conversation-bubble--is-active"]:contains("[CANDIDATE_NAME]") div[class*="msg-form__contenteditable"] p`;
        let query = baseQuery.split('[CANDIDATE_NAME]').join(candidate.fullName);
        let numberFound = $(query).length;
        if (numberFound === 0){
            query = baseQuery.split('[CANDIDATE_NAME]').join(candidate.firstName);
            numberFound = $(query).length;
        }

        if (numberFound === 1){
            return $(query)[0];
        }

        return null;
    }

    const _getLinkedInMessageSendButton = (candidate) => {
        const baseQuery = 'div[class*="msg-overlay-conversation-bubble--is-active"]:contains("[CANDIDATE_NAME]") button[type="submit"]'
        let query = baseQuery.split('[CANDIDATE_NAME]').join(candidate.fullName);
        let numberFound = $(query).length;
        if (numberFound === 0){
            query = baseQuery.split('[CANDIDATE_NAME]').join(candidate.firstName);
            numberFound = $(query).length;
        }

        if (numberFound === 1){
            return $(query)[0];
        }

        return null;
    }

    const _getButtonsOnProfilePage = () => {
        let temp = $('a[href*="/messaging/thread"]');
        const messageButtonButtonAvailable = temp.length > 0;
        messageButton = messageButtonButtonAvailable? temp[0]: null;

        temp = $('button[aria-label*="Connect with"]');
        const connectButtonAvailable = temp.length > 0;
        connectButton = connectButtonAvailable? temp[0]: null;

        temp = $('span[class="artdeco-button__text"]:contains("Pending")');
        const isPendingConnection = temp.length > 0;
        pendingButton = isPendingConnection? temp[0] : null;

        return {
            isPendingConnection,
            connectButtonAvailable,
            messageButtonButtonAvailable
        }
    }

    const _clickPublicProfileLinkOnRecruiter = async () => {
        const profileLink = $('a:contains("Public Profile")')[0]
        const publicProfileUrl = $(profileLink).attr('href');
        window.location.href = publicProfileUrl;
    
        await tsCommon.sleep(5000);
        const currentHref = window.location.href;
    
        if (currentHref.indexOf('linkedin.com/in/') >= 0){
            const result = _getButtonsOnProfilePage();
            result.candidatePublicProfileUrl = currentHref;
            return result;
        }
        else {
            return null;
        }
    }

    const _getConnectionRequestAddANoteButton = () => {
        let query = 'button[aria-label="Add a note"]';
        const found = $(query).length;

        if (found === 1){
            return $(query)[0];
        }

        return null;
    }

    const _getConnectionRequestDoneButton = () => {
        const query = 'button[aria-label="Done"]';
        const found = $(query).length;
        if (found !== 1){
            return null;
        }

        const result = found[0];
        $(result).attr('class', '');
        return result;
    }

    const _getConnectionRequestTextArea = () => {
        const query = 'textarea[name="message"]';
        const found = $(query).length;

        if (found != 1){
            return null;
        }

        return $(found)[0];
    }

    const _sendLinkedInMessage = async(candidate, message) => {
        if (messageButton == null || messageButton == undefined){
            _getButtonsOnProfilePage();
            if (messageButton == null || messageButton == undefined){
                return null;
            }
        }
        
        //messageButton is an anchor, just call native click method.
        messageButton.click();
        await tsCommon.sleep(1000);

        const textArea = _getLinkedInMessageTextParagraph(candidate);
        const sendButton = _getLinkedInMessageSendButton(candidate);

        if (textArea != null && sendButton != null){
            $(textArea).text(message);
           // $(sendButton).click();
            return {messageSent: message, to: candidate.fullName};
        }

        return null;
    }

    const _sendConnectionRequest = async (candidate, message) => {
        if (connectButton == null || connectButton == undefined){
             _getButtonsOnProfilePage();
            if (connectButton == null || connectButton == undefined){
                return null;
            }
        }

        $(connectButton).click();
        await tsCommon.sleep(500);

        const addANoteButton = _getConnectionRequestAddANoteButton();
        if (addANoteButton == null || addANoteButton === undefined){
            return null;
        }

        $(addANoteButton).click();
        await tsCommon.sleep(500);

        const textArea = _getConnectionRequestTextArea();
        if (textArea == null || textArea == undefined){
            return null;
        }

        $(textArea).val(message);
        const donebutton = _getConnectionRequestDoneButton();
        if (donebutton == null || donebutton == undefined){
            return null;
        }

       // $(donebutton).click();
        return {
            messageSent: message,
            to: candidate.fullName
        };
    }

    class LinkedInPublicProfile {
        constructor() {}

        clickPublicProfileLinkOnRecruiter = _clickPublicProfileLinkOnRecruiter;
        sendLinkedInMessage = _sendLinkedInMessage;
        sendConnectionRequest = _sendConnectionRequest;
    }

    window.linkedInPublicProfile = new LinkedInPublicProfile();
})();