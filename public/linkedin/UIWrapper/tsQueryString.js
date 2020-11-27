(function () {
    const _getQueryStringParameters = () => {
        const url = window.location.href;
        if (url.indexOf('?') === -1){
            return {};
        }

        const result = {};
        const queryString = url.substr(url.indexOf('?') + 1);
        const nameValuePairs = queryString.split('&');
        nameValuePairs.forEach((nameValuePairString) => {
            const nvp = nameValuePairString.split('=');
            if (nvp.length === 2){
                result[nvp[0]] = nvp[1];
            }
        });

        return result;
    }

    const _getUrlPath = () => {
        let url = window.location.href
        const toIndex = url.indexOf('?');
       if (toIndex > 0){
           url = url.substr(0, toIndex)
       }

       const parts = url.split('/');
       return parts.filter(p => p.indexOf('linkedin.com') === -1);
    }

    class TSQueryString {
        constructor (){
            const queryObject = _getQueryStringParameters();
            for(let k in queryObject){
                this[k] = queryObject[k]
            }
            this.urlPath = _getUrlPath();
        }
    }

    window.tsQueryString = new TSQueryString();
})();