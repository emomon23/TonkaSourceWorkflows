(() => {
    const _delayCallingSetupSpy = async () => {
        await tsCommon.sleep(1500);
        correspondenceCommon.setupSpy(document, _scrapeActiveInmailContactFromUi);
    }

    const _bindToConversationItems = async () => {
        let conversationLinks = await tsUICommon.jQueryWait('a[class*="conversation-link"]');

        await tsCommon.sleep(200);
        $(conversationLinks).click(() => {
            _delayCallingSetupSpy();
        });

    }

    const _scrapeConnectionIdentifiers = async () => {
        const nameElement = $('div[class*="participant-meta"] h3[class*="name"] a[class*="participant-name"]')[0];
        const headlineElement = $('div[class*="participant-meta"] p[class*="headline"]')[0];
        const imageElement = $('div[class*="participant-profile"] div[class*="basic-info"] img')[0];

        if (!(nameElement && (headlineElement || imageElement))) {
            return null;
        }

        const nameParts = $(nameElement).text().trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const headline = headlineElement ? $(headlineElement).text().trim() : '';
        const imageUrl = imageElement ? $(imageElement).attr('src') : '';

        return {
            firstName,
            lastName,
            headline,
            imageUrl
        }
    }

    const _scrapeActiveInmailContactFromUi = async () => {
        const candidate = await _scrapeConnectionIdentifiers();
        const sendButton = $('article button[class*="submit-message"][type="submit"]')[0]
        const buttonsContainer = $('article p[class*="headline"]')[0];
        const textArea = $('article textarea[name*="message"]')[0]

        return {
            candidate,
            sendButton,
            textArea,
            header: buttonsContainer,
            type: 'recruiter-im'
        }
    }

    const _delayDocReady = async () => {
        await tsCommon.sleep(1000);
        correspondenceCommon.setupSpy(document, _scrapeActiveInmailContactFromUi, _scrapeConnectionIdentifiers)
        await _bindToConversationItems();
        linkedInApp.showTsReady();
    }

    $(document).ready(() => {
        _currentPage = linkedInCommon.whatPageAmIOn();

        if (_currentPage === linkedInConstants.pages.RECRUITER_INMAIL){
            _delayDocReady();
        }
    });
})();