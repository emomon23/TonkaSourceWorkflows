(() => {
    const _objectStoreName = 'candidate';
    const _keyPropertyName = 'memberId';

    const _mergePositions = (existingPositions, incomingPositions) => {
        const result = existingPositions ? existingPositions : [];
        if (!incomingPositions){
            return result;
        }

        incomingPositions.forEach((ip) => {
            const match = existingPositions.find((ep) => {
                return ep.companyId === ip.companyId
                && ep.startDateMonth === ip.startDateMonth
                && ep.startDateYear === ip.startDateYear;
            });

            if (match){
                if (ip.description && ip.description.length){
                    //eg. This will happend when a 'lite candidate' has their profile scraped
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

    const _saveCandidate = async (candidate) => {
        if (!(candidate && candidate.memberId)){
            throw new Error('Invalid candidate in _saveCandidate.  undefined object or missing memberId');
        }

        const fieldsNotToBeOverridden = ['positions', 'dateCreated']
        let existingCandidate = await baseIndexDb.getObjectById(_objectStoreName, candidate.memberId);

        //Trim positions to minimal data for storage
        candidate.positions  = _trimDownPositions(candidate.positions);

        if (existingCandidate){
            for (let k in candidate){
                if (fieldsNotToBeOverridden.indexOf(k) === -1){
                    existingCandidate[k] = candidate[k];
                }
            }

            existingCandidate.positions = _mergePositions(existingCandidate.positions, candidate.positions);
            return await baseIndexDb.updateObject(_objectStoreName, existingCandidate, _keyPropertyName);
        }
        else {
            return await baseIndexDb.insertObject(_objectStoreName, candidate, _keyPropertyName);
        }

    }

    const _saveCandidates = async (candidatesArray) => {
        for(let i=0; i<candidatesArray.length; i++){
            // eslint-disable-next-line no-await-in-loop
            await _saveCandidate(candidatesArray[i]);
        }
    }

    const _getCandidate = async (memberId) => {
        return await baseIndexDb.getObjectById(_objectStoreName, memberId);
    }

    const _getEntireCandidateList = async() => {
        return await baseIndexDb.getAll(_objectStoreName);
    }

    const _getSpecificListOfLinkedInMembers = async(memberIdArray) => {
        return await baseIndexDb.getObjectsByListOfKeys(_objectStoreName, memberIdArray);
    }

    const _getCandidateList = async(memberIdArray = null) => {
        return memberIdArray ?
            await _getSpecificListOfLinkedInMembers(memberIdArray) :
            await _getEntireCandidateList();
    }

    const _loadLotsOfData = async (basedOnContact, fromId, toId) => {
        let counter = 0;
        let c = {...basedOnContact};

        for (let i=fromId; i<toId; i++) {
            c.memberId = i;
            counter+=1;

            // eslint-disable-next-line no-await-in-loop
            await baseIndexDb.insertObject(_objectStoreName, c, 'memberId');
            if (counter >= 100){
                console.log('saved another 100');
                counter = 0;
            }
        }
    }

    const _searchOnName = async (lastName, firstName = null) => {
        const results = await baseIndexDb.getObjectsByIndex(_objectStoreName, 'lastName', lastName);

        if (results && results.length){
            return firstName ? results.filter(c => c.firstName === firstName) : results;
        }

        return [];
    }

    const _getJobSeekers = async () => {
        return await baseIndexDb.getObjectsByIndex(_objectStoreName, 'isJobSeeker', 'true');
    }

    class CandidateRepository {
        saveCandidate = _saveCandidate;
        saveCandidates = _saveCandidates;
        getCandidateList = _getCandidateList;
        getCandidate = _getCandidate;
        searchOnName = _searchOnName;
        getJobSeekers = _getJobSeekers;

        //loadLotsOfData = _loadLotsOfData;
    }

    window.candidateRepository = new CandidateRepository();
})();