(() => {

    const _saveAssignment = async (assignmentObject) => {
        await assignmentRepository.save(assignmentObject);
    }

    const _addCandidateToProjectIsMissing = async (tsAssignment, candidate) => {
        const candidates = tsAssignment.candidates || [];
        if (!candidates.find(c => c.memberId === candidate.memberId)){
            candidates.push(candidate);
            tsAssignment.candidates = candidates;
            await assignmentRepository.update(tsAssignment);
        }
    }

    const _getAssignments = async () => {
        const result = await assignmentRepository.getAll();

        for (let r = 0; r < result.length; r++){
            let liteCandidates = result[r].candidates || [];

            for (let i = 0; i < liteCandidates.length; i++){
                // eslint-disable-next-line no-await-in-loop
                const deepCandidate = await candidateRepository.get(liteCandidates[i].memberId);

                liteCandidates[i].candidateRecord = deepCandidate;
            }
        }

        return result;
    }

    const _getOrCreateAssignment = async (projectName) => {
        let result = {id: projectName, name: projectName};

        let matches = await assignmentRepository.getByIndex('name', projectName);
        if (matches.length > 1){
            console.error(`TS ERROR: To many assignments in a name of ${projectName}`);
            return null;
        }

        if (matches.length === 1){
            result = matches[0];
        }
        else {
            await assignmentRepository.insert(result);
        }

        return result;
    }

    class AssignmentController {
        saveAssignment = _saveAssignment;
        getOrCreateAssignment = _getOrCreateAssignment;
        getAssignments = _getAssignments;
        addCandidateToProjectIsMissing = _addCandidateToProjectIsMissing;
    }

    window.assignmentController = new AssignmentController();
})();