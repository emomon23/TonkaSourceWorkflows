(function () {
    const SAVE_COMPANY_DATA_CONFIG = 'tsCompanyLogic.saveCompanyData';

    const _advanceToNextLinkedInResultPage = () => {
        const nextButton = $(`a[class*="page-link"][title*="Next Page"] span`)[0];
        if (nextButton){
            tsCommon.log("advancing to the next page");
            nextButton.click();
            return true;
        }

        return false;
    }

    const _callAlisonHookWindow = async (actionString, data) => {
        await window.launchTonkaSource();
        await tsCommon.sleep(3000);

        if (window.alisonHookWindow){
            try {
                const jsonData = JSON.stringify(data);
                tsCommon.postMessageToWindow(window.alisonHookWindow, actionString, jsonData);
            }
            catch(postError) {
                tsCommon.log(`Error posting message to alison hook (check pop up blocker?). ${e.message}.  (${e})`, 'ERROR');
            }
        }
        else {
            tsCommon.log("Unable to 'postMessage', no reference to alisonHookWindow exists (run launchTonkaSource()? Check Pop up blocker?)");
        }
    }

    const _checkIfCompanyAnalyticsIsTurnedOn = () => {
        const saveCompanyData = tsConfig.get(SAVE_COMPANY_DATA_CONFIG);
        return saveCompanyData === true
        || (
            typeof saveCompanyData === "string" &&
            (
                saveCompanyData.toLowerCase() === 'true'
                || saveCompanyData.toLowerCase() === 'on'
            )
        )
    }

    const _displayGrade = (label, element, gradeObj, attrs = []) => {
        if (gradeObj) {
            const grade = gradeObj.grade;
            const gpa = gradeObj.gpa;

            const container = $(document.createElement('div'))
                            .attr('class', 'grade-container tooltip');

            // Add additional attributes to the container
            attrs.forEach(attr => $(container).attr(attr.name, attr.value))

            if (gpa >= gradeUtil.getGpa('B-')) {
                $(container).addClass('green');
            } else {
                $(container).addClass('red');
            }
            // Append superscript J ... Cuz it looks cool
            $(container).append($(document.createElement('div')).text(label).attr('class','grade-label'));
            // Append the grade
            $(container).append($(document.createElement('div')).text(grade).attr('class', 'grade'));

            $(element).append(container);
        }
    }

    const _getRoleName = (roleName) => {
        if (linkedInConstants.roles[roleName.toUpperCase()]) {
            return linkedInConstants.roles[roleName.toUpperCase()];
        } else {
            tsCommon.log({
                message: "Role Not Defined",
                roles: linkedInConstants.roles
            }, "WARN");
        }
        return null;
    }

    const _isRecruiterPage = () => {
        const currentPage  = _whatPageAmIOn();
        const recruiterPages = linkedInConstants.RECRUITER_PAGES

        if (recruiterPages.indexOf(currentPage) !== -1) {
            return true;
        }
        return false;
    }

    const _whatPageAmIOn = () => {
        const href = window.location.href.toLowerCase();
        let result = null;

        if (href === "https://www.linkedin.com/" || href === "https://www.linkedin.com"){
            return linkedInConstants.pages.LOGIN;
        }

        for(let key in linkedInConstants.pages){
           let pageConst = linkedInConstants.pages[key];
           if (href.indexOf(pageConst) >= 0){
               result = pageConst;
               break;
           }
        }

        if (!result){
            tsCommon.log(`whatPageAmIOn = null (href: ${href})`);
        }

        return result;
    }

    const _parseJobDurationDateRangeString = (text) => {
        try {
            const dateParts = text.split('–').map(d => d.trim());
            const startDate = new Date(dateParts[0]);

            const result = {
                startDateMonth: startDate.getMonth() + 1,
                startDateYear: startDate.getFullYear()
            }

            if (dateParts[1].toLowerCase().indexOf('present') === -1){
                const endDate = new Date(dateParts[1]);
                result.endDateMonth = endDate.getMonth() + 1;
                result.endDateYear = endDate.getFullYear();
            }

            return result;
        } catch (e) {
            return null;
        }
    }

    class LinkedInCommon {
        constructor () {}

        advanceToNextLinkedInResultPage = _advanceToNextLinkedInResultPage;
        callAlisonHookWindow = _callAlisonHookWindow;
        checkIfCompanyAnalyticsIsTurnedOn = _checkIfCompanyAnalyticsIsTurnedOn;
        displayGrade = _displayGrade;
        getRoleName = _getRoleName;
        isRecruiterPage = _isRecruiterPage;
        parseJobDurationDateRangeString = _parseJobDurationDateRangeString;
        whatPageAmIOn = _whatPageAmIOn;
    }

    window.linkedInCommon = new LinkedInCommon();
})();