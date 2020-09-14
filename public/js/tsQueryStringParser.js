(() => {
    const _parseQueryString = () => {
        const url = window.location.href;
        if (url.indexOf('?') === -1){
            return {};
        }
    
        const result = {};
        const queryString = url.substr(url.indexOf('?')+1);
        const nameValuePairs = queryString.split('&');
        nameValuePairs.forEach((nameValuePairString) => {
            const nvp = nameValuePairString.split('=');
            if (nvp.length === 2){
                result[nvp[0]] = nvp[1];
            }
        });
    
        return result;
    }

    const _parseLinkedInMemberIdIsPresent = () => {
        //recruiter/profile/16530706,6KCd,CAP?
        const lookFor = 'recruiter/profile/';
        const href = window.location.href;
        let startIndex = window.location.href.indexOf(lookFor);

        if (startIndex > 0){
            startIndex+= lookFor.length;
            const endIndex = href.indexOf('?', startIndex);
            if (endIndex === -1){
                return null;
            }

            let result = href.substr(startIndex, endIndex - startIndex).split(',');
            return result[0];
        }
        else {
            return null;
        }
    }

    const queryParams = _parseQueryString();
    
    const memberId = _parseLinkedInMemberIdIsPresent();
    if (memberId !== null && memberId !== undefined){
        queryParams.memberId = memberId;
    }

    window.tsQueryStringParser = queryParams;
})();
