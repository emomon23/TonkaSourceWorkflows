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
  
    class TSQueryString {
        constructor (){
            const queryObject = _getQueryStringParameters();
            for(let k in queryObject){
                this[k] = queryObject[k]
            }
        }
    }

    window.tsQueryString = new TSQueryString();
})();