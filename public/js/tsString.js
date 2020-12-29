(() => {

    const _findDelimitedStrings = (searchString, delimiter, removeDelimiterFromString = false) => {
        const expression = `${delimiter}(.*?)${delimiter}`;

        let matches = searchString.match(new RegExp(expression, 'g'));
        if (removeDelimiterFromString && matches){
          matches = matches.map(m => m.replace(new RegExp(delimiter, 'g'), ''));
      }

      return matches ? matches : [];
    }

    const _findPrecedenceWithinString = (searchString) => {
        const expression = /\((.*?)\)/g;

        let matches = searchString.match(expression);
        matches = matches ? matches.map(m => m.replace(/\(/g, '').replace(/\)/g, '')) : [];

        return matches;
    }

    const _getMaxCharIndexMatch = (source, compare) => {
		if (!(source && compare)){
    	    return -1;
        }

		const sArray = [...source];
        const cArray = [...compare];
        const toLength = source.length < compare.length ? source.length : compare.length;

        let result = -1;

        for (let i = 0; i < toLength; i++){
            if (sArray[i] !== cArray[i]){
                break;
            }

            result = i;
        }

        return result;
    }

    const _getClosestMatch = (source, arrayToCompareTo) => {
        let resultCompareString = null;
        let maxCharIndex = -1;
        let matchFoundOnIndex = -1;
        const matchCounters =  {};

        for (let i = 0; i < arrayToCompareTo.length; i++){
            const index = _getMaxCharIndexMatch(source, arrayToCompareTo[i]);

            if (index >= maxCharIndex){
                maxCharIndex = index;
                resultCompareString = arrayToCompareTo[i];
                matchFoundOnIndex = i;
                matchCounters[index] = matchCounters[index] ? matchCounters[index] + 1 : 1;
            }
        }

        if ((!resultCompareString) || matchCounters[maxCharIndex] > 1){
            return null
        }

        return {
            matchFoundOnIndex,
            resultCompareString,
            maxCharMatchIndex : maxCharIndex
        }
    }

    const _stripExcessSpacesFromString = (text) => {
        if (typeof text !== 'string'){
            return null;
       }

       return text.trim() === "" ? text : text.replace(/\s\s+/g, ' ');
    }

    const _containsAny = (string, substrings) => {
        if (!string) {
            return false;
        }

        return substrings.some((substring) => {
            if (string.toLowerCase().includes(substring.toLowerCase())) {
                return true;
            }
            return false;
        });
    }

    const _containsAll = (string, substrings) => {
        if (!string || !string.trim){
            return false;
        }

        let result = true;
        const lCaseString = string.trim().toLowerCase();

        for(let i = 0; i < substrings.length; i++){
            let lookFor = substrings[i];
            if (lookFor && lookFor.trim && lCaseString.indexOf(lookFor.trim().toLowerCase()) === -1){
                result = false;
                break;
            }
        }

        return result;
    }

    const _toBoolean = (val) => {
        if (val === true || val === false){
            return val;
        }

        const vStr = val && val.toString ? val.toString().trim().toLowerCase() : val;
        if (vStr === 'true'){
            return true;
        }

        if (vStr === 'false'){
            return false;
        }

        return null;
    }

    const _toStringify = (obj, sortKeys = true, newLine = '\n') => {
        let keys = Object.keys(obj);
        if (sortKeys === true){
            keys.sort((a, b) => {
                if (a < b){
                    return -1;
                }

                return a > b ? 1 : 0;
            });
        }

        let result = obj.id ? `id: ${obj.id}${newLine}` : '';

        keys.forEach((k) => {
            if (k !== 'id'){
                result += `${k}: ${obj[k]}${newLine}`;
            }
        });

        return result;
    }

    const _extractEmailAddresses = (text) => {
        const regEx = /[a-zA-Z0-9-_.]+@[a-zA-Z0-9-_.]+(\.com|\.gov|\.org|\.tv|\.net|\.co|\.store|\.us|\.live)/gi;
        const emails = text.match(regEx);
        return emails && emails.length ? emails : null;
    }

    const _extractPhoneNumbers = (text) => {
        const rgEx = /(\d{1})?(\.|\s)?\d{3}(-|\.|\s)?\d{3}(-|\.|\s)?\d{4}/gi;
        const phoneNumbers = text.match(rgEx);

        return phoneNumbers && phoneNumbers.length ? phoneNumbers : null;
    }

    const _convertFullNameToObject = (fullName) => {
        if (!fullName || fullName.length === 0){
            return null;
        }

        const parts = fullName.split(' ');
        const result = {
            firstName: tsUICommon.cleanseTextOfHtml(parts[0])
        }

        if (parts.length > 1){
            result.lastName = tsUICommon.cleanseTextOfHtml(parts[parts.length - 1]);
        }

        return result;
    }

    const _cleanText = (str) => {
        if (typeof str === "string") {
            let result = str;
            if (str && str.length > 0){
                result = str.split('\n').join('').trim();
                result = _stripExcessSpacesFromString(str);
                result = tsUICommon.cleanseTextOfHtml(result);
            }

            return result;
        }

        try {
            const element = $(str);
            let text = $(element).text ? $(element).text() : null;
            if (!text) {
                text = $(element).val ? $(element).val() : null;
            }

            if (text){
                return _cleanText(text);
            }

            return '';
        } catch (e) {
            return '';
        }
    }
    class TSString {
        findDelimitedStrings = _findDelimitedStrings;
        findPrecedenceWithinString = _findPrecedenceWithinString;
        stripExcessSpacesFromString = _stripExcessSpacesFromString;
        containsAny = _containsAny;
        containsAll = _containsAll;
        extractEmailAddresses = _extractEmailAddresses;
        extractPhoneNumbers = _extractPhoneNumbers
        toBoolean = _toBoolean;
        toStringify = _toStringify;
        getClosestMatch = _getClosestMatch;
        convertFullNameToObject = _convertFullNameToObject;
        cleanText = _cleanText;
    }

    window.tsString = new TSString();
})();