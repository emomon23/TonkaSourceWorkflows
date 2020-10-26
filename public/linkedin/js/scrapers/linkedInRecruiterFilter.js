(() => {

    const _getFilterKeyFromListItem = (filterLi) => {
        const text = filterLi.textContent.trim().toLowerCase();

        const keyMap = [{ lookFor: 'job titles', keyName: 'jobTitles' }, 
            { lookFor: 'geographic', keyName: 'location' },
            { lookFor: 'skills and experience', keyName: 'skills' },
            { lookFor: 'companies', keyName: 'companies' },
            { lookFor: 'graduation', keyName: 'graduation' },
            { lookFor: 'schools attended', keyName: 'schools' },
            { lookFor: 'years working in their field', keyName: 'yearsExperience' },
            { lookFor: "how closely you", keyName: 'connection' },
            { lookFor: 'industries', keyName: 'industries' },
            { lookFor: 'keywords', keyName: 'keywords' },
            { lookFor: 'postal code', keyName: 'postalCode' },
            { lookFor: 'filter by first names', keyName: 'firstName' },
            { lookFor: 'filter by last names', keyName: 'lastName' },
            { lookFor: 'military', keyName: 'military' },
            { lookFor: 'levels of responsibility', keyName: 'responsibility' },
            { lookFor: 'current employers', keyName: 'currentEmployers' },
            { lookFor: 'past employers', keyName: 'pastEmployers' },
            { lookFor: 'number of employees', keyName: 'numberEmployees' },
            { lookFor: 'expertise', keyName: 'expertise' },
            { lookFor: 'associated with your groups', keyName: 'groups' }
        ];
    
        let result = null;
        for(let i=0; i<keyMap.length; i++){
            if (text.indexOf(keyMap[i].lookFor) >= 0){
                result = keyMap[i].keyName;
                break;
            }
        }

        return result;
    }

    const _scrapeFilterInputsSearchResultFilters = () => {
        const result = {};
        let filterListItems = $(linkedInSelectors.searchResultsPage.searchFilterCategories);
        if (filterListItems.length === 0){
            return null;
        }

        filterListItems = filterListItems.toArray();
        filterListItems.forEach((filterLI) => {
            let valuePills = $(filterLI).find(linkedInSelectors.searchResultsPage.searchFilterValues);
            if (valuePills.length > 0){
                const key = _getFilterKeyFromListItem(filterLI);
                if (key) {
                    let filterValues = valuePills.toArray().map(n => n.textContent.trim());
                    filterValues = result[key] ? filterValues.concat(result[key]) : filterValues;
                    result[key] = [...new Set(filterValues)];
                }
            }
        });

        return result;
    }

    const _keywordStringToArray = (words) => {
		return words.split(' ').filter((w) => {
                lw = w.toLowerCase();  
                    return lw.length > 0 && lw.indexOf('recruit') === -1 && lw !== 'or' && lw !== 'and' && lw !== 'not'
    			});
    }

    const _breakUpStringIntoDistinctWords = (stringOfWords) => {
        let result = [];
        let copy = stringOfWords;

        const delimitedWords = tsString.findDelimitedStrings(copy, '"');
        delimitedWords.forEach((w) => {
        copy = copy.replace(new RegExp(w, 'g'), '').trim();
        });

        result = _keywordStringToArray(copy).concat(delimitedWords)
        result = [...new Set(result)];
    
        return result
    }

    const _buildKeywordMatchStructure = (keywords) => {
       /* Examples:
            keywords: '(.NET or C# or VB.NET or "ASP MVC")'
            returns:
                [{
                    title: '.NET',
                    wordMatch: ['.net', 'c#', 'vb.net', 'asp mvc']
                }]
            ________________________________________________________
            keywords: 'C# or (EMR or "Electronic Medical Records")'
            returns:
            [
                { title: 'C#', wordMatch: ['c#'] }
                { title: 'EMR', wordMatch: ['emr', 'electronic medical records]}
            ]
       */

        const keywordMatchSearch = [];
        let globalListOfWordsToStrip = [/\(/, /\)/];
        let keywordsCopy = keywords;
    
        const grouped = tsString.findPrecedenceWithinString(keywordsCopy);
        grouped.forEach((groupedWordsString) => { 
            const wordGroupArray = _breakUpStringIntoDistinctWords(groupedWordsString);
            const doTheyHave = {
                title: wordGroupArray[0],
                wordMatch: wordGroupArray.map(l => l.toLowerCase().replace(/"/g, ''))
            }
        
            //sort by length descending (eg. '.Net core', then '.Net')
            globalListOfWordsToStrip.sort((a, b) => {
                if (typeof a === "string" && typeof b === "string") {
                  return a.length > b.length ? -1 : a.length === b.length ? 0 : 1;
                }
             
                return 0;
            });

            globalListOfWordsToStrip = globalListOfWordsToStrip.concat(wordGroupArray);
            keywordMatchSearch.push(doTheyHave);
        });
    

        globalListOfWordsToStrip.forEach((s) => {
                keywordsCopy = keywordsCopy.replace(new RegExp(s, 'g'), '');
        });
    
        const standAloneKeywords = _keywordStringToArray(keywordsCopy);
        standAloneKeywords.forEach((k) => {
            const doTheyHave = {
                title: k.trim(),
                wordMatch:[ k.trim().toLowerCase()]
            }
            
            keywordMatchSearch.push(doTheyHave);
        })
        
        console.log({keywordMatchSearch})
        return keywordMatchSearch;
    }

    const _scrapeLinkedSearchFilters = () => {
        const filterObject = _scrapeFilterInputsSearchResultFilters();
        window.tsRecruiterSearchFilters = tsRecruiterSearchFilterRepository.saveLinkedInRecruiterSearchFilters(filterObject);
    }

    const _getRecruiterFilterKeywordMatchStrucuture = () => {
        const recruiterFilter = tsRecruiterSearchFilterRepository.getLinkedInRecruiterSearchFilters();
        if (recruiterFilter && recruiterFilter.keywords && recruiterFilter.keywords.length === 1){
            return _buildKeywordMatchStructure(recruiterFilter.keywords[0])
        }

        return null;
    }

    const _findLastUsed = (candidate, doTheyHave) => {
        if (!(candidate && candidate.positions && candidate.positions.length)){
            return null;
        }

        let result = null;
        for (let i=0; i<candidate.positions.length; i++){
            const p = candidate.positions[i];
            const foundOne = tsString.containsAny(p.description, doTheyHave.wordMatch);
            if (foundOne){
                if (!p.endDateMonth){
                    result = 'Present';
                }
                else {
                    result = `${p.endDateMonth}/${p.endDateYear}`;
                }
                break;
            }
        }

        return result;
    }

    const _analyzeCandidateProfile = (candidate) => {
        const doTheyHavesArray =  _getRecruiterFilterKeywordMatchStrucuture();
        let result = null;

        if (candidate && doTheyHavesArray && doTheyHavesArray.length){
            const listOfWhatTheyHave = []
            const summary = candidate.summary ? candidate.summary.toLowerCase() : '';
            const raw = candidate.rawExperienceText ? candidate.rawExperienceText.toLowerCase() : '';
    
            doTheyHavesArray.forEach((doTheyHave) => {
                const matchWords = doTheyHave.wordMatch;
                const foundInSummary = tsString.containsAny(summary, matchWords);
                const foundInJobHistory = tsString.containsAny(raw, matchWords);
                const lastUsed = foundInJobHistory ? _findLastUsed(candidate, doTheyHave) : null;

                if (foundInSummary || foundInJobHistory){
                    const theyHave = {
                        title: doTheyHave.title,
                        foundInJobHistory,
                        foundInSummary,
                        lastUsed
                    };
                    listOfWhatTheyHave.push(theyHave);
                }
            });
        
            if (listOfWhatTheyHave.length){
                const percentMatch = (listOfWhatTheyHave.length / doTheyHavesArray.length) * 100;
            
                result = {
                    percentMatch: Number.parseInt(percentMatch),
                    theyHave: listOfWhatTheyHave
                }

                candidate.lastSearchFilterMatch = result;
                candidateKeywordMatchRepository.saveCandidateKeywordMatch(candidate);
            }
        }
        return result;
    }

    class LinkedInRecruiterFilter {
        scrapeLinkedSearchFilters = _scrapeLinkedSearchFilters;
        analyzeCandidateProfile = _analyzeCandidateProfile;
        ___buildKeywordMatchStructure = _buildKeywordMatchStructure;
    }

    window.linkedInRecruiterFilter = new LinkedInRecruiterFilter()
})();