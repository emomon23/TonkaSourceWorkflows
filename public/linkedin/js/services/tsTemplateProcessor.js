(() => {
    const _greetings = [
        'hi there ',
        'hay there ',
        'hey there ',
        'hay ',
        'hey ',
        'hi ',
        'good morning ',
        'morning ',
        'good mornin ',
        'mornin ',
        'good evening ',
        'evening ',
        'good afternoon ',
        'afternoon ',
        'hello ',
        'greetings '
    ];

    const _convertToTemplate = (message, candidate) => {
        let result = message;

            if (!(candidate && candidate.firstName)){
        return _convertToTemplateBestGuess(message);
        }

        const firstName = candidate.firstName;
        const lastName = candidate.lastName;

        let find = new RegExp(firstName, 'gi');
        result = message.replace(find, '[first-name]');

        if (lastName){
            find = new RegExp(lastName, 'gi');
            result = result.replace(find, '[last-name]');
        }

        return result;
    }

    const _stripOfTrailingChar = (body, char) => {
        return body.endsWith(char) ? body.substr(0, body.length - 1) : body;
    }

    const _convertToTemplateBestGuess = (message) => {
        if (!(message && message.length)){
            return message;
        }

        const lines = message.split('\n');
        if (lines.length < 2){
            return message;
        }

            let lCase = lines[0].toLowerCase().trim();
        let firstName = null;

        for (let i = 0; i < _greetings.length; i++){
            const indexOfGreeting = (lCase.indexOf(_greetings[i]));
            if (indexOfGreeting  === 0){
                lCase = lCase.replace(_greetings[i], '');
            lCase = _stripOfTrailingChar(lCase, ',');
            lCase = _stripOfTrailingChar(lCase, '.');

            const words = lCase.split(' ');
            if (words.length === 1){
                firstName = words[0];
            }

            break;
            }
        }


        if (firstName) {
            let find = new RegExp(firstName, 'gi');
            return message.replace(find, '[first-name]');
        }

        return message;
    }

    const _lookForAndReplace = (text, lookForArray, replaceWithString) => {
        let result = text;

        lookForArray.forEach((lookForString) => {
            const escaped = `\\[${lookForString}\\]`;
            const lookFor = new RegExp(escaped, 'gi');
            result = result.replace(lookFor, replaceWithString);
        });

        return result;
    }

    const _processTemplate = (message, candidate) => {
        if (!(candidate && (candidate.firstName || candidate.lastName))){
            return message;
        }

        let result = message;

        const lookForLastNames = ['[last-name], [lastName]'];

        if (candidate.firstName){
            result = _lookForAndReplace(result,  ['first-name', 'firstName'], candidate.firstName);
        }

        if (candidate.lastName) {
            result = _lookForAndReplace(result,  ['last-name', 'lastName'], candidate.lastName);
        }


        return result;
    }

    class TSTemplateProcessor {
        processTemplate = _processTemplate;
        convertToTemplate = _convertToTemplate;
    }

    window.tsTemplateProcessor = new TSTemplateProcessor();
})();

