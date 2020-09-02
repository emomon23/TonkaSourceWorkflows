(function() {
    const _log = (message) => {
        console.log("  " + message);
    }

    const _sleep = (ms) => {
        _log("Sleeping for " + ms + "ms");
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const _randomSleep = (min, max) => {
        const ms = Math.floor(Math.random() * (max - min) ) + min;
        return _sleep(ms);
    }

    const _extendWebElements = (webElements) => {
        webElements.forEach((we) => {_extendWebElement(we);});
    }

    const _extendWebElement = (webElement) => {
        webElement.mineElementsWhereClassContains = (classContains) => {
             var query = "[class*='" + classContains + "']";
             var id = $(webElement).attr('id');
             var result = null;

             if (id){
                 query =  '#' + id + ' ' + query;
                 result = $(query);
             }
             else {
                 result = $(webElement).find(query);
             }

             if (result && result.length > 0){
                   var resultArray = result.toArray();
                   _extendWebElements(resultArray);
                   return resultArray;
             }
             else {
                 return null;
             }


        }

        webElement.mineElementWhereClassContains = (classContains) => {
            const list = webElement.mineElementsWhereClassContains(classContains);
            var result = list && list.length > 0? list[0]: null;

            return result;
        }

        webElement.containsTag = (tagName, attributeName, attributeContainsValue) => {
            const query =`${tagName}[${attributeName}*="${attributeContainsValue}"]`;
            return $(webElement).find(query).length > 0;
        }

        webElement.containsText = (searchForText) => {
            const query = ":contains('" + searchForText + "')";
            return $(webElement).find(query).length > 0;
        }

        webElement.mineTags = (tagName) => {
            const list = $(webElement).find(tagName);
            var result = list && list.length > 0? list.toArray() : [];

            _extendWebElements(result);

            return result;
        }

        webElement.mineTag = (tagName) => {
            const list = webElement.mineTags(tagName);
            const result = list && list.length > 0? list[0] : null;

            return result;
        }
    }

    const _jsonParse = (data) => {
        if (data && (typeof data === 'string' || data instanceof String)){
            try {
                return JSON.parse(data);
            }
            catch {}
        }
      
        return data;
    }

    const _setUpPostMessageListener = (container) => {
        window.addEventListener('message', function(e) {
            var d = e.data;
    
            const action = d.action;
            const data = _jsonParse(d.parameter);
    
            const fncToCall =  container && container.length? `${container}.${action}` : `${action}`;
            const script = `if (${fncToCall}){ ${fncToCall}(data); }`
            eval(script);
        });
    }

    const _postMessageToWindow = (windowReference, actionString, data) => {
        const jsonData = JSON.stringify(data);
        windowReference.postMessage({action: actionString, parameter: jsonData}, "*");
    }

    const _httpGetJson = (url) => {
        return new Promise((resolve, reject) => {
           $.get(url, function(data) {
               resolve(data);
           });
        });
    }

    const _httpGetText = (url) => {
        return new Promise((resolve, reject) => {
            $.get(url, function(response) {
                resolve(response);
            });
         });
    }

    const _httpGetTemplate = async (templateName) => {
        const url = `https://tonkasourceworkflows.firebaseapp.com/linkedin/alisonHook/templates/${templateName}/${templateName}.html`;
        const html = await _httpGetText(url);

        return html;
    }

    class TSCommon {
        constructor(){};

        log = _log;
        sleep = _sleep;
        httpGetJson = _httpGetJson;
        httpGetText = _httpGetText;
        httpGetTemplate = _httpGetTemplate;
        randomSleep = _randomSleep;
        extendWebElements = _extendWebElements;
        extendWebElement = _extendWebElement;
        setUpPostMessageListener = _setUpPostMessageListener;
        postMessageToWindow = _postMessageToWindow;
        
    }

    window.tsCommon = new TSCommon();
})();
