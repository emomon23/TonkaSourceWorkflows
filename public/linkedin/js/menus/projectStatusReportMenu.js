(() => {
    let _assignments = [];
    let _contentContainer = null;
    let _baseContainer = null;

    const _renderAssignmentCandidateRow = (gridElement, c) => {
        const candidate = c.candidateRecord;
        const div = $(document.createElement('div'))
                        .text(`${candidate.firstName} ${candidate.lastName}`);

        $(gridElement).append(div);
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