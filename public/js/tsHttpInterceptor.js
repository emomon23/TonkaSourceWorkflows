(function() {
    let __requestIntercepts = [];
    let __responseIntercepts = [];

    let _oldXHROpen = window.XMLHttpRequest.prototype.open;
  
    // eslint-disable-next-line consistent-return
    window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this.addEventListener('load', function() {
            var responseListeners = __responseIntercepts.filter(rl => rl.method === method.toLowerCase() && url.toLowerCase().indexOf(rl.urlContains) >= 0);
            responseListeners.forEach((rl) => {
                if (rl.callBack) {
                    const text = (this.responseType === 'text' || this.responseType === '') ? this.responseText : "";
                    rl.callBack({response: this.response, responseText: text, url: this.responseURL});
                }
            });
        });
        
        const requestListeners = __requestIntercepts.filter(i => i.method.toLowerCase() === method.toLowerCase() && url.toLowerCase().indexOf(i.urlContains.toLowerCase()) >= 0);
        let suppress = false;
        requestListeners.forEach((rl) => {
            suppress = suppress || rl.suppress;
            if (rl.callBack){
                rl.callBack(method, url);
            }
        });

        if (!suppress){
            return _oldXHROpen.apply(this, arguments);
        }
    };


    class TsHttpInterceptor {
        constructor(){}
        
        interceptRequest = (method, urlContains, callBack, suppress=false) => {
            const intercept = {method: method.toLowerCase(), urlContains: urlContains.toLowerCase(), callBack, suppress};
            __requestIntercepts.push(intercept);
        }

        interceptResponse = (method, urlContains, callBack) => {
            const intercept = {method: method.toLowerCase(), urlContains: urlContains.toLowerCase(), callBack, suppress:false};
            __responseIntercepts.push(intercept);
        }

        copyToAnotherWindow = (otherWindow) => {
            if (otherWindow.tsInterceptor === null || otherWindow.tsInterceptor === undefined){
                const interceptor = new TsHttpInterceptor();

                __requestIntercepts.forEach((ri) => {
                    interceptor.interceptRequest(ri.method, ri.urlContains, ri.callBack);
                });

                __responseIntercepts.forEach((ri) => {
                    interceptor.interceptResponse(ri.method, ri.urlContains, ri.callBack);
                });

                otherWindow.tsInterceptor = interceptor;
            }
        }
    }

    window.tsInterceptor = new TsHttpInterceptor();
})();