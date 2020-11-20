(() => {
    const TONKA_SOURCE_DATABASE = "TsConnectionLifeCycle";
    const VERSION = 2;
    const SCHEMA = [
        {
            storeName: 'note',
            idProperty: 'noteId',
            indexes: ['text']
        },
        {
            storeName: 'connectionHistory',
            idProperty: 'connectionId',
            indexes: ['memberId', 'headline', 'imageUrl', 'lastName']
        }
    ];

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.tsNoteRepo = _storeFactory.createStore('note');
    window.tsConnectionHistoryRepo = _storeFactory.createStore('connectionHistory');
})();