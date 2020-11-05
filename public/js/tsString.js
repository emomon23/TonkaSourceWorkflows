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

    class TSString {
        findDelimitedStrings = _findDelimitedStrings;
        findPrecedenceWithinString = _findPrecedenceWithinString;
        stripExcessSpacesFromString = _stripExcessSpacesFromString;
        containsAny = _containsAny;
        containsAll = _containsAll;
        toBoolean = _toBoolean;
    }

    window.tsString = new TSString();
})();