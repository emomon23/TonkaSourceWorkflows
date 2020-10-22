(() => {
    const _getNextCandidateToScrape = async () => {
        await linkedInCommon.callAlisonHookWindow('getNextJobSeekerToScrape');
    }

    const _doesScrapedCandidateMatchAlisonSeeker = (scraped, seeker) => {
        const firstNamesGoodEnough = scraped.firstName.indexOf(seeker.firstName) >= 0 || seeker.firstName.indexOf(scraped.firstName) >= 0;
        const lastNamesGoodEnough = scraped.lastName.indexOf(seeker.lastName) >= 0 || seeker.lastName.indexOf(scraped.lastName) >= 0;

        return firstNamesGoodEnough && lastNamesGoodEnough;
    }

    const _scrapeAlisonJobSeeker = async (seeker) => {
        let result = false;
        const sendConnectionRequest = "Mike Joe".indexOf(linkedInApp.alisonUserName) === -1;
        const scrapedProfile = await linkedInPublicProfileScraper.searchForPublicProfile(seeker, sendConnectionRequest);
 
        if (scrapedProfile) {
            const wasTheRightOneScraped = _doesScrapedCandidateMatchAlisonSeeker(scrapedProfile, seeker);
            if (wasTheRightOneScraped){
                scrapedProfile.memberId = seeker.linkedInMemberId ? seeker.linkedInMemberId : seeker.memberId;
                
                // eslint-disable-next-line no-await-in-loop
                await linkedInApp.upsertContact(scrapedProfile, false);
                result = true;
            }  
            else {
                seeker.positionsLastScraped = (new Date()).getTime();
                seeker.unableToSearchFromPublicLinkedIn = true;
                // eslint-disable-next-line no-await-in-loop
                await linkedInApp.upsertContact(seeker, false);
            } 
        } else {
            seeker.positionsLastScraped = (new Date()).getTime();
            seeker.unableToSearchFromPublicLinkedIn = true;
            // eslint-disable-next-line no-await-in-loop
            await linkedInApp.upsertContact(seeker, false);
        }

        return result;
    }
    
    const _keepSessionAlive = async () => {
        try {
            console.log("_keepSessionAlive called");
            await linkedInPublicProfileScraper.goHome();
        } catch (e){
            console.log(`Error in _keepSessionAlive. ${e.message}`);
        }
    }

    class TsJobHistoryScrapeManager {
        begin = async(howMany) => {
            if (!howMany || isNaN(howMany)){
                console.log('*** you MUST specify how many');
                return;
            }

            this.howMany = howMany;
            this.success = 0;
            this.failure = 0;
            this.consecutiveNothingToScrape = 0;
            await _getNextCandidateToScrape();

            //monitor for the next 5 
            const self = this;
            let counter = 0;

            const interval = setInterval(() => {
                counter+=1;
                const isRunningMsg = self.scrapeJobSeekerHasBeenCalled ? ' is ' : ' is NOT '
                
                if (counter > 10 || self.scrapeJobSeekerHasBeenCalled){
                    console.log(`Job history scraping ${isRunningMsg} running successfully`);
                    clearInterval(interval);
                }
            }, 60000);
        }

        scrapeThisJobSeeker = async(seeker) => {
            this.scrapeJobSeekerHasBeenCalled = true;
            let message = `scraped ${seeker.firstName} ${seeker.lastName} `;
            
            if (seeker && seeker.firstName && seeker.lastName){
                this.consecutiveNothingToScrape = 0;
                const scrapedSuccessfully = await _scrapeAlisonJobSeeker(seeker);
                if (scrapedSuccessfully){
                    this.success+=1;
                    message += 'successfully. ';
                    await tsCommon.randomSleep(60000, 90000);
                }
                else {
                    message += 'unsuccessfully. ';
                    this.failure+=1;
                }

                message+= `successfullyScraped: ${this.success}.  failed: ${this.failure}.  howMany: ${this.howMany}`;
                console.log(message);

            } else {
                console.log('Call to get next candidate to scrape return null, patiently waiting (5 minutes)...');
                
                this.consecutiveNothingToScrape +=1;
                //there's no one to scrape, sleep for 5 mins and try again
                const from = 60000 * 3;
                const to = 60000 * 6
                await tsCommon.randomSleep(from, to);
            }

            if (this.success >= this.howMany){
                console.log(`DONE. success: ${this.success}. failure: ${this.failure}.`);
            }
            else {
                await _getNextCandidateToScrape();
            }
        }
    }

    window.tsJobHistoryScrapeManager = new TsJobHistoryScrapeManager();
})();