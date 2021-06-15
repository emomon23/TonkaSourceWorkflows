// a reference to the <template...></template> element in jobSeekers.html (see doc.ready below)
let skillFilterTemplate = null;
let feedBackInterval = null;

const cleanEscapeCharacters = (str) => {
    let copy = str.toString();

    params = [
        // eslint-disable-next-line no-useless-escape
        {lookFor: '\\\"', replace: '"'},
        {lookFor: '\\"', replace: '"'},
        // eslint-disable-next-line no-useless-escape
        {lookFor: '\"\"', replace: '"'},
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

    copy = copy.replace('"(', '(').replace(')"', ')');

    return copy;
}

const highlightError = (element) => {
    $(element).attr('style', 'border:1px solid red');
}

const createAndOrArrays = (elementId) => {
    const data = {};

    const rawText = $(`#${elementId}`).val().toLowerCase();
    const andFilters = rawText.split(' and ').filter(r => r && r.length > 0);

    for (let i = 0; i < andFilters.length; i++){
        const key = `orFilter${i}`;
        const cleaned = andFilters[i].replace(/\(/g, '').replace(/\)/g, '').replace(/"/g, '');
        const orArray = cleaned.split(' or ');
        data[key] = orArray;
    }

    return data;
}

const getRawProfileContainsData = () => {
    const data = {
        addToCurrentProject: $($('#addToCurrentProject')[0]).prop('checked'),
        addToCurrentProjectMinMatch: $('#txtAddToProjectMinMatch').val(),
        ignoreManagement: !$($('#ignoreManagement')[0]).prop('checked'),
        isTechnicallyRelevant: $($('#isTechnicallyRelevant')[0]).prop('checked'),
        ignoreJustStarted: $($('#ignoreJustStarted')[0]).prop('checked'),
        ignoreJobJumpers: $($('#ignoreJobJumpers')[0]).prop('checked')
    }

    let technicalTotalMonths = $('#minTechnicalMonths').val();
    if (technicalTotalMonths === ""){
        technicalTotalMonths = 0;
    }

    if (isNaN(technicalTotalMonths)){
        showMessage("Min Technical Months must be numeric or empty");
        return null;
    }

    data.technicalTotalMonths = Number.parseInt(technicalTotalMonths);
    data.aboutSummaryCurrentJobKeywordsFilter = createAndOrArrays('aboutSummaryCurrentJobContainsText');
    data.profileContainsKeywordsFilter = createAndOrArrays('profileContainsText');

    return data;
}

const getSkillsFilters = () => {
    // classes: skillName, yearsExperience, lastUsedMonths, isRequired
    const result = {};
    let isValid = true;

    let skillFiltersRows = $('.skillFilterRow');
    if (skillFiltersRows.length > 0){
        skillFiltersRows = skillFiltersRows.toArray();
        skillFiltersRows.forEach((skRow) => {
                const skillInput = $(skRow).find('.skillName')[0];
                const yearsInput = $(skRow).find('.yearsExperience')[0];
                const withinMonthsInput = $(skRow).find('.lastUsedMonths')[0];

                const skill = skillInput.value;
                const years = yearsInput.value;
                const withinMonths = withinMonthsInput.value;

                if (skill.length === 0){
                    highlightError(skillInput);
                    isValid = false;
                }

                if (years.length === 0 || isNaN(years)){
                    highlightError(yearsInput);
                    isValid = false;
                }

                if (withinMonths.length === 0 || isNaN(withinMonths)){
                    highlightError(withinMonthsInput);
                    isValid = false;
                }

                const required = $(skRow).find('.isRequired')[0].checked;

                result[skill] = {
                    monthsUsing: Number.parseInt(years) * 12,
                    withinMonths: Number.parseInt(withinMonths),
                    required
                };
        });
    }

    return isValid ? result : null;
}

const appendSkillFilterRow = () => {
    const clone = skillFilterTemplate.content.cloneNode(true);
    const container = $('#skillsFilterTable')[0];
    container.appendChild(clone);
}

const appendGPAFilters = (search) => {
    const gpaFilters = $('.gpaFilter').toArray();
    gpaFilters.forEach((gpaFilter) => {
        const value = gpaFilter.value;
        if (value.length > 0 && !isNaN(value)){
            search[$(gpaFilter).attr('id')] = Number.parseFloat(value);
        }
    });
}

const showMessage = (message) => {
    mElement = $('#message-container')[0];
    $(mElement).text(message);
}

const showFeedBackInterval = (baseMessage) => {
    mElement = $('#message-container')[0];
    $(mElement).text(baseMessage);

    if (feedBackInterval){
        clearInterval(feedBackInterval);
    }

    feedBackInterval = setInterval(() => {
        const text = mElement.textContent + '.';
        mElement.textContent = text;
    }, 1000);
}

const stopFeedback = () => {
    if (feedBackInterval){
        clearInterval(feedBackInterval);
        feedBackInterval = null;
    }
    showMessage('');
}

const renderSearchResults = (results) => {
    stopFeedback();

    console.log(`renderSearchResults: ${results.length}`);

    const numberOfResultsLabel = $('#numberOfResults')[0];
    const searchFilters = $('#searchFilters')[0];
    $(searchFilters).attr('style', 'display:none');

    const clonedTable = $('#searchResultTableTemplate')[0].content.cloneNode(true);
    const resultsDiv = $('#resultsDiv')[0];
    $(resultsDiv).attr('style', 'display:block');

    $(resultsDiv).append(clonedTable);

    // Add all the divs and rows to the DOM 1st.
    if (results && results.length && results.forEach){
        results.forEach((contact) => {
            const clonedRow = $('#searchResultRowTemplate')[0].content.cloneNode(true);
            $(resultsDiv).append(clonedRow);
        });
    }

    const anchors = $('.linkToProfile');
    const companyNamesDivs = $('.companyNames');
    const emailDivs = $('.email');
    const phoneDivs = $('.phone');
    const gpaDivs = $('.gpa');

    for(let i = 0; i < results.length; i++){
        const c = results[i];
        const href = c.linkedIn && c.linkedIn.length > 0 ? c.linkedIn : '';
        const name = `${c.firstName} ${c.lastName}`;
        const email = c.email && c.email.length > 0 ? c.email : 'email: unknown';
        const phone = c.phone && c.phone.length > 0 ? c.phone : 'phone: unknown';
        const companyNames = Array.isArray(c.positions) && c.positions.length ? c.positions.join(', ') : 'positions: none';
        let grades = [];
        console.log(c);
        if (c.skills && c.skills.grades) {
            if (c.skills.grades.cumulativeMonthsUsing) {
                grades.push(c.skills.grades.cumulativeMonthsUsing.grade);
            } else {
                grades.push("NC");
            }
            if (c.skills.grades.cumulativeWithinMonths) {
                grades.push(c.skills.grades.cumulativeWithinMonths.grade);
            } else {
                grades.push("NC");
            }
        }

        $(anchors[i]).attr('href', href).text(name);
        $(companyNamesDivs[i]).text(companyNames);
        $(emailDivs[i]).text(email);
        $(phoneDivs[i]).text(phone);
        $(gpaDivs[i]).text(grades.join(", "));
    }

    $(numberOfResultsLabel).text(`Results: ${results.length}`);
}

const saveSearchFilterToLocalStorage = (search) => {
    tsUICommon.saveItemLocally(tsConstants.localStorageKeys.CANDIDATE_FILTERS, search);
    if (window.linkedInConsoleReference){
        var jsonString = search ? JSON.stringify(search) : {};
        window.linkedInConsoleReference.postMessage({action: 'persistSkillsGPASearchFilter', parameter: jsonString}, "*");
    }
    else {
        showMessage("Unable to save search to linked in window. no reference to linkedInConsoleReference");
    }
}

showFilters_click = (e) => {
    const resultsDiv = $('#resultsDiv')[0];
    $(resultsDiv).attr('style', 'display:none');

    const searchFilters = $('#searchFilters')[0];
    $(searchFilters).attr('style', 'display:block');
}

addStatsFilterRow_click = (e) => {
    appendSkillFilterRow();
}

removeSkillFilter_click = (removeButton) => {
   if (removeButton){
       $(removeButton).parent().parent().remove();
   }
}

searchForCandidates_click = async (e) => {
    try {
        const search = {};
        search.isJobSeeker = $('#onlyJobSeekers')[0].checked;
        search.skills = getSkillsFilters();
        appendGPAFilters(search);
        console.log({search});

        if (search.skills){
            showFeedBackInterval('searching alison, stand by');
            const results = await alisonContactService.submitSkillsSearch(search);
            renderSearchResults(results);
            saveSearchFilterToLocalStorage(search);
        }
    } catch(err) {
        showMessage(`ERROR: ${err.message}`);
    }
}

rawKeywordFilter_click = async (e) => {
    const data = getRawProfileContainsData();

    if (data) {
        window.linkedInConsoleReference.postMessage({action: "searchProfilesForKeywords", parameter: data}, "*");

        setTimeout(() => {
            window.close();
        }, 2000);

    }
}

$(document).ready(() => {
    skillFilterTemplate = $('#skillFilterRowTemplate')[0];

    const hasFilter = tsUICommon.getItemLocally(tsConstants.localStorageKeys.CANDIDATE_FILTERS);

    window.addEventListener('message', (e) => {
        var d = e.data;

        const action = d.action;
        const data = d.parameter;

        $($('#decorateButton')[0]).removeAttr('disabled');

        if (data) {
            const keyWords = cleanEscapeCharacters(data);
            $('#profileContainsText').val(keyWords);
        }

        window.linkedInConsoleReference = e.source;
        console.log(`post message received from parent.  action: ${action}`);
    });
});
