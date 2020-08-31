(function() {
    const _loadTemplate = (templateName) => {

    }

    class AlisonHook {
        constructor() { }

        loadTemplate = _loadTemplate;
    }

    window.tsAlisonHook = new AlisonHook();
})();


$(document).ready(() => {
   tsAlisonHook.loadTemplate('sendLinkedInMessage');
});
