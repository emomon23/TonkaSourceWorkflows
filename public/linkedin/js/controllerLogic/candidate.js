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

    const _trimDownPositions = (positions) => {
        return positions ? positions.map((p) => {
            const mappedPosition = {
                startDateMonth: p.startDateMonth,
                startDateYear: p.startDateYear,
                companyId: p.companyId,
                companyName: p.companyName,
                displayText: p.displayText,
                title: p.title,
            };

            if (p.endDateMonth) {
                mappedPosition.endDateMonth = p.endDateMonth;
                mappedPosition.endDateYear = p.endDateYear;
            }

            if (p.description && p.description.length){
                mappedPosition.description = p.description;
            }

            return mappedPosition;
        }) : [];
    }

    const _checkIfDataCameFromPublicProfileOrRecruiterProfilePage = (candidate) => {
        return candidate.lastScrapedBy === linkedInConstants.pages.RECRUITER_PROFILE
            || candidate.lastScrapedBy === linkedInConstants.pages.PUBLIC_PROFILE
    }

    const _saveCandidate = async (candidate) => {
        if (!(candidate && candidate.memberId)){
            throw new Error('Invalid candidate in _saveCandidate.  undefined object or missing memberId');
        }

        const fieldsNotToBeOverridden = ['positions', 'dateCreated', 'isJobSeeker', 'isActivelyLooking', 'jobSeekerScrapedDate', 'jobSeekerStartDate', 'jobSeekerEndDate']
        let existingCandidate = await _getCandidate(candidate.memberId);

        _updateJobSeekerScrapedDateAccordingly(existingCandidate, candidate);

        if (_checkIfDataCameFromPublicProfileOrRecruiterProfilePage(candidate)){
            candidate.detailsLastScrapedDate = (new Date()).getTime();
        }

        // Trim positions to minimal data for storage
        candidate.positions  = _trimDownPositions(candidate.positions);

        if (existingCandidate){
            for (let k in candidate){
                if (fieldsNotToBeOverridden.indexOf(k) === -1 && candidate[k]){
                    existingCandidate[k] = candidate[k];
                }
            }

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

    const _getCandidate = async (memberId) => {
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

    const _searchOnName = async (lastName, firstName = null) => {
        const results = await candidateRepository.getByIndex('lastName', lastName);

        if (results && results.length){
            return firstName ? results.filter(c => c.firstName === firstName) : results;
        }

        return [];
    }

    const _searchForCandidate = async (searchFor) => {
        if (!searchFor){
            return null;
        }

        if (!isNaN(searchFor)){
            return await _getCandidate(searchFor);
        }

        const names = searchFor.split ? searchFor.split(' ') : null;
        if (!names){
            return null;
        }

        let found = null;

        if (names.length > 1){
            found = await _searchOnName(names[names.length - 1], names[0]);

        }
        else {
            found = await _searchOnName(names[0]);
        }

        return found && found.length === 1 ? found[0] : null;
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

    class CandidateController {
        saveCandidate = _saveCandidate;
        saveCandidates = _saveCandidates;
        getCandidateList = _getCandidateList;
        getCandidate = _getCandidate;
        searchOnName = _searchOnName;
        searchForCandidate = _searchForCandidate;
        getJobSeekers = _getJobSeekers;
        getContractors = _getContractors;

        // loadLotsOfData = _loadLotsOfData;
    }

    window.candidateController = new CandidateController();
})();