(function () {
    const _getPublicProfile_MessageButtonSelector = (publicProfileWindow) => {
        let linkButton = publicProfileWindow.document.querySelector('button[aria-label*="Connect with"]');

        if (!linkButton){
            // Attempt to get the 'Connect' button, under the elipsis
            linkButton = $('div[class*="pv-s-profile-actions__overflow"] li-icon[type*="connect-icon"]')[0];
        }

        if (linkButton){
            return {
                type: 'CONNECTION REQUEST',
                clickable: linkButton
            }
        }

        linkButton = tsCommon.findAHyperLink('/messaging/thread/', publicProfileWindow.document);
        if (linkButton){
            return {
                type: 'MESSAGE',
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

    const _recordConnectionRequestLocally = async (messageToSend, candidate) => {
        await connectionLifeCycleLogic.saveConnectionRequest(messageToSend, candidate);
    }

    const _submitConnectionRequestForm = async (publicProfileWindow, messageToSend) => {
        const emailPromptBlock = $('label:contains("verify this member knows you")');
        if (emailPromptBlock.length > 0){
            return false;
        }

        publicProfileWindow.document.querySelector('button[aria-label*="Add a note"]').click();
        await tsCommon.sleep(800);

        $(publicProfileWindow.document).find('[name*="message"]').focus();
        publicProfileWindow.document.execCommand('insertText', true, messageToSend);

        await tsCommon.sleep(500);
        $(publicProfileWindow.document).find('button[aria-label*="Send now"]')[0].click();
        await tsCommon.sleep(100);
        return true;
    }

    const _navigateToPublicProfilePage = async (candidate) => {
        const href = `https://www.linkedin.com${candidate.linkedInRecruiterUrl}`;
        const publicProfileWindow = window.open(href);

        const contactInfo = await linkedInContactInfoScraper.scrapeContactInfoFromRecruiterProfile(candidate, publicProfileWindow);
        await candidateController.saveContactInfo(candidate, contactInfo);

        await tsCommon.sleep(5000);
        tsCommon.navigateToHyperLink(".com/in", publicProfileWindow);

        await tsCommon.sleep(5000);
        return publicProfileWindow;
    }

    const _processAnyTemplateText = (candidate, messageTemplate) => {
        let message = messageTemplate.split('[firstName]').join(candidate.firstName);
        message = message.split('firstName').join(candidate.firstName);
        message = message.split('[first-name]').join(candidate.firstName);

        message = message.split('[lastName]').join(candidate.lastName);
        message = message.split('lastName').join(candidate.lastName);
        message = message.split('[last-name]').join(candidate.lastName);

        return message;
    }

    const _sendConnectionRequest = async (memberId, noteToSend) => {
        const candidate = await candidateController.getCandidate(memberId);
        if (candidate){
            const messageToSend = _processAnyTemplateText(candidate, noteToSend);
            publicProfileWindow = await _navigateToPublicProfilePage(candidate);

            await tsCommon.sleep(3000);

            const whatButtonIsAvailable = _getPublicProfile_MessageButtonSelector(publicProfileWindow);
            if (whatButtonIsAvailable && whatButtonIsAvailable.type === 'CONNECTION REQUEST'){
                whatButtonIsAvailable.clickable.click();
                await tsCommon.sleep(5000);
                const crSubmitted = await _submitConnectionRequestForm(publicProfileWindow, messageToSend);
                if (crSubmitted){
                    await _recordConnectionRequestLocally(noteToSend, candidate);
                }
            }

            await tsCommon.sleep(2000);
            publicProfileWindow.close();
        }
    }

    const _getSendInMailButton = (memberId) => {
        const whatPageAmIOn = linkedInCommon.whatPageAmIOn();
        let queryResult = null;

        if (whatPageAmIOn === linkedInConstants.pages.PROJECT_PIPELINE){
            queryResult = $(`#${linkedInSelectors.projectPipeLinePage.sendInMailButton}-${memberId}`);


        } else if (whatPageAmIOn === linkedInConstants.pages.RECRUITER_SEARCH_RESULTS){
            queryResult = $(`#search-results-${memberId}`).find(linkedInSelectors.sendInMail);
        } else if (whatPageAmIOn === linkedInConstants.pages.CLIP_BOARD){
            queryResult = document.querySelectorAll(`li[id*="${memberId}"] button[data-action*="inmail"]`);
        }

        return  queryResult && queryResult.length ? queryResult[0] : null;
    }

    const _clickSendInMail = (memberId) => {
        const sendInMailButton = _getSendInMailButton(memberId);
        if (sendInMailButton){
            const amOnClipBoard = linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.CLIP_BOARD;
            const isVisible = $(sendInMailButton).is(':visible');
            const isEnabled = !$(sendInMailButton).is(':disabled');

            if (isVisible && isEnabled || (isEnabled && amOnClipBoard)){
                sendInMailButton.click();
                return true;
            }
        }

        return false;
    }

    const _getSendInmailModalControls = async () => {
        tsCommon.sleep(800);
        const send = $(linkedInSelectors.inMailDialog.sendButton)[0];
        const subject = $(linkedInSelectors.inMailDialog.subject)[0];
        const body = $(linkedInSelectors.inMailDialog.body)[0];
        const closeModal = $(linkedInSelectors.inMailDialog.sendInMailCloseModal)[0];
        let salutation = document.getElementsByName('salutation');

        return {
            send,
            subject,
            body,
            closeModal,
            salutation,

            emptySalutationDropdown: async () => {
                try {
                    if (salutation && salutation.length){
                        salutation = salutation[0];
                        $(salutation).attr('data-artdeco-is-focused', true);
                        $(salutation).val(0);

                    }
                    else {
                        try {
                            document.querySelectorAll('button[class*="inmail-salutations-trigger"]')[0].click();
                            await tsCommon.sleep(100);
                            document.querySelectorAll('li[data-salutation-id*="0"]')[0].click();
                        }
                        // eslint-disable-next-line no-empty
                        catch {}
                    }
                }
                // eslint-disable-next-line no-empty
                catch {}
           }
        };
    }

    const _sendInMail = async (memberId, subject, bodyString) => {
        await tsCommon.sleep(300);

        if (_clickSendInMail(memberId)){
            await tsCommon.sleep(4000);
            const sendMessageDialog = await _getSendInmailModalControls();
            if (sendMessageDialog.subject){
                await sendMessageDialog.emptySalutationDropdown();

                $(sendMessageDialog.subject).val(subject);
                $(sendMessageDialog.body).val(bodyString);
                await tsCommon.sleep(2000);
                $(sendMessageDialog.send).click();
                await tsCommon.sleep(4000);

                return true;
            }
        }

        return false;
    }

    const __navigateToPage = (selector) => {
        if (!selector){
            tsCommon.log('Error in __navigateToPage, no selector parameter provided!', 'ERR');
            return false;
        }

        try {
            const pageOneButton = $(selector)[0];
            if (pageOneButton){
                pageOneButton.click();
                return true;
            }

            return false;
        }catch (e) {
            console.log(`Error in _navigateToPageOne. ${e.message}`);
            return false;
        }
    }

    const _navigateToNextPage = () => {
        return __navigateToPage(linkedInSelectors.projectPipeLinePage.navigationNextPage);
    }

    const _getSendInMailMemberIdsForThisProjectPipelinePage = () => {
        const rows = $(linkedInSelectors.projectPipeLinePage.pipelineRows);
        const result = [];

        for (let i = 0; i < rows.length; i++){
            const rowBtns = $(linkedInSelectors.projectPipeLinePage.sendInMailButtons);
            if (rowBtns && rowBtns.length){
                const isVisible = $(rowBtns[i]).is(':visible');
                const isEnabled = !$(rowBtns[i]).is(':disabled');

                if (isVisible && isEnabled){
                    const memberId = $(rowBtns[i]).attr('data-prospect-id');
                    if (isNaN(memberId)){
                        tsCommon.log(`memberId is not numeric for data-prospect-id as expected.  memberId: ${memberId}`, 'ERROR');
                    }
                    else {
                        const h3 = $(rows[i]).find('h3[class*="name"]')[0];
                        let name = '';
                        if (h3){
                            name = $(h3).attr('title');
                        }
                        result.push({memberId, name});
                    }
                }
            }
        }

        return result;
    }

    const _replaceNameOnBody = (body, name) => {
        const flName = name ? name.split(' ') : null;
        if (flName){
            const firstName = flName[0];
            let result = body;
            regExArray = [/\[firstname\]/gi, /\[first_name\]/gi, /\[first-name\]/gi];

            regExArray.forEach((regEx) => {
                result = result.replace(regEx, firstName);
            });

            return result;
        }

        return null;
    }

    const _blastCurrentProjectPipelinePage = async (sub, body) => {
        const whatPageAmIOn = linkedInCommon.whatPageAmIOn();
        if (whatPageAmIOn !== linkedInConstants.pages.PROJECT_PIPELINE){
            console.log("*** CAN'T Blast pipline from this page");
            return;
        }

        const memberIdsAndNames = _getSendInMailMemberIdsForThisProjectPipelinePage();
        const count = memberIdsAndNames ? memberIdsAndNames.length : 0;

        console.log(`There are ${count} candidates on this pipeline page to send blasts to`);

        for(let i = 0; i < memberIdsAndNames.length; i++) {
            try {
                const memberId = memberIdsAndNames[i].memberId;
                const name = memberIdsAndNames[i].name;

                const msg = _replaceNameOnBody(body, name);
                const subject = _replaceNameOnBody(sub, name);

                // eslint-disable-next-line no-await-in-loop
                if (await _sendInMail(memberId, subject, msg)){
                    console.log(`sent in mail to ${name}`);
                }

                // eslint-disable-next-line no-await-in-loop
                await tsCommon.randomSleep(8000, 12000);

            } catch(e) {
                tsCommon.log(`_blastCurrentProjectPipeline. memberId: ${memberId}.  error: ${e.message}`);
            }
        }
    }

    const _blastProjectPipeline = async (subject, body) => {

        let navigationSuccess = true;
        while (navigationSuccess){
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(3000);
            // eslint-disable-next-line no-await-in-loop
            await _blastCurrentProjectPipelinePage(subject, body);
            navigationSuccess = _navigateToNextPage();
        }

        console.log(`DONE - Blasting Project Pipeline`);
    }

    const _blastClipBoardPage = async (subject, body) => {
        const memberIds = await linkedInSearchResultsScraper.getCurrentSearchResultsPageListOfMemberIds();

       for (let i = 0; i < memberIds.length; i++){
            const memberId = memberIds[i];
            // eslint-disable-next-line no-await-in-loop
            const candidate = await candidateController.getCandidate(memberId);

            if (candidate){
                const msg = _replaceNameOnBody(body, candidate.firstName);

                // eslint-disable-next-line no-await-in-loop
                if (await _sendInMail(memberId, subject, msg)){
                    console.log(`sent in mail to ${candidate.firstName}`);
                }

                // eslint-disable-next-line no-await-in-loop
                await tsCommon.randomSleep(8000, 12000);
            }
        }
    }

    const  _blastClipBoard = async (subject, body) => {
        let navigationSuccess = true;
        while (navigationSuccess){
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(3000);
            // eslint-disable-next-line no-await-in-loop
            await _blastClipBoardPage(subject, body);
            navigationSuccess = _navigateToNextPage();
        }

        console.log(`DONE - Blasting Clipboard`);
    }

    const _blastInMails = async (subject, body) => {
        const pgs =  linkedInConstants.pages;

        const whatPageAmIOn = linkedInCommon.whatPageAmIOn();
        let queryResult = null;

        if (whatPageAmIOn === pgs.PROJECT_PIPELINE || whatPageAmIOn === pgs.RECRUITER_SEARCH_RESULTS){
            await _blastProjectPipeline(subject, body);
        }
        else if (whatPageAmIOn === pgs.CLIP_BOARD){
            await _blastClipBoard(subject, body);
        }
    }

    class LinkedInMessageSender {
        constructor () {}

        sendInMail = _sendInMail;
        sendConnectionRequest = _sendConnectionRequest;
        blastInMails = _blastInMails;
    }

    window.linkedInMessageSender = new LinkedInMessageSender();
})();