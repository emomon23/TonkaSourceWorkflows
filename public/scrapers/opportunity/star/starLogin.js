(() => {
    const _loginUrl = 'https://starcollaborativeportal.secure.force.com/PortalLoginPage';
    const _dashboardUrl = 'PortalHome?';

    const _login = (userName, password) => {
        let userNameInput = document.querySelector('input[name*="inputEmail"]');

        if (!userNameInput) {
           tsCommon.waitForTrue(1000, 10, () => {
                userNameInput = document.querySelector('input[name*="inputEmail"]');
                return userNameInput? true : false;
           });
        }

        if (!userNameInput){
            return false;
        }

        userNameInput.value = userName
        document.querySelector('input[name*="inputPassword"]').value = password;
        document.querySelector('input[name*="loginButton"]').click();

        return tsCommon.waitForTrue(500, 20, () => {
            return window.location.href.indexOf('PortalLoginPage') === -1;
        });
    }

    const _clickJobPortal = () => {
        const jobPortal = document.querySelector('a[href*="PortalJobList"]');
        if (jobPortal){
            const portalUrl = jobPortal.getAttribute('href');
            window.location.href = portalUrl;
        }
    }

    const _signOut = () => {
        let signOut = document.querySelector('input[value="Sign Out"]');

        tsCommon.waitForTrue(500, 5, () => {
            signOut = document.querySelector('input[value="Sign Out"]');
            return signOut? true : false;
        });

        if (signOut){
            signOut.click();
            return true;
        }

        return false;
    }

    class StarLogin {
        login = _login;
        signOut = _signOut;
    }

    const href = window.location.href;
    if (href.indexOf(_loginUrl) >= 0){
        _login('joe.harstad@tonkasource.com', 'ThisThingOfOurs!15');          
    }
    else if (href.indexOf(_dashboardUrl) >= 0) {
        setTimeout(() => {
            _clickJobPortal();
        }, 3000);    
    }
    else {
        Window.starLogin = new StarLogin();
        window.starLogin = new StarLogin();
    }
})();