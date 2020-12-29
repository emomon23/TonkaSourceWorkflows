(() => {
    const _createContactSelected = async (candidate, phoneNumber) => {
        let copyText = `${candidate.firstName}  ${candidate.lastName}`;
        if (phoneNumber){
            copyText += phoneNumber;
        }

        await tsCommon.sleep(100);
        await tsUICommon.copyToClipboard(copyText);

        const url = "https://contacts.google.com/?hl=en&tab=cC";
        window.open(url);
    }

    const _showPhoneNumberSelected = (candidate) => {
        // eslint-disable-next-line no-alert
        alert(`${candidate.firstName } ${candidate.lastName} ${candidate.phone || candidate.phoneNumber}`);
    }

    const _emailCandidateSelected = async (candidate) => {
        const email = candidate.email;
        await tsUICommon.copyToClipboard(email);
        const emailWindow = window.open("https://mail.google.com/mail/u/0/#inbox?compose=new");

    }

    const _scheduleCallSelected = async (candidate, phoneNumber) => {
        let copyText = `${candidate.firstName}  ${candidate.lastName}`;
        if (phoneNumber){
            copyText += phoneNumber;
        }

        await tsCommon.sleep(100);
        await tsUICommon.copyToClipboard(copyText);

        const url = "https://calendar.google.com/calendar/u/0/r?tab=mc";
        window.open(url);

    }

    const _savePhoneNumberSelected = async (candidate, phoneNumberHighlighted) => {
        let phoneNumber = phoneNumberHighlighted;
        if (!phoneNumber){
            // eslint-disable-next-line no-alert
            phoneNumber = window.prompt(`Enter phone number for ${candidate.firstName}`);
        }

        if (phoneNumber && phoneNumber.length > 6){
            candidate.phone = phoneNumber;
            candidateController.saveCandidate(candidate);
        }
    }

    const _saveEmailSelected = async (candidate) => {
        // eslint-disable-next-line no-alert
        const email = window.prompt(`Enter phone number for ${candidate.firstName}`);

        if (email && _validateEmail(email)){
            candidate.email = email;
            candidateController.saveCandidate(candidate);
        }
    }

    const _scrapeContactInfoSelected = async (candidate) => {
        await linkedInContactInfoScraper.scrapeContactInfo(candidate);
    }

    const _recordCorrespondenceSelected = async (candidate) => {
        // eslint-disable-next-line no-alert
        const note = window.prompt("Correspondence Note?");
        const correspondence = {
            candidate,
            text: note,
            type: 'other',
            recordCorrespondence: true
        }

        await connectionLifeCycleLogic.recordCorrespondence(correspondence);
    }

    const _getRecordCorrespondenceMenuItem = (menuItemToShow) => {
        return menuItemToShow.indexOf('r') >= 0 ? '[R]ecord correspondence\n' : '';
    }

    const _getCreateContactMenuItem = (menuItemToShow) => {
        return menuItemToShow.indexOf('c') >= 0 ? '[C]reate contact\n' : '';
    }

    const _getScheduleCallMenuItem = (menuItemToShow) => {
        return menuItemToShow.indexOf('s') >= 0 ? '[S]chedule call\n' : '';
    }

    const _getSavePhoneNumberMenuItem = (menuItemToShow) => {
        return menuItemToShow.indexOf('p') >= 0 ? 'Save [P]hone\n' : '';
    }

    const _getSaveEmailMenuItem = (menuItemToShow) => {
        return menuItemToShow.indexOf('p') >= 0 ? 'Save E[M]ail\n' : '';
    }

    const _getScrapeContactInfoMenuItem = (menuItemToShow) => {
        return menuItemToShow.indexOf('i') >= 0 ? 'Scrape contact [I]nfo\n' : '';
    }

    const _getEmailContactMenuItem = (menuItemToShow) => {
        return menuItemToShow.indexOf('e') >= 0 ? '[E]mail contact\n' : '';
    }

    const _getShowPhoneNumberMenuItem = (menuItemToShow) => {
        return menuItemToShow.indexOf('n') >= 0 ? 'Show Pho[N]e number\n' : '';
    }

    const _drawLine = () => {
        let result = '';
        for (let i = 0; i < 60; i++){
            result += '-';
        }

        result += '\n\n';
        return result;
    }

    const _validateChoice = (choice) => {
        const lCase = choice.toLowerCase().trim();
        if (lCase.length !== 1 ||  'rcspienm'.indexOf(lCase) === -1){
            // eslint-disable-next-line no-alert
            alert("Invalid Selection");
            return false;
        }

        return true;
    }

    const _validateEmail = (email) => {
        const indexOfAt = email.indexOf('@');
        const lastIndexOf = email.lastIndexOf('.');

        const isValid = indexOfAt > 0 && lastIndexOf > indexOfAt;
        if (!isValid){
            // eslint-disable-next-line no-alert
            alert("Invalid email");
        }

        return isValid;
    }

    const _showPopup = async (candidateSearch, menuItemsToShow, phoneNumber = null) => {
        const candidate = await candidateController.searchForCandidate(candidateSearch);
        const lCaseMenuItemsToShow = menuItemsToShow.toLowerCase();
        let promptMessage = `${candidate.firstName} ${candidate.lastName}\n`;

        promptMessage += _drawLine();
        promptMessage += _getEmailContactMenuItem(lCaseMenuItemsToShow);
        promptMessage += _getRecordCorrespondenceMenuItem(lCaseMenuItemsToShow);
        promptMessage += _getScheduleCallMenuItem(lCaseMenuItemsToShow);
        promptMessage += _getCreateContactMenuItem(lCaseMenuItemsToShow);
        promptMessage += _getScrapeContactInfoMenuItem(lCaseMenuItemsToShow);
        promptMessage += _getSavePhoneNumberMenuItem(lCaseMenuItemsToShow);
        promptMessage += _getSaveEmailMenuItem(lCaseMenuItemsToShow);
        promptMessage += _getShowPhoneNumberMenuItem(lCaseMenuItemsToShow);

        // eslint-disable-next-line no-alert
        const choice = window.prompt(promptMessage);
        if (choice && _validateChoice(choice)){
            switch (choice.toLowerCase()){
                case 'c' : // [C]reate contact
                    _createContactSelected(candidate, phoneNumber);
                    break;
                case 's' : // [S]chedule call
                    _scheduleCallSelected(candidate, phoneNumber);
                    break;
                case 'p' : // save [P]hone number
                    _savePhoneNumberSelected(candidate, phoneNumber);
                    break;
                case 'i' : // scrape contact [I]nfo
                    _scrapeContactInfoSelected(candidate);
                    break;
                case 'r' : // record [C]orrespondence
                    _recordCorrespondenceSelected(candidate);
                    break;
                case 'e' : // email
                    _emailCandidateSelected(candidate);
                    break;
                case 'm' : // save email
                    _saveEmailSelected(candidate);
                    break;
                case 'n' : // show phone #
                    _showPhoneNumberSelected(candidate);
                    break;
            }
        }
    }
    class TSPopup {
       showPopup = _showPopup;
    }

    window.tsPopup = new TSPopup();
})();