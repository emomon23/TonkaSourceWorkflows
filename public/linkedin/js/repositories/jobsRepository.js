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

window.competitorRepository.getAllCompetitors = async () => {
    const _theCompetition = ['horizontal', 'robert half', 'volt', 'apex systems', 'dahl consulting', 'accenture', 'randstad'];
    const _inDb = await window.competitorRepository.getAll();

    return _theCompetition.concat(_inDb.map(r => r.name));
}
