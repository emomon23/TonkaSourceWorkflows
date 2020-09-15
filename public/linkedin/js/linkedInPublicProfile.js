(() => {
    const _getMemberId = async () => {
        await tsCommon.sleep(2000);

        const codeElement = tsUICommon.findDomElement('code:contains("urn:li:member:")');
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

    const _scrapeProfile = async () => {
        if (window.location.href.indexOf('.com/in/') === -1){
            return null;
        }

        const result = {
            memberId: await _getMemberId(),
        }

        //first and last name
        const name = $('title').text().split('|')[0].trim().split(' ');
        result.firstName = name[0];
        result.lastName = name[1];

        //TO DO: keep going...


        return result;
    }

    class LinkedInPublicProfile {
        getMemberId = _getMemberId;
        scrapeProfile = _scrapeProfile;        
    }

    window.linkedInPublicProfile = new LinkedInPublicProfile();

})();
