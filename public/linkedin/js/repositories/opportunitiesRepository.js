(() => {
    const TONKA_SOURCE_DATABASE = "TsOpportunities";
    const VERSION = 1;
    const SCHEMA = [
        {
            storeName: 'opportunity',
            idProperty: 'id',
            indexes: ['name', 'companyName', 'contactName']
        }
    ];

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.opportunityRepository = _storeFactory.createStore('opportunity');

})();