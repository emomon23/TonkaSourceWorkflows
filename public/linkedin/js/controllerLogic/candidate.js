(() => {

    // need to talk about migrations.
    let _entireCandidateList = null;


    const _mergePositions = (existingPositions, incomingPositions) => {
        const result = existingPositions ? existingPositions : [];
        if (!incomingPositions){
            return result;
        }

        incomingPositions.forEach((ip) => {
            const ipIdentifier = ip.companyId ? ip.companyId : ip.companyName;

            const match = existingPositions.find((ep) => {
                const epIdentifier = ep.companyId ? ep.companyId : ep.companyName;

                return epIdentifier === ipIdentifier
                && ep.startDateMonth === ip.startDateMonth
                && ep.startDateYear === ip.startDateYear;
            });

            if (match){
                match.title = ip.title;
                match.displayText = ip.displayText;
                match.skills = ip.skills;

                if (ip.description && ip.description.length){
                    // eg. This will happend when a 'lite candidate' has their profile scraped
                    match.description = ip.description;
                }
            } else {
                result.push(ip);
            }
        });

        return result;
    }

    const _checkIfDataCameFromPublicProfileOrRecruiterProfilePage = (candidate) => {
        return candidate.lastScrapedBy === linkedInConstants.pages.RECRUITER_PROFILE
            || candidate.lastScrapedBy === linkedInConstants.pages.PUBLIC_PROFILE
    }

    const _determineLastName = (input, existing) => {
        return input.lastName.lastName >= 3 ? input.lastName : existing ? existing.lastName : input.lastName;
    }

    const _saveCandidate = async (candidate) => {
        if (!(candidate && candidate.memberId)){
            throw new Error('Invalid candidate in _saveCandidate.  undefined object or missing memberId');
        }

        const fieldsNotToBeOverridden = ['positions', 'lastName', 'dateCreated', 'isJobSeeker', 'isActivelyLooking', 'jobSeekerScrapedDate', 'jobSeekerStartDate', 'jobSeekerEndDate']
        let existingCandidate = await _getCandidateByMemberId(candidate.memberId);

        _updateJobSeekerScrapedDateAccordingly(existingCandidate, candidate);

        if (_checkIfDataCameFromPublicProfileOrRecruiterProfilePage(candidate)){
            candidate.detailsLastScrapedDate = (new Date()).getTime();
        }

        if (existingCandidate){
            for (let k in candidate){
                if (fieldsNotToBeOverridden.indexOf(k) === -1 && candidate[k]){
                    existingCandidate[k] = candidate[k];
                }
            }

            existingCandidate.lastName = _determineLastName(candidate, existingCandidate);

            existingCandidate.positions = _mergePositions(existingCandidate.positions, candidate.positions);
            existingCandidate.isJobSeekerString = existingCandidate.isJobSeeker ? 'true' : 'false';
            return await candidateRepository.update(existingCandidate);
        }
        else {
            candidate.isJobSeekerString = candidate.isJobSeeker ? 'true' : 'false';
            return await candidateRepository.insert(candidate);
        }

    }

    const _saveCandidates = async (candidatesArray) => {
        for(let i = 0; i < candidatesArray.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await _saveCandidate(candidatesArray[i]);
        }
    }

    const _getCandidateByMemberId = async (memberId) => {
        const lookFor = !isNaN(memberId) ? Number.parseInt(memberId) : null;

        if (lookFor){
            return await candidateRepository.get(lookFor);
        }

        throw new Error(`${memberId} is not a valid memberId to search on`)
    }

    const _getEntireCandidateList = async () => {
        if (_entireCandidateList === null){
            _entireCandidateList = await candidateRepository.getAll();
        }

        return _entireCandidateList;
    }

    const _getSpecificListOfLinkedInMembers = async (memberIdArray) => {
        return await candidateRepository.getSubset(memberIdArray);
    }

    const _getCandidateList = async (memberIdArray = null) => {
        return memberIdArray ?
            await _getSpecificListOfLinkedInMembers(memberIdArray) :
            await _getEntireCandidateList();
    }

    const _loadLotsOfData = async (basedOnContact, fromId, toId) => {
        let counter = 0;
        let c = {...basedOnContact};

        for (let i = fromId; i < toId; i++) {
            c.memberId = i;
            counter += 1;

            // eslint-disable-next-line no-await-in-loop
            await candidateRepository.insert(c);
            if (counter >= 100){
                console.log('saved another 100');
                counter = 0;
            }
        }
    }

    const _lastNamesSearch = async (lNamesArray, searchObject) => {
        let totalFound = [];
        for (let i = 0; i < lNamesArray.length; i++){
            // eslint-disable-next-line no-await-in-loop
            const search = await candidateRepository.getByIndex('lastName', lNamesArray[i]);

            if (search && search.length > 0){
                totalFound = totalFound.concat(search);
            }
        }

        if (totalFound && totalFound.length){
            totalFound = totalFound.filter(f => f.firstName === searchObject.firstName);
        }

        if (totalFound && totalFound.length > 1 && searchObject.headline){
            const searchHeadline =  searchObject.headline.split("&amp;").join("&").split('&#x27;').join("'").toLowerCase();
            totalFound = totalFound.filter((t) => {
                const foundHeadline = t.headline.split("&amp;").join("&").split('&#x27;').join("'").toLowerCase();
                return foundHeadline.indexOf(searchHeadline) >= 0
            });
        }

        if (totalFound && totalFound.length > 1 && searchObject.linkedIn){
            const temp = totalFound.filter(t => t.linkedIn === searchObject.linkedIn);
            if (temp && temp.length > 0){
                totalFound = temp;
            }
        }

        if (totalFound.length > 1){
            const firstConnections = totalFound.filter((c) => {
                let result = false;
                if (c.alisonConnections){
                    for (let k in c.alisonConnections){
                        if (c.alisonConnections[k] === "1" || c.alisonConnections[k] === 1){
                            result = true;
                            break;
                        }
                    }
                }

                return result;
            });

            if (firstConnections && firstConnections.length > 0){
                totalFound = firstConnections;
            }
        }

        if (totalFound.length > 1 && searchObject.imageUrl){
            const imageUrls = totalFound.map(f => f.imageUrl);
            let closestImageMatch = tsString.getClosestMatch(searchObject.imageUrl, imageUrls);
            if (closestImageMatch && closestImageMatch.resultCompareString){
                totalFound = totalFound.filter(t => t.imageUrl === closestImageMatch.resultCompareString);
            }
        }
        return totalFound && totalFound.length === 1 ? totalFound[0] : null;
    }

    const _findConnection = async (searchObject, filterOnDateConnectionRequestAcceptanceRecorded = false) => {
        let result = null;
        if (!searchObject){
            return null;
        }

        if (searchObject.memberId) {
            let search = !isNaN(searchObject.memberId) ? Number.parseInt(searchObject.memberId) : searchObject.memberId;
            result = await candidateRepository.get(search);
            if (result){
                return result;
            }
        }

        if (searchObject.imageUrl){
            result = await candidateRepository.getByIndex('imageUrl', searchObject.imageUrl);
            if (result && result.length === 1){
                return result[0];
            }
        }

        const lNames = searchObject.lastName ? [searchObject.lastName, searchObject.lastName.substr(0, 1), `${searchObject.lastName.substr(0, 1)}.`] : [];

        if (searchObject.headline){
            result = await candidateRepository.getByIndex('headline', searchObject.headline);
            if (result && result.length > 0){
                result = result.filter(r => r.firstName === searchObject.firstName
                                    && lNames.length === 0 || lNames.indexOf(r.lastName) >= 0);

                if (result.length === 1){
                    return result[0];
                }
            }
        }

        return await _lastNamesSearch(lNames, searchObject);
    }

    const _searchForCandidate = async (searchFor) => {
        if (!isNaN(searchFor)){
            return await _getCandidateByMemberId(searchFor);
        }

        if (typeof searchFor !== "object") {
            throw new Error('searchForACandidate accepts a number or an object {[memberId:], firstName:"", lastName: "", headline: "", imageUrl:}')
        }

        return await _findConnection(searchFor);
    }

    const _getContractors = async () => {
       await _getEntireCandidateList();
       return _entireCandidateList.filter(c => c.isContractor);
    }

    const _getJobSeekers = async () => {
        return await candidateRepository.getByIndex('isJobSeekerString', 'true');
    }

    const _updateJobSeekerScrapedDateAccordingly = (existingCandidate, incomingCandidate) => {
        const icJobSeeker = (incomingCandidate.isJobSeeker || incomingCandidate.isActivelyLooking) || false;
        const ecJobSeeker = (existingCandidate && (existingCandidate.isJobSeeker || existingCandidate.isActivelyLooking)) || false;
        const nowDate = (new Date()).getTime();

        // isJobSeeker originates from the Recruiter Search Results page, only run this logic if the incomingCandidate
        // originated from that scraper.
        if (incomingCandidate.lastScrapedBy === linkedInConstants.pages.RECRUITER_SEARCH_RESULTS){
            // check if the existing candidate does not match what we've scraped
            if ((existingCandidate && ecJobSeeker !== icJobSeeker) || (existingCandidate && icJobSeeker && !existingCandidate.jobSeekerStartDate)){
                existingCandidate.isJobSeeker = icJobSeeker;
                if (icJobSeeker){
                    existingCandidate.jobSeekerStartDate = nowDate;
                    existingCandidate.jobSeekerEndDate = null;
                }
                else {
                    existingCandidate.jobSeekerEndDate = nowDate;
                }
            }

            // Check if saving a NEW candidate and they are a job seeker
            if ((!existingCandidate) && icJobSeeker){
                incomingCandidate.jobSeekerStartDate = nowDate;
                incomingCandidate.jobSeekerScrapedDate = nowDate;
            }
        }
    }

    const _doesCandidateMatchSkillsSearch = (candidate, arrayOfSkillSearch) => {
        // statistician.calculateMonthsSinceWorkedAtPosition
        let positions = candidate.positions;
        if (!Array.isArray(positions)){
            return false;
        }

        arrayOfSkillSearch.forEach((skillSearch) => {
            const ageFilter = skillSearch.months ? skillSearch.months : 24;
            const skillFilter = skillSearch.skill.toLowerCase().trim();

            positions = positions.filter((p) => {
                const ageOfPosition = statistician.calculateMonthsSinceWorkedAtPosition(p);
                if (ageOfPosition > ageFilter){
                    return false;
                }

                const positionSkills = p.skills || [];
                if (positionSkills.length > 0){
                    const skillMatch = positionSkills.filter((s) => {
                        const positionSkill = s.toLowerCase().trim();
                        return positionSkill === skillFilter
                    });

                    return skillMatch.length > 0;
                }

                return false;
            });
        });

        const doesCandidateMatch = positions.length > 0;
        return doesCandidateMatch;
    }

    const _writeCandidateMatchFilterStringToWindow = async (candidates) => {
        let str = '';
        let posStr = '';

        candidates.forEach((c) => {
            if (c.firstName && c.lastName){
                str += '"' + (c.lastName.length > 2 ? c.lastName : c.firstName) + '" OR ';

                let currentPosition = Array.isArray(c.positions) ? c.positions.filter(p => p.current === true) : [];
                currentPosition = currentPosition.length > 0 ? currentPosition[0] : null;

                if (currentPosition && currentPosition.title){
                    posStr += `"${currentPosition.title}" OR `;
                }
            }
        });

        if (str.length > 0){
            str = str.substr(0, str.length - 4);
            str = `\n AND (${str}) `
        }

        if (posStr.length > 0){
            posStr = posStr.substr(0, posStr.length - 4);
            posStr = `\n AND (${posStr}) `;

            str += posStr;
        }

        window.candidateMatchFilter = str;
    }

    const _searchOnSkills = async (arrayOfSkillSearch) => {
        const skillSearch = Array.isArray(arrayOfSkillSearch) ? arrayOfSkillSearch : [arrayOfSkillSearch];
        const allCandidates = await _getEntireCandidateList();

        const candidateMatch = allCandidates.filter((candidate) => {
            const candidateMatchesResult = _doesCandidateMatchSkillsSearch(candidate, skillSearch);
            return candidateMatchesResult;
        });

        if (candidateMatch && candidateMatch.length){
            _writeCandidateMatchFilterStringToWindow(candidateMatch);
        }

        console.log(`Number of candidate who match skillsSearch: ${candidateMatch.length}`)
        return candidateMatch;
    }

    const _saveContactInfo = async (candidateSearchValues, contactInfoData) => {
        if (contactInfoData && (contactInfoData.phoneNumbers || contactInfoData.emails)){
            const candidate = await _searchForCandidate(candidateSearchValues);

            if ((!candidate.email) && contactInfoData.emails && contactInfoData.emails.length){
                candidate.email = contactInfoData.emails[0];
                if (contactInfoData.emails.length > 1){
                    candidate.emailList = contactInfoData.emails;
                }
            }

            if ((candidate.phone) && contactInfoData.phoneNumbers){
                candidate.phone = contactInfoData.phoneNumbers[0];
                if (contactInfoData.phoneNumbers.length > 1){
                    candidate.phoneNumberList = contactInfoData.phoneNumbers;
                }
            }

            await _saveCandidate(candidate);
            return candidate;
        }
        return null;
    }

    const _getConfirmedTSSkillKeys = () => {
        const definition = tsConfirmCandidateSkillService.getTSConfirmedSkillsList();
        const keys = definition.map(d => d.key);

        console.log(keys);
        return keys;
    }

    const _searchForEmployees = async (companyIdOrName) => {
        const lookFor = companyIdOrName.toLowerCase();
        const allCandidates = await _getEntireCandidateList();


        const results = allCandidates.filter((c) => {
            if (c.positions && c.positions.length > 0){
                const currentPositions = c.positions.filter((p) => {return p.current === true || !p.endDateMonth});

                const found = currentPositions.find((p) => { return p.companyId === companyIdOrName || p.companyName.toLowerCase().indexOf(lookFor) >= 0; });
                return found ? true : false;
            }

            return false;
        });

        return results;
    }

    const _findRoles = (arrayOfCandidates, currentCompanyIdOrName, arrayOfThisAndThisOrThisAndThisArray, notArray) => {
        const coName = currentCompanyIdOrName.toLowerCase();

        return arrayOfCandidates.filter((c) => {

            let currentPositions = c.positions.filter((p) => {
                return (p.current === true || (!p.endDateYear))
                &&
                (p.companyId === currentCompanyIdOrName || (p.companyName && p.companyName.toLowerCase().indexOf(coName) >= 0));
            });

            const headline = ''; // c.headline && c.headline.toLowerCase ? c.headline.toLowerCase() : '';
            const currentTitle = headline.indexOf(currentCompanyIdOrName) >= 0 ? headline : currentPositions.map((p) => { return p.title ? p.title.toLowerCase() : ''}).join(' ');

            let result = false;
            for (let i = 0; i < arrayOfThisAndThisOrThisAndThisArray.length; i++){
                let thisCheck = true;
                const thisAndThis = arrayOfThisAndThisOrThisAndThisArray[i];

                for (let j = 0; j < thisAndThis.length; j++){
                   if (currentTitle.indexOf(thisAndThis[j]) === -1){
                       thisCheck = false;
                       break;
                   }
                }

                if (thisCheck === true){
                    if (notArray){
                        for (let n = 0; n < notArray.length; n++){
                            if (currentTitle.indexOf(notArray[n]) >= 0){
                                thisCheck = false;
                            }
                        }
                    }
                }

                if (thisCheck === true) {
                    result = true;
                    console.log(`${c.firstName} matched on: '${arrayOfThisAndThisOrThisAndThisArray[i].join(';')} '`)
                    break;
                }
            }

            return result;
        });
    }

    const _findBizDevelopmentContacts = async (companyIdOrName) => {
        const result = [];
        const companyCandidates = await _searchForEmployees(companyIdOrName);

        const ceo = _findRoles(companyCandidates, companyIdOrName, [['ceo'], ['chief', 'executive', 'officer'], ['owner'], ['founder'], ['president']], ['product owner', 'project owner', 'vice pres', 'content owner']);
        const cto = _findRoles(companyCandidates, companyIdOrName, [['cto'], ['cio'], ['chief information officer'], ['coo'], ['chief operating officer'], ['vp', ' it'], ['vp', 'technology'], ['vp', 'software'], ['vp', 'development'], ['vice pr', ' it'], ['vice pr', 'technology'], ['vice pr', 'software'], ['vice pr', 'development']], ['contractor', 'coordinator', 'director', 'operations', 'account manage', ' qa', 'instructor', 'cohort']);

        const allHr = _findRoles(companyCandidates, companyIdOrName, [['hr'], ['human'], ['people']], ['account manage', ' qa']);
        let hr = allHr.filter((h) => { return h.roleGuess === "Executive" || h.isManagement === true});

        if (hr.length === 0){
            hr = allHr
        }

        let devManagers = _findRoles(companyCandidates, companyIdOrName, [['director'], ['manager']] );
        devManagers = _findRoles(devManagers, companyIdOrName, [['software'], ['development'], ['application'], ['technology'], ['quality'], ['qa']])

        return {
            ceo,
            cto,
            hr,
            devManagers
        };

    }

    const _findCandidatesOnConfirmedSkills = async (confirmedSkillsFilter, writeToConsole = true) => {
        if ((!confirmedSkillsFilter) || Object.keys(confirmedSkillsFilter).length === 0){
            throw new Error("you need to provide a confirmedSkillsFilter");
        }

        const filterKeys = Object.keys(confirmedSkillsFilter);
        const allCandidates = await candidateRepository.getAll();
        const result = [];

        allCandidates.forEach((c) => {
            if (c.tsConfirmedSkills){
                let match = 0;

                for (let k = 0; k < filterKeys.length; k++){
                    const key = filterKeys[k];
                    if (c.tsConfirmedSkills[key] >= confirmedSkillsFilter[key]){
                        match += 1;
                    }
                }

                if (match === filterKeys.length){
                    result.push(c);
                }
            }
        });

        if (writeToConsole){
            result.forEach((c) => {
                const href = `https://www.linkedin.com${c.linkedInRecruiterUrl}`;
                let str = `${c.firstName} ${c.lastName} ${c.email || ''} ${c.phone || ''}.  ${href}`;
                console.log(str);
            });
        }

    }
    class CandidateController {
        saveContactInfo = _saveContactInfo;
        saveCandidate = _saveCandidate;
        saveCandidates = _saveCandidates;
        getCandidateList = _getCandidateList;
        getCandidate = _searchForCandidate;
        searchForCandidate = _searchForCandidate;
        searchForEmployees = _searchForEmployees;
        findBizDevelopmentContacts = _findBizDevelopmentContacts;
        getJobSeekers = _getJobSeekers;
        getContractors = _getContractors;
        searchOnSkills = _searchOnSkills;
        getConfirmedTSSkillKeys = _getConfirmedTSSkillKeys;
        findCandidatesOnConfirmedSkills = _findCandidatesOnConfirmedSkills;

        // loadLotsOfData = _loadLotsOfData;
    }

    window.candidateController = new CandidateController();
})();