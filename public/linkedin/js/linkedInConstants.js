(function() {
    class LinkedInConstants {
        localStorageKeys = {
            ACTIVE_OPPORTUNITY: 'tsActiveOpportunityKey',
            ROLE: 'tsRoleKey',
            TAGS: 'tsTagsKey'
        };

        pages = {
            RECRUITER_SEARCH_RESULTS: "Recruiter Search Results",
            RECRUITER_PROFILE: "Recruiter Profile",
            PUBLIC_PROFILE: "Public Profile"
        };

        roles = {
            BUSINESS_ANALYST: "Business Analyst",
            CORP_RECRUITER: "Corp Recruiter",
            DEVELOPER: "Developer",
            DEVOPS: "DevOps",
            DEV_MANAGER: "Dev Manager",
            EXECUTIVE: "Executive",
            HR: "HR",
            IT_ADMIN: "IT Admin",
            PROJECT_MANAGER: "Project Manager",
            QA_AUTOMATION: "QA Automation",
            QA_MANUAL: "QA Manual",
            RECRUITER: "Recruiter",
            SCRUM_COACH: "Scrum Coach",

        }

        // This is our ability to scrape and save anyone we step into after searching
        SAVE_AFTER_RECRUITER_PROFILE_SCRAPE = false;

        urls = {
            RECRUITER_SEARCH_RESULTS: "/recruiter/smartsearch",
            RECRUITER_PROFILE: "/recruiter/profile/",
            PUBLIC_PROFILE: "linkedin.com/in/"
        };
    }
    window.linkedInConstants = new LinkedInConstants();
})();