(() => {
    const TONKA_SOURCE_DATABASE = "TonkaSourceDB";
    const VERSION = 1;
    const SCHEMA = {
        storeName: 'candidate',
        idProperty: 'memberId',
        indexes: ['lastName', 'isJobSeekerString']
    }

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.candidateRepository = _storeFactory.createStore('candidate', 'memberId');
})();