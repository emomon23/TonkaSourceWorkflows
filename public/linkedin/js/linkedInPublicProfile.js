(() => {
    const _getMemberId = async () => {
        await tsCommon.sleep(2000);

        const codeElement = tsUICommon.findDomElements('code:contains("urn:li:member:")');
        if (!codeElement){
            return null;
        }

        const jsonString = $(codeElement).text();
        const lookFor = "\"trackingUrn\":\"urn:li:member:";
        
        let startIndex = jsonString.indexOf(lookFor);
        if (startIndex === -1){
            return null;
        }

        startIndex+= lookFor.length;
        const endIndex = jsonString.indexOf("\"", startIndex);
        if (endIndex === -1){
            return null;
        }

        return jsonString.substr(startIndex, endIndex - startIndex);
    }

    const _scrapeFirstAndLastNameFromProfile = () => {
        let element = tsUICommon.findFirstDomElement(['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")']);
        if (element === null){
            return null;
        }

        let wholeName =  $(element).prop("tagName") === "BUTTON" ? $(element).attr('aria-label') : $(element).text();
        ["Connect with ", "Share ", "Save ","’s profile via message", "' profile via message", "profile via message", "'s profile to PDF", "' profile to PDF", "profile to PDF", "Report or block"].forEach((remove) => {
            wholeName = wholeName.split(remove).join('');
        })

        wholeName = wholeName.split(',')[0].trim(); //This will handle "Alan Haggerty, MCEE"
        if (wholeName.indexOf('(') === 0){
            wholeName = wholeName.substr(wholeName.indexOf(' ')); //This will handle "(75) Alan Haggerty"
        }

        const firstAndLast = wholeName.split(' ');
        let result = {}

        if (firstAndLast.length > 1){
            result.firstName = firstAndLast[0];
            firstAndLast.splice(0, 1);
            result.lastName = firstAndLast.join(' ');
        }

        return result;
    }

    const _scrapeProfile = async () => {
        if (linkedInCommon.whatPageAmIOn() !== linkedInConstants.pages.PUBLIC_PROFILE){
            return null;
        }

        const result = {
            memberId: await _getMemberId(),
        }

        const firstAndLast = _scrapeFirstAndLastNameFromProfile();
        if (firstAndLast !== null){
            result.firstName = firstAndLast.firstName;
            result.lastName = firstAndLast.lastName;
        }

        result.linkedInUrl = window.location.href;
        
        return result;
    }

    class LinkedInPublicProfile {
        getMemberId = _getMemberId;
        scrapeProfile = _scrapeProfile;        
    }

    window.linkedInPublicProfile = new LinkedInPublicProfile();

})();
