(() => {
    const TONKA_SOURCE_DATABASE_OLD = "TonkaSourceDB";
    const TONKA_SOURCE_DATABASE = "Candidate";
    const VERSION = 1;
    const SCHEMA = {
        storeName: 'candidate',
        idProperty: 'memberId',
        indexes: ['lastName', 'isJobSeekerString', 'headline', 'imageUrl']
    };

    const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMA);
    window.candidateRepository = _storeFactory.createStore('candidate', 'memberId');


    const _migrateVersionOneTonkaSource = async () => {
        await tsCommon.sleep(5000);

        var migrator = baseIndexDbFactory.createMigrator({fromDbName: TONKA_SOURCE_DATABASE_OLD, fromVersion: 1, fromStoreName: 'candidate', toStore: window.candidateRepository});
        migrator.migrate();
    }

    _migrateVersionOneTonkaSource();
})();