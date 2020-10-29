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
        const sendButtons = $(linkedInSelectors.inMailDialog.sendButton);
        const subjects = $(linkedInSelectors.inMailDialog.subject);
        const bodies = $(linkedInSelectors.inMailDialog.body);

        if (sendButtons && sendButtons.length){
            return {
                send: sendButtons[0],
                subject: subjects[0],
                body : bodies[0]
            }
        }

        return null;
    }

    const _sendInMail = async (memberId, subject, bodyString) => {
        await tsCommon.sleep(300);

        if (_clickSendInMail(memberId)){
            const sendMessageDialog = await _getSendInmailModalControls();
            $(sendMessageDialog.subject).text(subject);
            $(sendMessageDialog.body).text(bodyString);
            $(sendMessageDialog.send).click();
        }
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

    const _navigateToPageOne = () => {
        return __navigateToPage(linkedInSelectors.projectPipeLinePage.navigationPage1);
    }

    const _getSendInMailMemberIdsForThisProjectPipelinePage = () => {
        const rows = $(linkedInSelectors.projectPipeLinePage.pipelineRows);

        for (let i=0; i<rows.length; i++){
            const rowBtns = $(linkedInSelectors.projectPipeLinePage.sendInMailButtons);
            if (rowBtns && rowBtns.length){
                const isVisible = $(rowBtns[0]).is(':visible');
                const isEnabled = !$(rowBtns[0]).is(':disabled');

                if (isVisible && isEnabled){
                    const memberId = $(rowBtns[i]).attr('data-prospect-id');
                    if (isNaN(memberId)){
                        tsCommon.log(`memberId is not numeric for data-prospect-id as expected.  memberId: ${memberId}`, 'ERROR');
                    }
                    else {
                        const h3 = $(rowBtns[0]).find('h3[class*="name"]')[0];
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

    const _blastCurrentProjectPipelinePage = async(subject, body) => {
        const memberIdsAndNames = _getSendInMailMemberIdsForThisProjectPipelinePage();

        for(let i=0; i<memberIdsAndNames.length; i++) {
            try {
                const memberId = memberIdsAndNames.memberId;

                const msg = _replaceNameOnBody(body, memberIdsAndNames.name);
                _sendInMail(memberId, subject, msg);

                // eslint-disable-next-line no-await-in-loop
                await tsCommon.randomSleep(8000, 12000);
            } catch(e) {
                tsCommon.log(`_blastCurrentProjectPipeline. memberId: ${memberId}.  error: ${e.message}`);
            }
        }
    }

    const _blastProjectPipeline = async(subject, body) => {
        //linkedInSelectors.projectPipeLinePage.navigationNextPage
        let navigationSuccess = _navigateToPageOne();
        while (navigationSuccess){
            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(3000);
            // eslint-disable-next-line no-await-in-loop
            await _blastCurrentProjectPipelinePage(subject, body);
            navigationSuccess = _navigateToNextPage();
        }
    }

    class LinkedInMessageSender {
        constructor() {}

        sendLinkedInMessageOrConnectionRequestToCandidate = _sendLinkedInMessageOrConnectionRequestToCandidate;
        sendInMail = _sendInMail;
        blastProjectPipeline = _blastProjectPipeline;
    }

    window.linkedInMessageSender = new LinkedInMessageSender();
})();