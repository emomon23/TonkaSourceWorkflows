(() => {

    const _scrapeEmailAddressFromPublicProfile = (container) => {
        const emailSection = $(container).find(linkedInSelectors.contactInfoPage.EMAIL_SECTION);
        return $(emailSection).find('a').text().trim();
    }

    const _scrapePhoneNumberFromPublicProfile = (container) => {
        const phoneSection = $(container).find(linkedInSelectors.contactInfoPage.PHONE_SECTION);
        return $(phoneSection).find('span').first().text().trim();
    }

    const _scrapeContactInfoFromPublicSide = async (candidate, windowRef = null) => {
        let result = false;

        try {
            if (windowRef === null){
                windowRef = window;
            }

            const candidateProfile =  await windowRef.linkedInPublicProfileScraper.scrapeProfile();
            if (candidateProfile.firstName !== candidate.firstName && candidateProfile.lastName !== candidate.lastName){
                return false;
            }

            candidate.isContactInfoScraped = true;

            const contactInfoLink = $(windowRef.document).find(linkedInSelectors.publicProfilePage.CONTACT_INFO_LINK)[0];
            if (!contactInfoLink){
                return false;
            }

            contactInfoLink[0].click();

            await tsCommon.waitTilTrue(() => {
                $(windowRef.document).find(linkedInSelectors.contactInfoPage.CONTACT_INFO_CONTAINER) ? true : false;
            }, 5000);

            const contactInfoContainer = $(windowRef.document).find(linkedInSelectors.contactInfoPage.CONTACT_INFO_CONTAINER)[0];

            if (contactInfoContainer) {
                const phoneNumber =  _scrapePhoneNumberFromPublicProfile(contactInfoContainer[0]);
                const email = _scrapeEmailAddressFromPublicProfile(contactInfoContainer[0]);
                if (phoneNumber && candidate.phone !== phoneNumber){
                    // Don't override an existing phone number with a scraped number
                    const key = candidate.phone ? 'phone2Scraped' : 'phone';
                    candidate[key] = phoneNumber;
                    candidate.phoneWasScrapped = true;
                    result = true;
                }

                if (email && candidate.email !== email){
                    const key = candidate.email ? 'email2Scraped' : 'email';
                    candidate[key] = email;
                    candidate.emailWasScrapped = true;
                    result = true;
                }
            } else {
                tsCommon.log("Contact Info Scraper: Could not find contact info container", "WARN");
            }

            $(linkedInSelectors.contactInfoPage.CLOSE).click();
        } catch (e) {
            tsCommon.log(e.message, 'WARN');
        }

        return result;
    }

    const _getRecruiterProfileContactInfoDialog = async (windowRef) => {
        return $(windowRef['document']).find('#dialog')[0];
    }

    const _scrapeContactInfoFromRecruiterProfile = async (windowRef) => {
        let dialog = await _getRecruiterProfileContactInfoDialog(windowRef);
        if (!dialog){
            const contactInfoBtn = $(windowRef['document']).find('button[data-lira-action*="edit-contact-info"]')[0];
            if (!contactInfoBtn){
                return null;
            }

            contactInfoBtn.click();
            await tsCommon.sleep(2000);
            dialog = _getRecruiterProfileContactInfoDialog(windowRef);
        }

        if (!dialog){
            return null;
        }

        const dialogText = $(dialog).text();
        const emails = tsString.extractEmailAddresses(dialogText);
        const phoneNumbers = tsString.extractPhoneNumbers(dialogText);

        return {
            emails,
            phoneNumbers
        }
    }

    const _getProfileWindow = async (candidate) => {
        const whatPageAmIOn = linkedInCommon.whatPageAmIOn();
        const pages = linkedInConstants.pages;
        let result = {
            linkedInSide : 'PUBLIC',
            profileWindow: null
        }

        let selector = null;
        switch (whatPageAmIOn){
            case pages.RECRUITER_SEARCH_RESULTS :
                result.linkedInSide = 'RECRUITER';
                selector = `li[id*="search-result-${candidate.memberId}"] h3 a[href*="profile/"]`;
                break;
            case pages.RECRUITER_PROFILE :
                result.linkedInSide = 'RECRUITER';
                result.profileWindow = window;
                break;
            case pages.RECRUITER_INMAIL :
                selector = 'a[class*="participant-name"]';
                result.linkedInSide = 'RECRUITER';
                break;
            case pages.PUBLIC_PROFILE :
                if (window.location.href === candidate.linkedIn){
                    result.profileWindow = window;
                }
                else {
                    selector = $(`h4 a span:contains("${candidate.firstName}"):contains("${candidate.lastName}")`)[0];
                    selector = selector ? $(selector).parent() : '';
                }
                break;
            case pages.PROJECT_PIPELINE :
                selector = `h3[title*="${candidate.firstName}"] a:contains("${candidate.lastName}")`;
                break;
        }

        let href = '';
        if (selector){
            let link = $(selector)[0];
            if (link){
                href = $(link).attr('href');
                if (href && href.length > 0){
                    href = href.indexOf("linkedin.com") >= 0 ? href : `https:www.linkedin.com${href}`
                }
            }
        }

        if (href.length > 0){
            result.profileWindow = window.open(href);
            await tsCommon.sleep(5000);
        }

        return result;
    }

    const _scrapeContactInfo = async (candidateSearch) => {
        let candidate = candidateSearch;
        if (!candidate.memberId) {
            candidate = candidateController.searchForCandidate(candidateSearch);
        }

        if (!candidate){
            return;
        }

        const profileWindowResult = await _getProfileWindow(candidate);

        if (profileWindowResult && profileWindowResult.profileWindow){
            const profileWindow = await profileWindowResult.profileWindow;
            try {
                let isDirty = false;
                if (profileWindowResult.linkedInSide === "RECRUITER"){
                    isDirty = await _scrapeContactInfoFromRecruiterProfile(candidate, profileWindow);
                }
                else {
                    isDirty = await _scrapeContactInfoFromPublicSide(candidate, profileWindow);
                }

                if (isDirty){
                    await candidateController.saveCandidate(candidate);
                }
            }
            catch (e) {
                tsCommon.logError(e, '_scrapeContactInfo');
            }
            finally {
                if (profileWindow){
                    profileWindow.close();
                }
            }
        }

    }

    class LinkedInContactInfoScraper {
        scrapeContactInfo = _scrapeContactInfo;
        scrapeContactInfoFromRecruiterProfile = _scrapeContactInfoFromRecruiterProfile;
    }

    window.linkedInContactInfoScraper = new LinkedInContactInfoScraper();
})();