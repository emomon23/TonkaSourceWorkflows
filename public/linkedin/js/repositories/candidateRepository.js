(() => {
    const _objectStoreName = 'candidate';
    const _keyPropertyName = 'memberId';

    const _saveCandidate = async (candidate) => {
         const {
            alisonConnections,
            firstName,
            lastName,
            city,
            state,
            headline,
            isJobSeeker,
            memberId,
            lastInMailed,
            lastMessaged,
            grades,
            technicalYearString
        } = candidate;

        const slimmedCandidate =  {
            alisonConnections,
            firstName,
            lastName,
            city,
            state,
            headline,
            isJobSeeker,
            memberId,
            lastInMailed,
            lastMessaged,
            grades: grades || [],
            technicalYearString: technicalYearString || ''
        };

        slimmedCandidate.isJobSeeker = slimmedCandidate.isJobSeeker || candidate.isActivelyLooking;

        slimmedCandidate.positions = candidate.positions ? candidate.positions.map((p) => {
            return {
                startDateMonth: p.startDateMonth,
                startDateYear: p.startDateYear,
                endDateMonth: p.endDateMonth ? p.endDateMonth : null,
                endDateYear: p.endDateYear ? p.endDateYear : null,
                companyId: p.companyId,
                companyName: p.companyName,
                displayText: p.displayText,
                title: p.title,
                description: p.description || ''
            }
        }) : [];

        return await baseIndexDb.saveObject(_objectStoreName, slimmedCandidate, _keyPropertyName);
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

    const _searchOnLastName = async (lastName) => {
        return await baseIndexDb.getObjectsByIndex(_objectStoreName, 'lastName', lastName);
    }

    const _getJobSeekers = async () => {
        return await baseIndexDb.getObjectsByIndex(_objectStoreName, 'isJobSeeker', 'true');
    }

    class CandidateRepository {
        saveCandidate = _saveCandidate;
        saveCandidates = _saveCandidates;
        getCandidateList = _getCandidateList;
        getCandidate = _getCandidate;
        searchOnLastName = _searchOnLastName;
        getJobSeekers = _getJobSeekers;

        //loadLotsOfData = _loadLotsOfData;
    }

    window.candidateRepository = new CandidateRepository();
})();