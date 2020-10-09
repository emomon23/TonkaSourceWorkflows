(function() {
    const _contactInfoPage = {
        CONTACT_INFO_CONTAINER: 'div[class*="pv-profile-section__section-info"]',
        PHONE_SECTION: 'section[class*="ci-phone"]',
        EMAIL_SECTION: 'section[class*="ci-email"]',
        CLOSE: 'button[aria-label*="Dismiss"]'
    }

    const _recruiterProfilePage = {
        fullName: 'div[class*="profile-info"] h1',
        profileId: 'input[name*="profile-id"]',
        profilePrimaryContent: '#primary-content',
        publicProfileLink: 'a:contains("Public Profile")',
        saveButton: 'div[class*="profile-actions"] button[class*="save-btn"]',
        skillsList: '#profile-skills div ul[class*="skills"]'
    }

    const _searchResultsPage = {
        BADGES: 'div[class*="badges"]',
        addToProjectButton: (memberId) => { return `li[id*="${memberId}"] button[class*="save-btn"]`; }
    }
    
    const _publicProfilePage = {
        CONTACT_INFO_LINK: 'a[data-control-name*="contact_see_more"]',
        connectionRequestModal : {
            connectionRequestDoneButtons: ['button[aria-label=“Done”]', 'button span:contains("Done")'],
            connectionRequestModal: 'div[data-test-modal]',
            connectionNoteTextEntries: ['textarea[name*=“message”]', '#custom-message', 'textarea']
        },
        linkToRecruiterProfile: 'a[href*="/recruiter/profile/',
       
        messageModal: {
            textEntries: 'div[class*="msg-form__contenteditable"]',
            sendButtons: 'button[class*="msg-form__send-button"]',
            leftActionSection: 'div[class*="msg-form__left-actions"]',
            activeMessageModalHeader: 'h4 span',
            memberProfileFullNameSelectors: ['button[aria-label*="Connect with"]', 'span[class*="a11y-text"]:contains("profile via message")', 'span[class*="a11y-text"]:contains("profile to PDF")', 'span[class*="a11y-text"]:contains("Report or block")'],
            multipleMessageRecipientPills: 'span[class*="artdeco-pill__text"]',      
        },

        experience: {
            positionListItems: '[class*="experience-section"] li',
            seeMorePositions: 'button[class*="see-more-inline"]:contains("more experiences")',
            showMoreJobDescriptionText: 'button[class*="show-more-text"]:contains("see more")',
            positionTitle: 'h3',
            employer: 'p:contains("Company Name")',
            dates:  'h4:contains("Dates Employed")',
            location: 'h4',
            experienceDescription: 'div[class*="extra-details"] p[class*="show-more-text"]'
        },

        fullName: 'ul[class*="pv-top-card"] li',
        degreeConnection: 'ul[class*="pv-top-card"] span',
        location: 'ul[class*="list-bullet"] li',
        education: 'h2[class*="profile-section"]:contains("Education")'
    }

    class LinkedInSelectors {
        contactInfoPage = _contactInfoPage;
        recruiterProfilePage = _recruiterProfilePage;
        searchResultsPage = _searchResultsPage;
        publicProfilePage = _publicProfilePage;
    }

    window.linkedInSelectors = new LinkedInSelectors();
})();


