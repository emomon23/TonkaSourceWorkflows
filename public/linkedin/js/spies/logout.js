(() => {
    let _logoutHref = null;

    const _signOut = async () => {
       if (window.backupRestoreAndSync && window.backupRestoreAndSync.backupAllIndexDbData) {
            await backupRestoreAndSync.backupAllIndexDbData();
        }

        window.location.href = _logoutHref;
    }

    const _bindToSignOutButton = async () => {
        if (!_logoutHref) {
        const signOut = $("a:contains('Sign Out')");

        _logoutHref = $(signOut).attr('href');

        if (_logoutHref){
            $(signOut)
                .attr('href', '#')
                .click(() => {_signOut()});
            }
        }
    }

    const _delayReady = async () => { // logout.js
        await tsCommon.sleep(500);

        $('button[class*="global-nav"]').click(async () => {
            await tsCommon.sleep(200);
            _bindToSignOutButton();
        });

        _bindToSignOutButton();
    }

    $(document).ready(() => {
        _delayReady();
    })
})();