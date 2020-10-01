(function() {

    const _recruiterProfilePage = {
        profileId: 'input[name*="profile-id"]',
        publicProfileLink: 'a:contains("Public Profile")',
        skillsList: '#profile-skills div ul[class*="skills"]',
        profilePrimaryContent: '#primary-content'
    }

    const _searchResultsPage = {
        BADGES: 'div[class*="badges"]'
    }

    const _publicProfilePage = {
        messageModal: {
            textEntries: 'div[class*="msg-form__contenteditable"]',
            sendButtons: 'button[class*="msg-form__send-button"]',
            leftActionSection: 'div[class*="msg-form__left-actions"]',
            activeMessageModalHeader: 'h4 span',
            memberProfileFullNameSelectors: ['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")'],
            multipleMessageRecipientPills: 'span[class*="artdeco-pill__text"]',      
        },

        connectionRequestModal : {
            connectionRequestDoneButtons: ['button[aria-label=“Done”]', 'button span:contains("Done")'],
            connectionRequestModal: 'div[data-test-modal]',
            connectionNoteTextEntries: ['textarea[name*=“message”]', '#custom-message', 'textarea']
        },

        linkToRecruiterProfile: 'a[href*="/recruiter/profile/',
        memberIdCodeScript: 'code:contains("urn:li:member:")',
    }

    class LinkedInSelectors {
        recruiterProfilePage = _recruiterProfilePage;
        searchResultsPage = _searchResultsPage;
        publicProfilePage = _publicProfilePage;
    }

    window.linkedInSelectors = new LinkedInSelectors();
})();


