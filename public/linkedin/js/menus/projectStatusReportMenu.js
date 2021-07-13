(() => {
    const _ip = {};

    const _styles = `.table {
        display: flex;
        flex-flow: column nowrap;
        font-size: 15px;
        margin: 0.5rem;
        line-height: 1.5;
        border-bottom: 1px solid #d0d0d0;
        flex: 1 1 auto;
    }

    .th {
        display: none;
        font-weight: 700;
        background-color: #f2f2f2;
    }

    .tr {
        width: 100%;
        display: flex;
        flex-flow: row nowrap;
    }

    .tr:nth-of-type(even) {
        background-color: #f2f2f2;
    }

    .tr:nth-of-type(odd) {
        background-color: #ffffff;
    }

    .td {
        display: inline-grid;
        flex-flow: row nowrap;
        flex-grow: 1;
        flex-basis: 0;
        padding: 0.5em;
        word-break: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0px;
        white-space: nowrap;
        border-bottom: 1px solid #d0d0d0;
    }

    .ts-ui-common-label {
        margin-right:5px
    }

    .assignmentData {
        margin-right:15px;
    }

    .assignmentInputsContainer {
        margin-top:25px
    }
    `

    const _tableHtml = `<div class='tr th'>
        <div class="td">
            Candidate
        </div>
        <div class="td">
           Week 1
        </div>
        <div class="td">
            Week 2
        </div>
        <div class="td">
            Week 3
        </div>
        <div class="td">
            Week 4
        </div>
        <div class="td">
            Week 5
        </div>
        <div class="td">
            Week 6
        </div>
    </div>`

    let _assignments = [];
    let _contentContainer = null;
    let _baseContainer = null;
    let _selectedAssignment = null;

    const _candidateWeekStatusChanged = (e) => {
        const cid = $(e.target).attr('cid');
        const week = 'week' + $(e.target).attr('week');
        const value = $(e.target).val();

        // eslint-disable-next-line eqeqeq
        const projectCandidate = _selectedAssignment.candidates.find(c => c.memberId == cid);

        if (projectCandidate){
            if (!projectCandidate[week]){
                projectCandidate[week] = {};
            }

            projectCandidate[week].status = value;
            assignmentController.saveAssignment(_selectedAssignment);
        }
        else {
            // eslint-disable-next-line no-alert
            alert(`Error: can't find ${cid} candidate in _selectedAssignment`);
        }
    }

    const _reasonLinkClick = (e) => {
        const cid = $(e.target).attr('cid');
        const week = 'week' + $(e.target).attr('week');

         // eslint-disable-next-line eqeqeq
         const projectCandidate = _selectedAssignment.candidates.find(c => c.memberId == cid);

         if (projectCandidate){
            if (!projectCandidate[week]){
                projectCandidate[week] = {};
            }

            const weekObject = projectCandidate[week];
            let note = weekObject.reason || '';
            // eslint-disable-next-line no-alert
            note = prompt(`Reason for ${projectCandidate.candidateRecord.firstName} for ${week}`, note);
            if (note === null){
                return;
            }

            weekObject.reason = note;
            assignmentController.saveAssignment(_selectedAssignment);
            const text = weekObject.reason.length ? "Reason *" : "Reason";
            $(e.target).text(text);
         }
         else {
             // eslint-disable-next-line no-alert
             alert(`Error: can't find ${cid} candidate in _selectedAssignment`);
         }
    }

    const _renderTableAndHeader = () => {
        const styleSheet = document.createElement('style');
        styleSheet.type = "text/css"
        styleSheet.innerText = _styles
        document.head.appendChild(styleSheet)

        const grid = $(document.createElement('div'))
                            .attr('id', 'projectCandidatesGrid')
                            .attr('class', 'table')
                            .html(_tableHtml);

        $(_contentContainer).append(grid);
    }

    const _renderStatusDropDowns = async () => {
        const cells = $('.weekCell').toArray();

        cells.forEach((c) => {
            const cid = $(c).attr('cid');
            const week = $(c).attr('week');

            const html = `<div>
                <select class='assignmentCandidateStatus' cid='${cid}' week='${week}'>
                    <option value='Identified'>Please select</option>
                    <option value='Contacted'>Contacted</option>
                    <option value='Presented Position'>Presented Position</option>
                    <option value='Candidate Not Interested'>Candidate Not Interested</option>
                    <option value='Disqualified By Tonka Source'>Disqualified By Tonka Source</option>
                    <option value='Waiting on Resume'>Waiting on Resume</option>
                    <option value='Presented, waiting on Client'>Presented, waiting on client</option>
                    <option value='Disqualified by Client'>Disqualified by Client</option>
                    <option value='Interview Scheduled'>Interview Scheduled</option>
                    <option value='Offer made'>Offer made</option>
                    <option value='Offer rejected by Candidate'>Offer rejected by candidate</option>
                </select>
            </div>
            <div>
                <a href='#' class='reason' cid='${cid}' week='${week}'>Reason</a>
            </div>`;

            $(c).html(html);
        });

        await tsCommon.sleep(500);

        _selectedAssignment.candidates.forEach((c) => {
            for (let i = 1; i < 6; i++){
                const key = `week${i}`;
                const weekObject = c[key];
                let selector = '';

                if (weekObject) {
                    if (weekObject.status){
                        selector = `select[cid*="${c.memberId}"][week*="${i}"]`;
                        const dropdown = $(selector)[0];

                        selector = `option[value*="${weekObject.status}"]`;
                        const option = $(dropdown).find(selector)[0];
                        $(option).attr('selected', 'selected');
                    }

                    if (weekObject.reason && weekObject.reason.length){
                        selector = `a[cid*="${c.memberId}"][week*="${i}"]`;
                        const anchor = $(selector)[0];

                        if (anchor){
                            $(anchor).text('Reason *');
                        }
                    }
                }
            }
        })
    }

    const _generateStatusReport = async () => {
        // eslint-disable-next-line no-alert
        alert("Generate status report to be implemented");
    }

    const _renderCandidateRow = (projectCandidate) => {
        const candidate = projectCandidate.candidateRecord;
        const cid = candidate.memberId;

        const rowHtml = `
        <div class="td" id='${cid}_name'>
            <span id='${cid}_name'></span>
        </div>
        <div class="td weekCell" week='1' cid=${cid}'>

        </div>
        <div class="td weekCell" week='2' cid=${cid}'>

        </div>
        <div class="td weekCell" week='3' cid=${cid}>

        </div>
        <div class="td weekCell" week='4' cid=${cid}>

        </div>
        <div class="td weekCell" week='5' cid=${cid}>

        </div>
        <div class="td weekCell" week='6' cid=${cid}>

        </div>
    `

    const div = $(document.createElement('div'))
                    .attr('class', 'tr candidateRow');

        $(div).html(rowHtml);
        $('#projectCandidatesGrid').append(div);

        let fullName = candidate.linkedIn ? `:)  ` : candidate.linkedInRecruiterUrl ? ':|  ' : ':(  ';
        fullName += `${candidate.firstName} ${candidate.lastName}`;

        const spanSelector = `#${cid}_name`;
        const span = $(spanSelector);

        $(tsUICommon.createLink(span, '#', fullName, null, _getPublicProfile))
                .attr('memberId', candidate.memberId)
                .attr('linkedInRecruiterUrl', candidate.linkedInRecruiterUrl || '')
                .attr('linkedInUrl', candidate.linkedIn || '')

    }

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


    const _renderAssignment = async () => {
        $('.candidateRow').remove();
        await tsCommon.sleep(50);

        if (_selectedAssignment){
            $(_ip.title).val(_selectedAssignment.title);
            $(_ip.startDate).val(_selectedAssignment.startDate || '');
            $(_ip.salary).val(_selectedAssignment.salary || '');
            $(_ip.searchParams).val(_selectedAssignment.searchParams || '');
            $(_ip.factsForClient).val(_selectedAssignment.factsForClient || '');
            $(_ip.neededByClient).val(_selectedAssignment.neededByClient || '');

            const candidates = _selectedAssignment.candidates || [];
             candidates.forEach((c) => {
                 _renderCandidateRow(c);
             });

             _renderStatusDropDowns();
             $('.assignmentCandidateStatus').bind('change', _candidateWeekStatusChanged);
             $('.reason').bind('click', _reasonLinkClick);
         }
    }

    const _assignmentSelected = (e) => {
        const val = $(e.target).val();
        _selectedAssignment = _assignments.find(a => a.name === val);

        if (!(_selectedAssignment.title && _selectedAssignment.title.length)){
            _selectedAssignment.title = val;
        }

        _renderAssignment();
    }

    const _renderAssignmentsDropdownBox = () => {
        // (container, labelAttributes, inputAttributes)
        const dropdownFormItem = tsUICommon.createInput(_contentContainer, {text:'Assignments', class:'tsControl tsAssignments'}, {type:'select', id:'ts_assignmentList'});
        const {label, input } = dropdownFormItem;

        input.addItem('0', 'Please Select');

        _assignments.forEach((a) => {
            input.addItem(a.id, a.name);
        });

        $(input).change(_assignmentSelected);
    }

    const _renderAssignmentInputs = () => {
        // createInput(container, labelAttributes, inputAttributes);
        // title | start date | rate - salary | search params | facts to be aware of | needed from client

        const div = $(document.createElement('div'))
                        .attr('class', 'assignmentInputsContainer')
                        .attr('id', 'assignmentInputsContainer')

        $(_contentContainer).append(div);

        const controls = [
            {text: 'Title', id: 'title', class:'assignmentData', style:'width:600px'},
            {text: 'Start Date', id: 'startDate', type:'date', class:'assignmentData', style:'width:120px'},
            {text: 'Rate/Salary', id: 'salary', class:'assignmentData'},
            {text: 'Search Params', block:'true', id: 'searchParams', type:'textarea', rows:5, cols:'15', class:'assignmentData'},
            {text: 'Facts for Client', block:'true', id: 'factsForClient', class:'assignmentData', style:'width:900px; margin-top:5px'},
            {text: 'Needed from Client', block:'true', id: 'neededFromClient', class:'assignmentData', style:'width:900px; margin-top:5px; margin-bottom:5px'}
        ]


        controls.forEach((ctrl) => {
            const label = {text: ctrl.text};
            const input = _.omit(ctrl, ['text']);

            tsUICommon.createInput(div, label, input);
        })

        tsUICommon.createButton({container: div, text:'Gen Status Report', onclick:_generateStatusReport});

        _ip.title = $('#title')[0];
        _ip.startDate = $('#startDate')[0];
        _ip.salary = $('#salary')[0];
        _ip.searchParams = $('#searchParams')[0];
        _ip.factsForClient = $('#factsForClient')[0];
        _ip.neededByClient = $('#neededByClient')[0];

        $('.assignmentData').blur((e) => {
            const val = $(e.target).val();
            const key = $(e.target).attr('id');

            if (_selectedAssignment){
                _selectedAssignment[key] = val;
                assignmentController.saveAssignment(_selectedAssignment);
            }
        });
     }

    const _display = async () => {
        _assignments = await assignmentController.getAssignments();

        const containers = baseMenu.createSearchContainer('jobSearchContainer', 'job-search-container');
        _contentContainer = containers.searchContainer;
        _baseContainer = containers.baseContainer;

        _renderAssignmentsDropdownBox();
        _renderAssignmentInputs();
        _renderTableAndHeader();
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