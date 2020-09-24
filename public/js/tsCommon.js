(function() {
    const _calculateRateGuidance = (lowRate, highRate) => {
        const candidateLowRate = (lowRate) ? Math.floor(lowRate - 20) : 0;
        const candidateHighRate = (highRate) ? Math.floor(highRate - (highRate * 0.20)) : 150;
        return {
            candidateLowRate: candidateLowRate,
            candidateHighRate: candidateHighRate,
            candidateRateGuidance: `$${candidateLowRate} - $${candidateHighRate}`,
            tonkaLowRate: lowRate,
            tonkaHighRate: highRate,
            tonkaRateGuidance: `$${lowRate} - $${highRate}`
        }
    }

    const _callAlisonHookWindow = async (actionString, data) => {
        await window.launchTonkaSource();
        await tsCommon.sleep(2000);

        if (window.alisonHookWindow){
            try {
                const jsonData = JSON.stringify(data);
                tsCommon.postMessageToWindow(window.alisonHookWindow, actionString, jsonData);
            }
            catch(postError) {
                console.log(`Error posting message to alison hook (check pop up blocker?). ${e.message}.  (${e})`, 'ERROR');
            }
        }
        else {
            console.log("Unable to 'postMessage', no reference to alisonHookWindow exists (run launchTonkaSource()? Check Pop up blocker?)");
        }
    }

    const _clearLocalStorage = (key) => {
        window.localStorage.removeItem(key);
    }

    const _convertCurrencyStringToNumber = (currency) => {
        return Number(currency.replace(/[^0-9.-]+/g,""));
    }

    const _log = (message, type = 'LOG') => {
        switch (type.toUpperCase()) {
            case 'WARN':
                console.warn(message);
                break;
            case 'ERROR':
                console.error(message);
                break;
            default:
                console.log(message);
        }
    }

    const _persistToLocalStorage = (key, data) => {
        var jsonString = JSON.stringify(data);
        window.localStorage.setItem(key, jsonString);
    }

    const _sleep = (ms) => {
        _log("Sleeping for " + ms + "ms");
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const _randomSleep = (min, max) => {
        const ms = Math.floor(Math.random() * (max - min) ) + min;
        return _sleep(ms);
    }

    const _decodeHtml = (html) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
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
            if (Array.isArray(searchForText)){
                let result = false;
                for (let i=0; i<searchForText.length; i++){
                    const query = ":containsi('" + searchForText[i] + "')";
                    result = result || $(webElement).find(query).length > 0;
                    if (result){
                        break;
                    }
                }

                return result;
            }
            else {
                const query = ":containsi('" + searchForText + "')";
                return $(webElement).find(query).length > 0;
            }
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
            catch {
                // Do nothing
            }
        }
      
        return data;
    }

    const _setUpPostMessageListener = (container) => {
        window.addEventListener('message', (e) => {
            var d = e.data;
    
            const action = d.action;
            const data = _jsonParse(d.parameter);
    
            const fncToCall =  container && container.length? `${container}.${action}` : `${action}`;
            const script = `if (${fncToCall}){ ${fncToCall}(data); }`
            // eslint-disable-next-line no-eval
            eval(script);
        });
    }

    const _postMessageToWindow = (windowReference, actionString, data) => {
        const jsonData = JSON.stringify(data);
        if (windowReference){
            windowReference.postMessage({action: actionString, parameter: jsonData}, "*");
        } else {
            console.log("Unable to postMessage to Alison Hook", "WARN");
        }
    }

    const _httpGetJson = (url) => {
        return new Promise((resolve, reject) => {
           $.get(url, (data) => {
               resolve(data);
           });
        });
    }

    const _httpGetText = (url) => {
        return new Promise((resolve, reject) => {
            $.get(url, (response) => {
                resolve(response);
            });
         });
    }

    const _httpGetTemplate = async (templateName) => {
        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonHook/templates/${templateName}/${templateName}.html`;
        const html = await _httpGetText(url);

        return html;
    }

    const _findAHyperLink = (hrefContains, documentReference = null) => {
        if (documentReference === null){
            documentReference = window.document;
        }

        const result =  documentReference.querySelector(`a[href*='${hrefContains}']`);
        if (result === undefined || result === null){
            return null;
        }

        return result;
    }

    const _clickAHyperLink = (hrefContains, documentReference = null) => {
        _findAHyperLink(hrefContains, documentReference).click();
    }

    const _navigateToHyperLink = (hrefContains, parentWindow = null) => {
        if (parentWindow === null){
            parentWindow = window;
        }
        const linkRef = _findAHyperLink(hrefContains, parentWindow.document);
        if (linkRef !== null){
            const href = linkRef.getAttribute('href');
            parentWindow.location.href = href;
        }
    }

    const _waitForTrue = (timeOut, maxChecks, checkFunction) => {
        let currentChecks = 0;
        let result = false;

        const intervalReference = window.setInterval(() => {
            result = checkFunction();
            currentChecks+=1;
            if (result === true || currentChecks >= maxChecks){
                intervalReference.clearInterval();
            }
        }, timeOut);

        return result;
    }

    class TSCommon {
        constructor(){}

        calculateRateGuidance = _calculateRateGuidance;
        callAlisonHookWindow = _callAlisonHookWindow;
        clickAHyperLink = _clickAHyperLink;
        clearLocalStorage = _clearLocalStorage;
        convertCurrencyStringToNumber = _convertCurrencyStringToNumber;
        decodeHtml = _decodeHtml;
        extendWebElements = _extendWebElements;
        extendWebElement = _extendWebElement;
        findAHyperLink = _findAHyperLink;
        httpGetJson = _httpGetJson;
        httpGetText = _httpGetText;
        httpGetTemplate = _httpGetTemplate;
        log = _log;
        navigateToHyperLink = _navigateToHyperLink;
        persistToLocalStorage = _persistToLocalStorage;
        postMessageToWindow = _postMessageToWindow;
        randomSleep = _randomSleep;
        setUpPostMessageListener = _setUpPostMessageListener;
        sleep = _sleep;
        waitForTrue = _waitForTrue;
    }

    window.tsCommon = new TSCommon();

    window.launchTonkaSource = async () => {
        const url = `${tsConstants.HOSTING_URL}/linkedin/alisonHook/alisonHook.html`;
        window.alisonHookWindow = window.open(url, "Linked In Hack", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=10,height=10,top=5000,left=5000");

        await tsCommon.sleep(1000);

        await promiseLoop([{}, {}, {}], async () => {
            if (!window.alisonHookWindow){
                await tsCommon.sleep(2000);
            }
        });

        if (!window.alisonHookWindow){
            console.log("Unable to open alisonHook.  CHECK POP UP BLOCKER?", "WARN");
        }
    }
})();
