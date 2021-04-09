const TONKA_SOURCE_DATABASE = "Jobs";
const VERSION = 1;
const SCHEMAS = [{
    storeName: 'jobs',
    idProperty: 'key',
    indexes: ['company', 'title', 'type']
},
{
    storeName: 'recruitingFirms',
    idProperty: 'id'
}
];

const _storeFactory = baseIndexDbFactory.createStoreFactory(TONKA_SOURCE_DATABASE, VERSION, SCHEMAS);

window.jobsRepository = _storeFactory.createStore('jobs');
window.competitorRepository = _storeFactory.createStore('recruitingFirms');

window.competitorRepository.getByType = async (type) => {
    const _inDb = await window.competitorRepository.getAll();
    return _inDb.filter(c => c.type === type)
}
