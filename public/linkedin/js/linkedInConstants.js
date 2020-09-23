(function() {
    class LinkedInConstants {
        localStorageKeys = {
            ACTIVE_OPPORTUNITY: 'tsActiveOpportunityKey',
            ROLE: 'tsRoleKey',
            SAVE_ON_RECRUITER_PROFILE: 'tsSaveOnRecruiterProfile',
            TAGS: 'tsTagsKey'
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
        };

        pages = {
            RECRUITER_SEARCH_RESULTS: "/recruiter/smartsearch",
            RECRUITER_PROFILE: "/recruiter/profile/",
            PUBLIC_PROFILE: "linkedin.com/in/",
            LOGIN: "login",
            FEED: 'feed'
        };
    }
    window.linkedInConstants = new LinkedInConstants();
})();