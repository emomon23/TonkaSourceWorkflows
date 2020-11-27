(() => {
    const TONKA_SOURCE_DATABASE = "TsConnectionLifeCycle";
    const VERSION = 4;
    const SCHEMA = [
        {
            storeName: 'note',
            idProperty: 'noteId',
            indexes: ['text']
        },
        {
            storeName: 'connectionHistory',
            idProperty: 'memberId',
            indexes: []
        },
        {
            storeName: 'correspondenceHistory',
            idProperty: 'memberId',
            indexes: ['lastName']
        }
    ];

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.tsNoteRepo = _storeFactory.createStore('note');
    window.tsConnectionHistoryRepo = _storeFactory.createStore('connectionHistory');
    window.tsCorrespondenceHistoryRepo = _storeFactory.createStore('correspondenceHistory');
})();