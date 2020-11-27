(() => {
    const TONKA_SOURCE_DATABASE = "TsClipboard";
    const VERSION = 1;
    const SCHEMA = [
        {
            storeName: 'clipboard',
            idProperty: 'id',
            indexes: ['tags']
        }
    ];

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.tsClipboardRepository = _storeFactory.createStore('clipboard');

})();