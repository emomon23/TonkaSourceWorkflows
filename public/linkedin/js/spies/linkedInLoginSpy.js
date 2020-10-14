(() => {
    const TAB_KEY = 9;
    let _uiElements = null;

    const _fakeUsers = [{
        userNameTrigger: 'abigale',
        email: 'abtsJohnson@outlook.com',
        password: 'Executive90210!',
        phone: '(929) 900-6742‬'
    },
    {
        userNameTrigger: 'bobby',
        email: 'bobby12Johnson@outlook.com',
        password: 'Executive90210!',
        phone: '612 230-8942'
    }];

    const _fillInLoginFormWithFakeCredentials = () => {
        userNameEntered = $(_uiElements.userName).val().trim().toLowerCase();
        const match = _fakeUsers.find((f) => f.userNameTrigger === userNameEntered);
        if (match){
            $(_uiElements.userName).val(match.email);
            _uiElements.password.focus();
            setTimeout(() => {
                document.execCommand('insertText', true, match.password);
            }, 2000);
        }
    }

    const _bindToUserNameTextInput = () => {
        if (!_uiElements){
            return;
        }

        $(_uiElements.userName).on('keydown', (e) => {
            if(e.which === TAB_KEY) {
                _fillInLoginFormWithFakeCredentials();
            }
        } );
    }

    const _getUIElements = () => {
        try {
            const userName = $(linkedInSelectors.loginPage.userName)[0];
            const password = $(linkedInSelectors.loginPage.password)[0];
            const signInButton = $(linkedInSelectors.loginPage.sendButton)[0];

            return {
                userName,
                password,
                signInButton
            };

        } catch(e) {
            console.log(`unable to get ui elements on login page. error: ${e.message}`);
            return null;
        }
    }

    $(document).ready(() => {
        const isLogin = linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.LOGIN
                        || window.location.href === 'https://www.linkedin.com' 
                        || window.location.href === 'https://www.linkedin.com/';

        if (isLogin){
            _uiElements = _getUIElements();
            _bindToUserNameTextInput();
        }
    });
})();



 