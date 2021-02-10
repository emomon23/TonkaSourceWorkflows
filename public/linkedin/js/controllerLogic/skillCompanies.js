(() => {
    const SAVE_COMPANY_DATA_CONFIG = 'tsCompanyLogic.saveCompanyData';

    const _filterBySize = (companies, size) => {
        if (companies.length && size) {
            return companies.filter(c => c.size === size);
        }
        return companies;
    }

    const _filterByName = (companies, namesList) => {
        if (companies.length && namesList && namesList.length) {
            return companies.filter((company) => {
                return namesList.some((name) => {
                    if (company.name.toLowerCase().includes(name.toLowerCase())) {
                        return true;
                    }
                    return false;
                });
            });
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

    const _search = async (skills, size, names) => {
        let companySummaryDocs = [];
        let listOfNames = [];
        if (names.trim()) {
            // If we're searching by name, we just want matching companies
            listOfNames = names.split(",").map((n) => n.trim());
        }

        if (skills.trim()) {
            const listOfSkills = skills.split(",").map((s) => s.trim());

            const skillCompaniesDocs = await skillCompaniesRepository.getSubset(listOfSkills);
            if (skillCompaniesDocs) {
                // First we need to find the companies that are contained within all the skill elements
                skillCompaniesDocs.forEach((skillCompaniesDoc) => {
                    matchingCompanies = tsArray.intersection(companySummaryDocs, skillCompaniesDoc.companies);
                });

                // If we still have companies, lets go get their summary
                if (matchingCompanies.length) {
                    companySummaryDocs = await companySummaryRepository.getSubset(matchingCompanies);
                }
            }
        } else {
            companySummaryDocs = await companySummaryRepository.getAll();
        }

        companySummaryDocs = _filterByName(companySummaryDocs, listOfNames);
        companySummaryDocs = _filterBySize(companySummaryDocs, size);
        return companySummaryDocs;
    }

    class SkillCompaniesController {
        save = _save;
        search = _search;
    }

    window.skillCompaniesController = new SkillCompaniesController();
})();