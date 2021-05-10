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

    const _checkIfStringContainsNonAsciiCharacters = (str) => {
        const ascii = /^[ -~]+$/;
        return !ascii.test(str)
    }

    const _cleanEscapeCharacters = (str) => {
        let copy = str.toString();

        params = [
            // eslint-disable-next-line no-useless-escape
            {lookFor: '\\\"', replace: '"'},
            {lookFor: '\\"', replace: '"'},
            // eslint-disable-next-line no-useless-escape
            {lookFor: '\"', replace: '"'}
        ]


        params.forEach((p) => {
            let counter = 0;
            // eslint-disable-next-line no-constant-condition
            while (true){
                counter += 1;
                if (counter === 1000 || copy.indexOf(p.lookFor) === -1){
                    break;
                }

                copy = copy.replace(p.lookFor, p.replace);
            }
        })

        return copy;
    }

    const _removeGenderIdentitiesFromString = (str) => {
        const gIdentities = ["(he/him)", "(he/his)", "(he/him/his)", "(him/his)", "he/him", "he/his", "he/him/his", "him/his", "(she/her)", "(she/her/hers)", "she/her", "she/her/hers", "(He/Him)", "(He/His)", "(He/Him/His)", "(Him/His)", "He/Him", "He/His", "He/Him/His", "Him/His", "(She/Her)", "(She/Her/Hers)", "She/Her", "She/Her/Hers"]
        let result = str.toString();

        gIdentities.forEach((i) => {
            if (result.indexOf(i) > 0 || result.indexOf(i.toUpperCase()) > 0){
                result = result.replace(i, '').replace(i.toUpperCase(), '').trim();
            }
        });

        return result;
    }

    const _extractFirstAndLastNameFromCandidate = (candidate) => {
        if (!candidate){
            return null;
        }

        if (!(candidate.firstName && candidate.lastName)){
            if (!candidate.fullName === "LinkedIn Member"){
                console.error({method: '_extractFirstAndLastNameFromCandidate', msg: 'unable to execute method', candidate});
            }

            return null;
        }

        let firstName = tsUICommon.cleanseTextOfHtml(candidate.firstName);
        firstName = _removeGenderIdentitiesFromString(firstName);
        firstName = firstName.replace(/\./g, '');
        const firstNameContainsOtherData = firstName.split(' ').length > 1;
        const firstNameContainsNonAsciiCharacters = _checkIfStringContainsNonAsciiCharacters(firstName);

        let lastName = tsUICommon.cleanseTextOfHtml(candidate.lastName);
        lastName = _removeGenderIdentitiesFromString(lastName);
        lastName = lastName.replace(/\./g, '');
        const lastNameContainsOtherData = lastName.split(' ').length > 1;
        const lastNameContainsNonAsciiCharacters = _checkIfStringContainsNonAsciiCharacters(lastName);


        if (!(firstNameContainsNonAsciiCharacters || firstNameContainsOtherData || lastNameContainsOtherData || lastNameContainsNonAsciiCharacters)){
            return {
                firstName,
                lastName
            }
        }

        return _parseOutFirstAndLastNameFromString(candidate.fullName);
    }



    const _parseOutFirstAndLastNameFromString = (strFullName) => {
        if (!(strFullName && strFullName.length)){
            console.error(`_parseOutFirstAndLastNameFromString.  strFullName is undefined, null, or empty`);
            return null;
        }

        let result = strFullName.replace(/\./g, '');
        result = tsUICommon.cleanseTextOfHtml(result);
        result = _removeGenderIdentitiesFromString(result);

        let nameParts = result.split(' ');

        nameParts = nameParts.filter((n) => {
            const containsNonAsciiChars = _checkIfStringContainsNonAsciiCharacters(n);

            return n.length > 0
                    && !(n.startsWith("(") && n.endsWith(")")) // Remove a nickname: 'Joe (cool) Camel'
                    && containsNonAsciiChars === false
        });

        if (nameParts.length === 0){
            console.error(`parseOutFirstAndLastNameFromString had trouble with "${strFullName}"`);
            return null;
        }

        if (nameParts.length === 1){
            console.error(`parseOutFirstAndLastNameFromString had trouble with "${strFullName}"`);

            return {
                firstName: nameParts[0],
                lastName: nameParts[0]
            }
        }

        if (nameParts.length === 2){
            // most common?
            return {
                firstName: nameParts[0],
                lastName: nameParts[1]
            }
        }

        return {
            firstName: nameParts[0],
            lastName: nameParts[nameParts.length - 1]
        }
    }
    class TSString {
        findDelimitedStrings = _findDelimitedStrings;
        findPrecedenceWithinString = _findPrecedenceWithinString;
        stripExcessSpacesFromString = _stripExcessSpacesFromString;
        containsAny = _containsAny;
        containsAll = _containsAll;
        cleanEscapeCharacters = _cleanEscapeCharacters;
        extractEmailAddresses = _extractEmailAddresses;
        extractPhoneNumbers = _extractPhoneNumbers;
        toBoolean = _toBoolean;
        toStringify = _toStringify;
        getClosestMatch = _getClosestMatch;
        convertFullNameToObject = _convertFullNameToObject;
        cleanText = _cleanText;
        extractFirstAndLastNameFromCandidate = _extractFirstAndLastNameFromCandidate;
        checkIfStringContainsNonAsciiCharacters = _checkIfStringContainsNonAsciiCharacters;
        parseOutFirstAndLastNameFromString = _parseOutFirstAndLastNameFromString;
    }

    window.tsString = new TSString();
})();