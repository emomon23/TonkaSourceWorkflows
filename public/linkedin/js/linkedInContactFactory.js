(function() {
    class LinkedInContactFactory {
        constructor() {}

        newLinkedInContact = (wholeName) => {
            var split = wholeName.split(' ');

            const firstName = split[0];
            var lastName = "";

            if (split.length > 0){
                lastName = split[1];
            }

            const result = {
                firstName: firstName,
                lastName: lastName
            }

            result.confirm = () => {
                const bodyText = "firstName: " + result.firstName + "\n" + "lastName: " + result.lastName + "\n" + "network circle: " + result.networkConnection + "\n" + "city: " + result.city + "\n" + "state: " + result.state + "\n" + "title: " + result.title + "\n" + "company: " + result.company + "\n" + "since: " + result.currentPositionDates + "\n" + "\nimageUrl: " + result.imageUrl + "\n\n" + "\nlinkInUrul:" + result.linkedInRecruiterUrl + "\n\n"
                // eslint-disable-next-line no-alert
                const response = prompt(bodyText, "Does this one look good? (Enter 'No' to stop this madness)");
                return !response.toLowerCase().startsWith("n");
            }

            result.setLocation = (location) => {
                const split = location? location.split(',') : [""];
                result.city = split[0];
                result.state = split.length > 1? split[1].trim() : "";
            },

            result.setCurrentPosition = (position) => {
                if (!position || position.length === 0 || position.toLowerCase().indexOf("present") === -1){
                    return;
                }

                result.currentPositionDates = position.length > 14? position.substr(position.length - 14).trim() : "";
                position = position.replace(result.currentPositionDates, '');

                const split = position.split(" at ");

                result.title = split[0].trim();

                if (split.length > 1){
                    result.company = split[1]
                }
            }

            return result;
        }
    }

    window.linkedInContactFactory = new LinkedInContactFactory();
})();