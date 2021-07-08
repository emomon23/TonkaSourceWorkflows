(() => {

    const _saveAssignment = async (assignmentObject) => {
        await assignmentRepository.save(assignmentObject);
    }

    const _mergePipelineCandidateWithProjectCandidate = (projectCandidate, pipelineCandidate) => {
        if (!projectCandidate.dateAddedToProject && pipelineCandidate.dateAddedToProject){
            projectCandidate.dateAddedToProject  =  pipelineCandidate.dateAddedToProject;
        }

        if (!projectCandidate.dateFirstContacted && pipelineCandidate.dateFirstContacted){
            projectCandidate.dateFirstContacted  =  pipelineCandidate.dateFirstContacted;
        }

        if (!projectCandidate.dateReplied && pipelineCandidate.dateReplied){
            projectCandidate.dateReplied  =  pipelineCandidate.dateReplied;
        }

        projectCandidate.linkedInStatus = pipelineCandidate.linkedInStatus;
        projectCandidate.accepted = pipelineCandidate.accepted;
    }

    const _updateProjectCandidate = async (tsAssignment, pipelineCandidate) => {
        const candidates = tsAssignment.candidates || [];

        const projectCandidate = candidates.find(c => c.memberId === pipelineCandidate.memberId);

        if (projectCandidate){
            _mergePipelineCandidateWithProjectCandidate(projectCandidate, pipelineCandidate);
        }
        else {
            candidates.push(pipelineCandidate);
            tsAssignment.candidates = candidates;

        }

        await assignmentRepository.update(tsAssignment);

        // update recruiter profile url
        if (pipelineCandidate.linkedInRecruiterUrl) {
            const dbCandidate = await candidateRepository.get(pipelineCandidate.memberId);
            dbCandidate.linkedInRecruiterUrl = pipelineCandidate.linkedInRecruiterUrl;
            await candidateRepository.update(dbCandidate);
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
        updateProjectCandidate = _updateProjectCandidate;
    }

    window.assignmentController = new AssignmentController();
})();