(function () {
    const _contactInfoPage = {
        CONTACT_INFO_CONTAINER: 'div[class*="pv-profile-section__section-info"]',
        PHONE_SECTION: 'section[class*="ci-phone"]',
        EMAIL_SECTION: 'section[class*="ci-email"]',
        CLOSE: 'button[aria-label*="Dismiss"]'
    }

    const _recruiterProfilePage = {
        fullName: 'div[class*="profile-info"] h1',
        saveButton: 'div[class*="profile-actions"] button[class*="save-btn"]',
        skillsList: '#profile-skills div ul[class*="skills"]',
        aboutSummary: '#profile-summary',
        experienceSection: '#profile-experience',
        experienceSectionPositions: '#profile-experience div[class*="module-body"] ul li[class*="position"]',
        headline: 'div[class*="info-container"] ul li[class*="title"]',
        imageUrl: 'div[class*="module-body"] img[alt*="photo"]',
        positionCompanyLink: 'div[class*="position-header"] h5 a',
        positionDescription: 'p[class*="description"]',
        profileId: 'input[name*="profile-id"]',
        profilePrimaryContent: '#primary-content',
        publicProfileLink: 'a:contains("Public Profile")',
        topCard: 'div[class*="primary-module"]'
    }

    const _searchResultsPage = {
        BADGES: 'div[class*="badges"]',
        addToProjectButton: (memberId) => { return `#search-result-${memberId} button:contains("Save profile to current project")`; },
        searchFilterCategories: 'ul[class*="pill"]',
        searchFilterValues: 'span[class*="pill-text"]',
        sendInMail: 'button[data-action*="inmail"][class*="primary-action"]'
    }

    const _publicProfilePage = {
        CONTACT_INFO_LINK: 'a[data-control-name*="contact_see_more"]',
        connectionRequestModal : {
            connectionRequestDoneButtons: ['button[aria-label=“Done”]', 'button span:contains("Done")'],
            connectionRequestModal: 'div[data-test-modal]',
            connectionNoteTextEntries: ['textarea[name*=“message”]', '#custom-message', 'textarea']
        },
        linkToRecruiterProfile: 'a[href*="/recruiter/profile/',
        connectWithButton: 'button[aria-label*="Connect with"]',
        connectionNoNoteSendButton: 'button[aria-label*="Send now"]',

        messageModal: {
            textEntries: 'div[class*="msg-form__contenteditable"]',
            sendButtons: 'button[class*="msg-form__send-button"]',
            leftActionSection: 'div[class*="msg-form__left-actions"]',
            activeMessageModalHeader: 'h4 span',
            memberProfileFullNameSelectors: ['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")'],
            multipleMessageRecipientPills: 'span[class*="artdeco-pill__text"]',
        },

        experience: {
            experienceSection: '#experience-section',
            positionListItems: '[class*="experience-section"] li',
            seeMorePositions: 'button[class*="see-more-inline"]:contains("more experiences")',
            showMoreJobDescriptionText: 'button[class*="show-more-text"]:contains("see more")',
            positionTitle: 'h3',
            employer: 'p:contains("Company Name")',
            dates:  'h4:contains("Dates Employed")',
            location: 'ul[class*="pv-top-card"]',
            experienceDescription: 'div[class*="extra-details"] p[class*="show-more-text"]'
        },

        fullName: 'ul[class*="pv-top-card"] li',
        degreeConnection: ':contains("1st degree connection")',
        location: 'ul[class*="list-bullet"] li',
        education: 'h2[class*="profile-section"]:contains("Education")',
        aboutSummary: 'p[class*="summary-text"] span',
        aboutSummarySeeMore: 'a[id*="line-clamp-show-more-button"]',

        search: {
            searchInput: 'input[class*="search-global"]',
            searchInputOverlayList: 'div[role*="listbox"] div[role*="option"]',
            numberOfResultsFound: 'h3[class*="search-results__total"]',
            searchResultsListItems: 'li[class*="search-result"]',
            searchResultListItemProfileLink: 'a[href*="/in/"]'

        }
    }

    const _loginPage = {
        userName: 'input[autocomplete*="username"], #username',
        password: 'input[autocomplete*="current-password"], #password',
        sendButton: 'button[class*="submit-button"], button[aria-label*="Sign in"]'
    }

    const _projectPipeLinePage = {
        candidateRow: 'div[class*="row-inner"]',
        memberIdCheckbox: 'input[class*="prospect"]',
        candidateName: 'h3[class*="name"] a',
        tab: 'li[role*="presentation"] button[role*="tab"]',
        sendInMailButtons: '.cta-send-msg',
        viewMessageButtons: '.cta-view-msg',
        pipelineRows: 'div[class*="row-inner"]',
        sendInMailButton: 'cta-send-msg',
        navigationPage1: 'a[class*="page-link"][title*="Page 1"]',
        navigationNextPage: 'a[class*="page-link"][title*="Next Page"]',
    }

    const _inmailDialog = {
        subject: 'input[name*="subject"]',
        body: 'textarea[placeholder*="Type your message"]',
        sendButton: 'button[class*="inmail-send-btn"]',
        sendInMailCloseModal: 'button[class*="icon-close"]',
    }

    class LinkedInSelectors {
        contactInfoPage = _contactInfoPage;
        recruiterProfilePage = _recruiterProfilePage;
        searchResultsPage = _searchResultsPage;
        publicProfilePage = _publicProfilePage;
        projectPipeLinePage = _projectPipeLinePage;
        loginPage = _loginPage;
        inMailDialog = _inmailDialog;
    }

    window.linkedInSelectors = new LinkedInSelectors();
})();


