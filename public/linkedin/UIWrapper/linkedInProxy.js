(() => {
    const redirectToBackToAlisonUrl = "https://tonkasourceworkflows.firebaseapp.com/linkedin/UIWrapper/";
    const requestAccessTokenUrl = "https://www.linkedin.com/oauth/v2/accessToken";
    const apiKey = "78bjtmkynqyvkl";
    const secret = "BhpHIZBHZwjJRJYz";
    
    const _redirectToLinkedInLoginPage = () => {
        const scopes = "r_liteprofile r_emailaddress";
        const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${apiKey}&redirect_uri=${redirectToBackToAlisonUrl}&scope=${scopes}`;
       
        window.location.href = url;
    }

    const _requestAccessToken = () => {
        url = `https://us-central1-alison-krause.cloudfunctions.net/acquireLinkedInAccessToken2?code=${tsQueryString.code}`;
        
        return new Promise((resolve, reject) => {
            $.get(url, (response) => {
                resolve(JSON.parse(response));
            });
        });
    }

    class LinkedInProxy {
        constructor(){
            this.error = tsQueryString.error || null;
            if (tsQueryString.error_description){
                this.error.errorDescription = tsQueryString.error_description;
            }
        }

        redirectToLinkedInLoginPage = _redirectToLinkedInLoginPage;
        requestAccessToken =  _requestAccessToken;
    }

    window.linkedInProxy = new LinkedInProxy();
})();