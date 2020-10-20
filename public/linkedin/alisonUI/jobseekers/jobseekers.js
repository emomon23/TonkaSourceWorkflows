//a reference to the <template...></template> element in jobSeekers.html (see doc.ready below)
let skillFilterTemplate = null;

const highlightError = (element) => {
    $(element).attr('style', 'border:1px solid red');
}

const getSkillsFilters = () => {
    //classes: skillName, yearsExperience, lastUsedMonths, isRequired
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

                if (isNaN(years)){
                    highlightError(yearsInput);
                    isValid = false;
                }

                if (isNaN(withinMonths)){
                    highlightError(withinMonthsInput);
                    isValid = false;
                }
                
                const required = $(skRow).find('.isRequired')[0].checked;
           
                result[skill] = {
                    monthsUsing: Number.parseInt(years) * 12,
                    withinMonths,
                    required
                };
        });
    }

    return isValid ? result : null;
}

const getContactContainsFilters = () => {
    const search = {};

    let containsFilters = $('.contactContainsFilter');
    if (containsFilters.length > 0){
        containsFilters = containsFilters.toArray();
        containsFilters.forEach((contains) => {
            if(contains.value && contains.value.length > 0){
                const key = $(contains).attr('id');
                search[key] = contains.value.split(',');
            }
        })
    }

    return search;
}

const appendSkillFilterRow = () => {
    const clone = skillFilterTemplate.content.cloneNode(true);
    const container = $('#skillsFilterContainer')[0];
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
const renderSearchResults = (results) => {
    const msg = `There are ${result && result.length? result.length : "0"} results that match your search.`
}

addStatsFilterRow_click = (e) => {
    appendSkillFilterRow();
}

searchForCandidates_click = async (e) => {
    const search = getContactContainsFilters();
    search.isJobSeeker = $('#onlyJobSeekers')[0].checked;
    search.skills = getSkillsFilters();
    appendGPAFilters(search);

    if (search.skills){
        //const results = await alisonContactService.submitSkillsSearch(search);
        //renderSearchResults(result);
    }
    console.log(search);
}

$(document).ready(() => {
    skillFilterTemplate = $('#skillFilterRowTemplate')[0];
});