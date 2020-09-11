(function() {
    let __requestIntercepts = [];
    let __responseIntercepts = [];

    let _oldXHROpen = window.XMLHttpRequest.prototype.open;
  
    window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this.addEventListener('load', function() {
            var responseListeners = __responseIntercepts.filter(rl => rl.method === method.toLowerCase() && url.toLowerCase().indexOf(rl.urlContains) >= 0);
            responseListeners.forEach((rl) => {
                if (rl.callBack) {
                    rl.callBack({response: this.response, responseText: this.responseText, url: this.responseURL});
                }
            });
        });
        
        const requestListeners = __requestIntercepts.filter(i => i.method.toLowerCase() === method.toLowerCase() && url.toLowerCase().indexOf(i.urlContains.toLowerCase()) >= 0);
        requestListeners.forEach((rl) => {
            rl.callBack(method, url);
        });

        return _oldXHROpen.apply(this, arguments);
    };


    class TsHttpInterceptor {
        constructor(){}
        
        interceptRequest = (method, urlContains, callBack) => {
            const intercept = {method: method.toLowerCase(), urlContains: urlContains.toLowerCase(), callBack};
            __requestIntercepts.push(intercept);
        }

        interceptResponse = (method, urlContains, callBack) => {
            const intercept = {method: method.toLowerCase(), urlContains: urlContains.toLowerCase(), callBack};
            __responseIntercepts.push(intercept);
        }

        copyToAnotherWindow = (otherWindow) => {
            if (otherWindow.tsInterceptor == null || otherWindow.tsInterceptor == undefined){
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