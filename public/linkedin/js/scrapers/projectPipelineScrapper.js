(() => {
    let _pipelineRowElements = [];
    let _pageCandidates = [];
    const _totalCandidates = [];

    const _findCandidateFromRow = (row) => {
        const checkBox = $(row).find('input[class*="prospect-checkbox"]')[0];
        let memberId = checkBox ? $(checkBox).attr('data-member-id') : null;
        memberId = !isNaN(memberId) ? Number.parseInt(memberId) : memberId;

        if (memberId){
            return _totalCandidates.find(c => c.memberId === memberId);
        }

        return null;
    }

    const _shouldWeCaptureContactInfoForThisContact = (candidate) => {
        if (candidate.email && candidate.email.length > 0){
            return false;
        }

        if (candidate.phone){
            if (!isNaN(candidate.phone)){
                return false;
            }

            return !candidate.phone.length > 0;
        }

        return true;
    }

    const _collectContactInformation = async (howMany = 50) => {
        let captureCount = 0;

        for (let i = 0; i < howMany; i++){
            for(let r = 0; r < _pipelineRowElements.length; r++){
                const row = _pipelineRowElements[r];
                const candidate = _findCandidateFromRow(row);

                if (_shouldWeCaptureContactInfoForThisContact(candidate)){
                    // we should gather the contact info for this one
                    const profileLink = $(row).find('a[class*="title"][href*="recruiter/profile"]')[0];
                    if (profileLink){
                       const href = `https://www.linkedin.com${$(profileLink).attr('href')}`;
                       const winRef = window.open(href);

                       // eslint-disable-next-line no-await-in-loop
                       await tsCommon.sleep(4000);

                       $(winRef['document']).find('li[class*="contact-info"] button').click();
                       captureCount += 1;

                       // eslint-disable-next-line no-await-in-loop
                       await tsCommon.sleep(3000);

                       winRef.close();

                       // eslint-disable-next-line no-await-in-loop
                       await tsCommon.randomSleep(40000, 80000);
                    }
                }
            }

            // eslint-disable-next-line no-await-in-loop
            await tsCommon.sleep(10000);

            if (!linkedInCommon.advanceToNextLinkedInResultPage()){
                break;
            }
        }

        tsCommon.log(`Pipeline Contact Info: DONE!  CaptureCount: ${captureCount}`);
    }

    const _getMemberIdsFromPipelinePage = async () => {
        const checkBoxes = Array.from(document.querySelectorAll('input[class*="prospect-checkbox"]'));
        return checkBoxes.filter(c => $(c).attr('data-member-id') ? true : false)
                          .map((c) => {
                                const memberId = $(c).attr('data-member-id');
                                return isNaN(memberId) ? memberId : Number.parseInt(memberId);
                            });
    }
    class TSProjectPipelineScrapper {
        collectionContactInformation = _collectContactInformation;
        getMemberIdsFromPipelinePage = _getMemberIdsFromPipelinePage;
    }

    window.tsProjectPipelineScrapper = new TSProjectPipelineScrapper();

    const _delayedDocReady_ProjectPipelineScrapper = async () => {
        await tsCommon.sleep(2000);
        _pageCandidates = [];
        _pipelineRowElements = $('div[class*="row"] div[class*="row-inner"]');

        for (let i = 0; i < _pipelineRowElements.length; i++){
            const div = $(_pipelineRowElements[i]);
            let memberId = $(div).find('input[class*="prospect-checkbox"]').attr('data-member-id');
            memberId =  !isNaN(memberId) ? Number.parseInt(memberId) : memberId;

            // eslint-disable-next-line no-await-in-loop
            const candidate = await candidateRepository.get(memberId);

            if (candidate){
                _totalCandidates.push(candidate);
                _pageCandidates.push(candidate);
            }
        }

        $('a[class*="page-link"]').click(() => {
            _delayedDocReady_ProjectPipelineScrapper();
        });
    }

    $(document).ready(() => {
        if (linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.PROJECT_PIPELINE) {
            _delayedDocReady_ProjectPipelineScrapper();
        }
    })
})();