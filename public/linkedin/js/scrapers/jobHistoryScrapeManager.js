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
        await linkedInPublicProfileScraper.goHome();
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

            if (seeker){
                this.consecutiveNothingToScrape = 0;
                const scrapedSuccessfully = await _scrapeAlisonJobSeeker(seeker);
                if (scrapedSuccessfully){
                    this.success+=1;
                    await tsCommon.randomSleep(60000, 90000);
                }
                else {
                    this.failure+=1;
                }
            } else {
                this.consecutiveNothingToScrape +=1;
                //there's no one to scrape, sleep for 5 mins and try again
                await tsCommon.sleep(60000 * 5);
                if (this.consecutiveNothingToScrape > 3){
                    await _keepSessionAlive();
                    this.consecutiveNothingToScrape = 0;
                }
            }

            if (this.success >= this.howMany){
                console.log(`DONE. success: ${this.success}. failuer: ${this.failure}.`);
            }
            else {
                await _getNextCandidateToScrape();
            }
        }
    }

    window.tsJobHistoryScrapeManager = new TsJobHistoryScrapeManager();
})();