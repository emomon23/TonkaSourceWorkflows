(function () {
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

            const candidate = await candidateRepository.searchForCandidate(memberIdOrFirstNameAndLastName);

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
                        // linkedInMessageSpy should pick up that a message was sent
                    }
                    else {
                        await _sendConnectionRequest(publicProfileWindow, connectionRequestToSend);
                        linkedInApp.recordConnectionRequestMade(memberIdOrFirstNameAndLastName, connectionRequestToSend);
                    }


                }
            }
    }

    const _getSendInMailButton = (memberId) => {
        const whatPageAmIOn = linkedInCommon.whatPageAmIOn();
        let queryResult = null;

        if (whatPageAmIOn === linkedInConstants.pages.PROJECT_PIPELINE){
            queryResult = $(`#${linkedInSelectors.projectPipeLinePage.sendInMailButton}-${memberId}`);


        } else if (whatPageAmIOn === linkedInConstants.pages.RECRUITER_SEARCH_RESULTS){
            queryResult = $(`#search-results-${memberId}`).find(linkedInSelectors.sendInMail);
        }

        return  queryResult && queryResult.length ? queryResult[0] : null;
    }

    const _clickSendInMail = (memberId) => {
        const sendInMailButton = _getSendInMailButton(memberId);
        if (sendInMailButton){
            const isVisible = $(sendInMailButton).is(':visible');
            const isEnabled = !$(sendInMailButton).is(':disabled');

            if (isVisible && isEnabled){
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

        return {
            send,
            subject,
            body,
            closeModal
        };
    }

    const _sendInMail = async (memberId, subject, bodyString) => {
        await tsCommon.sleep(300);

        if (_clickSendInMail(memberId)){
            await tsCommon.sleep(4000);
            const sendMessageDialog = await _getSendInmailModalControls();
            if (sendMessageDialog.subject){
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
        return __navigateToPage(linkedInSelectors.projectPipeLinePage.navigation);
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

    const _blastCurrentProjectPipelinePage = async (subject, body) => {
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

    class LinkedInMessageSender {
        constructor () {}

        sendLinkedInMessageOrConnectionRequestToCandidate = _sendLinkedInMessageOrConnectionRequestToCandidate;
        sendInMail = _sendInMail;
        blastProjectPipeline = _blastProjectPipeline;
    }

    window.linkedInMessageSender = new LinkedInMessageSender();
})();