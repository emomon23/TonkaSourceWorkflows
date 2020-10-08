(function() {
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
            var result = list && list.length > 0 ? list[0]: null;

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
            var result = list && list.length > 0 ? list.toArray() : [];

            _extendWebElements(result);

            return result;
        }

        webElement.mineTag = (tagName) => {
            const list = webElement.mineTags(tagName);
            const result = list && list.length > 0 ? list[0] : null;

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

    const _waitTilTrue = async(callBack, maxMilliseconds) => {
        let currentMs = 0;
        let step = 300;
        return new Promise((resolve, reject) => {
            const intervalRef = window.setInterval(() => {
                currentMs+=step;
                const goodToGo = callBack();
                if (goodToGo){
                    clearInterval(intervalRef);
                    resolve(true);
                }

                if (currentMs >= maxMilliseconds){
                    resolve(false);
                }

            }, step);
        });
    }

    const _dayDifference = (d1, d2) => {
        const compareFrom = new Date(d1);
        const compareTo = new Date(d2);
        const difference_In_Time = compareFrom.getTime() - compareTo.getTime(); 
        const difference_In_Days = difference_In_Time / (1000 * 3600 * 24);
    
        return difference_In_Days;
    }

    class Now {
        constructor() {
            const d = new Date();
            this.month = d.getMonth() + 1;
            this.day = d.getDate();
            this.year = d.getFullYear();
            this.time = d.getTime();
            this.dateTimeString = d.toString();
            this.dateString = d.toLocaleDateString();
            this.timeString = d.toLocaleTimeString();
        }
           
        dayDiff(compareToDate) {
            const compareTo = new Date(compareToDate);
            const difference_In_Time = this.time - compareTo.getTime(); 
            const difference_In_Days = difference_In_Time / (1000 * 3600 * 24);
        
            return difference_In_Days;
        }
    }

    class TSCommon {
        constructor(){}

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
        clickAHyperLink = _clickAHyperLink;
        navigateToHyperLink = _navigateToHyperLink;
        findAHyperLink = _findAHyperLink;
        waitTilTrue = _waitTilTrue;
        now = () => { return new Now(); };
        dayDifference = _dayDifference
    }

    window.tsCommon = new TSCommon();
})();
