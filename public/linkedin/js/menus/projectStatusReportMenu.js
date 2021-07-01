(() => {
    let _assignments = [];
    let _contentContainer = null;
    let _baseContainer = null;

    const _getPublicProfile = async (e) => {
        const anchor = $(e.target)[0] || e;

        const memberId = $(anchor).attr('memberId');
        const linkedInPublicProfile =  $(anchor).attr('linkedInUrl');
        const recruiterProfile = $(anchor).attr('linkedInRecruiterUrl');
        const text = $(anchor).text().replace(':|', ':)');

        if (linkedInPublicProfile.length === 0){
            // eslint-disable-next-line no-alert
            if (recruiterProfile.length){
                const profileWindow = window.open(recruiterProfile);
                await tsCommon.sleep(1000);
                let publicProfileAnchor = null;

                for (let i = 0; i < 16; i++){
                    publicProfileAnchor = $(profileWindow.document).find('a[href*="com/in/"]:contains("Public Profile")');
                    if (publicProfileAnchor && publicProfileAnchor.length){
                        publicProfileAnchor  = publicProfileAnchor[0];
                        break;
                    }
                    else {
                        publicProfileAnchor = null;
                    }

                    // eslint-disable-next-line no-await-in-loop
                    await tsCommon.sleep(500);
                }

                if (!publicProfileAnchor){
                    return;
                }
                const publicProfileUrl = $(publicProfileAnchor).attr('href');

                if (publicProfileUrl && publicProfileUrl.length){
                    if ((await candidateController.updatePublicProfileUrl(memberId, publicProfileUrl))){
                        $(anchor).attr('linkedInUrl', publicProfileUrl)
                                 .text(`${text}`);
                    }
                }

                profileWindow.close();
            }
            return false;
        }
        else {
            window.open(linkedInPublicProfile);
        }
    }

    const _renderAssignmentCandidateRow = (gridElement, c) => {
        const candidate = c.candidateRecord;
        const row = $(document.createElement('div'))

        $(gridElement).append(row);

        let fullName = candidate.linkedIn ? `:)  ` : candidate.linkedInRecruiterUrl ? ':|  ' : ':(  ';
        fullName += `${candidate.firstName} ${candidate.lastName}`;

        $(tsUICommon.createLink(row, '#', fullName, null, _getPublicProfile))
                .attr('memberId', candidate.memberId)
                .attr('linkedInRecruiterUrl', candidate.linkedInRecruiterUrl || '')
                .attr('linkedInUrl', candidate.linkedIn || '')
    }

    const _renderAssignmentCandidatesGrid = async (val) => {
        $('.assignmentStatusReportGrid').remove();

        await tsCommon.sleep(100);

        if (val){
            const gridContainer = $(document.createElement('div'))
                                    .attr('class', 'assignmentStatusReportGrid');

            $(_contentContainer).append(gridContainer);

            const selectedAssignment = _assignments.find(a => a.name === val);
            const candidates = selectedAssignment.candidates || [];

            candidates.forEach((c) => {
                _renderAssignmentCandidateRow(gridContainer, c);
            });
        }
    }

    const _assignmentSelected = (e) => {
        const val = $(e.target).val();
        _renderAssignmentCandidatesGrid(val);
    }

    const _renderAssignmentsDropdownBox = () => {
        // (container, labelAttributes, inputAttributes)
        const dropdownFormItem = tsUICommon.createInput(_contentContainer, {text:'Assignments', class:'tsControl tsAssignments'}, {type:'select'});
        const {label, input } = dropdownFormItem;

        input.addItem('0', 'Please Select');

        _assignments.forEach((a) => {
            input.addItem(a.id, a.name);
        });

        $(input).change(_assignmentSelected);
    }

    const _display = async () => {
        _assignments = await assignmentController.getAssignments();

        const containers = baseMenu.createSearchContainer('jobSearchContainer', 'job-search-container');
        _contentContainer = containers.searchContainer;
        _baseContainer = containers.baseContainer;

        _renderAssignmentsDropdownBox();
    }

    const _menuOption = () => {
        return $(document.createElement('div'))
            .attr('class', 'ts-menu-item')
            .click(_display)
            .text("Proj. Status Reports");
    }
    class ProjectStatusReportMenu {
        menuOption = _menuOption;
    }

    window.projectStatusReportMenu = new ProjectStatusReportMenu();
})();