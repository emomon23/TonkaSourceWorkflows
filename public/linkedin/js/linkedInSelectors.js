(function() {
    const _contactInfoPage = {
        CONTACT_INFO_CONTAINER: 'div[class*="pv-profile-section__section-info"]',
        PHONE_SECTION: 'section[class*="ci-phone"]',
        EMAIL_SECTION: 'section[class*="ci-email"]'
    }

    const _recruiterProfilePage = {
        profileId: 'input[name*="profile-id"]',
        profilePrimaryContent: '#primary-content',
        publicProfileLink: 'a:contains("Public Profile")',
        skillsList: '#profile-skills div ul[class*="skills"]'
    }

    const _searchResultsPage = {
        BADGES: 'div[class*="badges"]'
    }

    const _publicProfilePage = {
        CONTACT_INFO_LINK: 'a[data-control-name*="contact_see_more"]',
        connectionRequestModal : {
            connectionRequestDoneButtons: ['button[aria-label=“Done”]', 'button span:contains("Done")'],
            connectionRequestModal: 'div[data-test-modal]',
            connectionNoteTextEntries: ['textarea[name*=“message”]', '#custom-message', 'textarea']
        },
        linkToRecruiterProfile: 'a[href*="/recruiter/profile/',
        memberIdCodeScript: 'code:contains("urn:li:member:")',
        messageModal: {
            textEntries: 'div[class*="msg-form__contenteditable"]',
            sendButtons: 'button[class*="msg-form__send-button"]',
            leftActionSection: 'div[class*="msg-form__left-actions"]',
            activeMessageModalHeader: 'h4 span',
            memberProfileFullNameSelectors: ['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")'],
            multipleMessageRecipientPills: 'span[class*="artdeco-pill__text"]',      
        },
    }

    class LinkedInSelectors {
        contactInfoPage = _contactInfoPage;
        recruiterProfilePage = _recruiterProfilePage;
        searchResultsPage = _searchResultsPage;
        publicProfilePage = _publicProfilePage;
    }

    window.linkedInSelectors = new LinkedInSelectors();
})();


