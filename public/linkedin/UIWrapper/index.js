const getToken = async() => {
    window.accessTokenResult = await linkedInProxy.requestAccessToken();
    
     $('#accessToken').text(accessTokenResult.access_token);
}

  $(document).ready(() => {
        getToken();
  });