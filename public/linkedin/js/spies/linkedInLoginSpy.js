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
    },
    {
        userNameTrigger: 'cindy',
        email: 'cindybaker626@outlook.com',
        password: 'Executive90210!',
        phone: ''
    },
    {
        userNameTrigger: 'devin',
        email: 'DevinZappier16@outlook.com',
        password: 'Executive90200!',
        phone: '612 230-8942'
    },
    {
        userNameTrigger: 'eric',
        email: 'EricSeperLi23@outlook.com',
        password: 'Executive90211!',
        phone: ''
    },
    {
        userNameTrigger: 'frank',
        email: 'FrankLeahie878i@outlook.com',
        password: 'Executive90212!',
        phone: '612 230-8942'
    },
    {
        userNameTrigger: 'greg',
        email: 'GregEstes6j@outlook.com',
        password: 'Executive90213!',
        phone: '612 230-8942'
    },
    {
        userNameTrigger: 'harry',
        email: 'HarryCarron67z@outlook.com',
        password: 'Executive90214!',
        phone: '612 230-8942'
    },
    {
        userNameTrigger: 'james',
        email: 'CalicoCat7812i@outlook.com',
        password: 'Executive90215!',
        phone: '612 230-8942'
    },
    {
        userNameTrigger: 'kevin',
        email: 'HarleyManFL16k@outlook.com',
        password: 'Executive90216!',
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
        const isLogin = linkedInCommon.whatPageAmIOn() === linkedInConstants.pages.LOGIN;

        if (isLogin){
            _uiElements = _getUIElements();
            _bindToUserNameTextInput();
        }
    });
})();



 