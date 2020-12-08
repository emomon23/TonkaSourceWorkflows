(() => {
    let _currentPage = '';
    let _candidateFound = null;

    const _getCompanyId = () => {
        const href = window.location.href;

        const matches = href.match(new RegExp('/recruiter/company/(\\d+)'));
        if (matches && matches.length > 0) {
            return matches[1];
        }
        return null;
    }

    const _scrapeCompany = async () => {
        const companyId = _getCompanyId();

        if (companyId) {

            const companySummary = await companiesController.getSummary(companyId) || { companyId };


            _scrapeName(companySummary);

            // Scrape Industry, Size and Website
            _scrapeDetails(companySummary);

            // Add a link to jobs in the United States
            companySummary.usaJobsUrl = 'https://www.linkedin.com/jobs/search/?f_C=' + companyId + '&f_CR=103644278&locationId=OTHERS.worldwide';

            // Add a link to jobs in MN
            companySummary.mnJobsUrl = 'https://www.linkedin.com/jobs/search/?f_C=' + companyId + '&f_PP=103039849';

            delete companySummary.usaJobUrl;

            try {
                companiesController.saveCompanySummary(companySummary);
            } catch (e) {
                tsCommon.log(e.message, 'ERROR');
            }
            return companySummary;
        }
        return null;
    }

    const _scrapeDetails = (company) => {
        const detailHeaderElements = $(linkedInSelectors.recruiterCompanyPage.COMPANY_DETAIL_HEADERS);
        const detailElements = $(linkedInSelectors.recruiterCompanyPage.COMPANY_DETAILS);

        for(let i = 0; i < detailHeaderElements.length; i++) {
            const detailType = $(detailHeaderElements[i]).text();
            const detail = $(detailElements[i]).text();

            if (detailType === 'Industry') {
                company.industry = detail;
            } else if (detailType === 'Type') {
                company.type = detail;
            } else if (detailType === 'Company Size') {
                company.size = detail;
            } else if (detailType === 'Website') {
                company.website = detail;
            }
        }
    }

    const _scrapeName = (company) => {
        const name = $(linkedInSelectors.recruiterCompanyPage.COMPANY_NAME).text();
        company.nam = name;
    }

    class LinkedInRecruiterCompanyScraper {
        getCompanyId = _getCompanyId;
        scrapeCompany = _scrapeCompany;
    }

    window.linkedInRecruiterCompanyScraper = new LinkedInRecruiterCompanyScraper();

    const _delayReady = async () => {
        await tsCommon.sleep(500);

        _currentPage = linkedInCommon.whatPageAmIOn()
        if (_currentPage === linkedInConstants.pages.RECRUITER_COMPANY) {
            await _scrapeCompany();
        }
    }

    $(document).ready(() => {
       _delayReady();
    })
})();