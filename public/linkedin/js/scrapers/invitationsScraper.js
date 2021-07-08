(() => {

    let _candidates = {};

    const _invitations_displayEmailAndPhone = () => {
        for (let fullNameString in _candidates){
            const candidate = _candidates[fullNameString];
            const selector = `li:contains('${fullNameString}')`;
            const container = $(selector)[0];

            if (container && candidate) {
                tsConfirmCandidateSkillService.displayPhoneAndEmail(container, candidate);
            }
        }
    }

    const _getCandidatesFromPage = async () => {
        const profileNames = $('span[class*="invitation-card__title"]').toArray().map(r => $(r).text().replace(/\\n/, '').trim());
        for (let i = 0; i < profileNames.length; i++){
            const searchFor = tsString.parseOutFirstAndLastNameFromString(profileNames[i]);
            // eslint-disable-next-line no-await-in-loop
            const candidate = await candidateController.searchForCandidate(searchFor);

            if (candidate){
                _candidates[profileNames[i]] = candidate;
            }
        }
    }

    const _invitations_delayedReady = async () => {
        await tsCommon.sleep(2000);

        const currentPage = linkedInCommon.whatPageAmIOn()
        if (currentPage === linkedInConstants.pages.INVITATIONS) {
            await _getCandidatesFromPage();
            _invitations_displayEmailAndPhone();
        }
    }

    $(document).ready(() => {
        _invitations_delayedReady();
    })

})();
