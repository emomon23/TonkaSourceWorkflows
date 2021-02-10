(() => {
    const SAVE_COMPANY_DATA_CONFIG = 'tsCompanyLogic.saveCompanyData';

    const _filterBySize = (companies, size) => {
        if (companies.length && size) {
            return companies.filter(c => c.size === size);
        }
        return companies;
    }

    const _filterByName = (companies, name) => {
        if (companies.length && name) {
            return companies.filter(c => c.name.toLowerCase().includes(name.toLowerCase()));
        }
        return companies;
    }

    const _save = async (skills, companiesWithSkills) => {
        if (!linkedInCommon.checkIfCompanyAnalyticsIsTurnedOn()){
            return;
        }
        if (!skills || !skills.length > 0) {
            return;
        }

        const existingSkillCompaniesDocs = await skillCompaniesRepository.getSubset(skills);
        const existingSkills = Object.keys(existingSkillCompaniesDocs);
        skills.forEach(async (skill) => {
            // Get the companyIds of the companies that have the skill reported
            const companiesWithThisSkill = companiesWithSkills.filter( c => c.skills.includes(skill) );
            const companyIdsWithThisSkill = companiesWithThisSkill.map((c) => {
                return c.id
            });

            // Get the existing skillCompanies Doc
            let skillCompaniesDoc = existingSkillCompaniesDocs.find(scd => scd.skill === skill);
            if (skillCompaniesDoc) {
                // Merge the companies and update the document
                skillCompaniesDoc.companies = tsArray.union(skillCompaniesDoc.companies, companyIdsWithThisSkill);
                await skillCompaniesRepository.update(skillCompaniesDoc);
            } else {
                // Create the new skillCompanies document and insert
                skillCompaniesDoc = {
                    "skill": skill,
                    "companies": companyIdsWithThisSkill
                };
                await skillCompaniesRepository.insert(skillCompaniesDoc);
            }
        });
        console.log("SkillCompaniesController.save - COMPLETE");
    }

    const _search = async (skills, size, name) => {
        if (name.trim()) {
            // If we're searching by name, we just want matching companies
            let companySummaryDocs = await companySummaryRepository.getAll();
            companySummaryDocs = _filterByName(companySummaryDocs, name);
            return companySummaryDocs;
        } else if (skills.trim()) {
            const listOfSkills = skills.split(",").map((s) => s.trim());

            const skillCompaniesDocs = await skillCompaniesRepository.getSubset(listOfSkills);
            if (skillCompaniesDocs) {
                // First we need to find the companies that are contained within all the skill elements
                let matchingCompanies = []
                skillCompaniesDocs.forEach((skillCompaniesDoc) => {
                    matchingCompanies = tsArray.intersection(matchingCompanies, skillCompaniesDoc.companies);
                });

                // If we still have companies, lets go get their summary
                if (matchingCompanies.length) {
                    matchingCompanies = _filterBySize(matchingCompanies, size);
                    return await companySummaryRepository.getSubset(matchingCompanies);
                }
            }
        }
        // If we're not filtering by skills, lets just filter by other search options
        let companySummaryDocs = await companySummaryRepository.getAll();
        companySummaryDocs = _filterBySize(companySummaryDocs, size);
        return companySummaryDocs;
    }

    class SkillCompaniesController {
        save = _save;
        search = _search;
    }

    window.skillCompaniesController = new SkillCompaniesController();
})();