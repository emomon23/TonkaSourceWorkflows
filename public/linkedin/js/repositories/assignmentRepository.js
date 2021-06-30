(() => {
    const TONKA_SOURCE_DATABASE = "TsAssignments";
    const VERSION = 1;
    const SCHEMA = [
        {
            storeName: 'assignment',
            idProperty: 'id',
            indexes: ['name']
        }
    ];

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.assignmentRepository = _storeFactory.createStore('assignment');

})();