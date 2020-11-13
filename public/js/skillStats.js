(function () {
    class skillStats {
        skillStatsList = {
            // Groups
            "Amazon Web Services (AWS)": {
                childSkills: [
                    "Amazon API Gateway",
                    "Amazon Athena",
                    "Amazon Aurora",
                    "Amazon CloudFront",
                    "Amazon CloudSearch",
                    "Amazon CloudWatch",
                    "Amazon DocumentDB",
                    "Amazon DynamoDB",
                    "Amazon EC2",
                    "Amazon ElastiCache",
                    "Amazon Elastic Container Registry",
                    "Amazon Elastic Container Service",
                    "Amazon Elastic Kubernetes Service",
                    "Amazon MQ",
                    "Amazon Neptune",
                    "Amazon RDS",
                    "Amazon Simple Notification Service",
                    "Amazon Simple Queue Service",
                    "Amazon S3",
                    "AWS CloudFormation",
                    "AWS CodeDeploy",
                    "AWS CodePipeline",
                    "AWS Data Pipeline",
                    "AWS DataSync",
                    "AWS Glue",
                    "AWS IoT",
                    "AWS Lambda",
                    "AWS"
                ]
            },
            "Amazon API Gateway": {
                searchPhrases: ["Amazon API Gateway", "AWS API Gateway", "API Gateway"]
            },
            "Amazon EC2": {
                searchPhrases: ["Amazon EC2", "EC2"]
            },
            "Amazon Elastic Container Registry": {
                searchPhrases: ["Amazon Elastic Container Registry", "Amazon Container Registry", "Amazon ECR"]
            },
            "Amazon Elastic Container Service": {
                searchPhrases: ["Amazon Elastic Container Service", "Amazon Container Service", "Amazon ECS"]
            },
            "Amazon Elastic Kubernetes Service": {
                searchPhrases: ["Amazon Elastic Kubernetes Service", "Amazon Kubernetes Service", "Amazon EKS"]
            },
            "Amazon Simple Notification Service": {
                searchPhrases: ["Amazon Simple Notification Service", "Amazon Notification Service", "Amazon SNS"]
            },
            "Amazon Simple Queue Service": {
                searchPhrases: ["Amazon Simple Queue Service", "Amazon Queue Service", "Amazon SQS"]
            },
            "Amazon S3": {
                searchPhrases: ["Amazon Simple Storage Service", "Amazon S3", "S3"]
            },
            "AWS Lambda": {
                searchPhrases: ["AWS Lambda", "Lambda"]
            },
            "ASP.NET": {
                searchPhrases: ["Classic ASP", "ASP.NET,"]
            },
            "Azure CI/CD": {
                childSkills: [
                    "Azure Kubernetes Service",
                    "Azure Container Instances",
                    "Azure Service Fabric"
                ]
            },
            "Azure DevOps": {
                childSkills: [
                    "Azure Artifacts",
                    "Azure Boards",
                    "Azure DevTest Labs",
                    "Azure Monitor",
                    "Azure Pipelines",
                    "Azure Repos",
                    "Azure Test Plans"
                ]
            },
            "Azure Services": {
                childSkills: [
                    "Azure Active Directory",
                    "Azure Analysis Services",
                    "Azure App Service",
                    "Azure Cloud Services",
                    "Azure Blockchain Service",
                    "Azure Data Factory",
                    "Azure Event Grid",
                    "Azure Functions",
                    "Azure IoT",
                    "Azure Log Analytics",
                    "Azure Machine Learning",
                    "Azure Logic Apps",
                    "Azure Maps",
                    "Azure Mobile Apps",
                    "Azure Notification Hubs",
                    "Azure Queue Storage",
                    "Azure Service Bus",
                    "Azure SQL Server",
                    "Azure SQL",
                    "Azure Stream Analytics",
                    "Azure Table Storage",
                    "Azure Web Apps",
                    // Sub-Groups
                    "Azure Storage",
                    "Azure CI/CD"
                ]
            },
            "Azure Storage": {
                childSkills: [
                    "Azure Archive Storage",
                    "Azure Backup",
                    "Azure Blob Storage",
                    "Azure Data Box",
                    "Azure Data Lake Storage",
                    "Azure Data Share",
                    "Azure Disc Storage",
                    "Azure File Storage"
                ]
            },
            "COM": {
                searchPhrases: ["Component Object Model", " COM ", " COM,"]
            },
            "DevOps": {
                childSkills: [
                    "Ansible",
                    "Chef",
                    "Docker",
                    "Jenkins",
                    "Kubernetes",
                    "Octopus Deploy",
                    "Puppet",
                    "TeamCity",
                    "Terraform"
                ]
            },
            "Diagrams.net": {
                searchPhrases: ["Draw.io", "Drawio", "Draw io", "Diagrams.net"]
            },
            "Java": {
                searchPhrases: ["Java"],
                childSkills: [
                    "Android",
                    "Groovy",
                    "Java Server Pages",
                    "Spring",
                    "SpringBoot",
                ]
            },
            "JavaScript": {
                childSkills: [
                    "AngularJS",
                    "Angular",
                    "Backbone",
                    "Bootstrap",
                    "Express",
                    "JQuery",
                    "KnockoutJS",
                    "NodeJS",
                    "React",
                    "TypeScript",
                    "VueJS",
                    "Web Components"
                ]
            },
            "Message Queues": {
                childSkills: [
                    "Amazon MQ",
                    "Apache ActiveMQ",
                    "Apache RocketMQ",
                    "Apache Kafka",
                    "Azure Queue Storage",
                    "Google Cloud Pub/Sub",
                    "IBM MQ",
                    "KubeMQ",
                    "MuleSoft",
                    "RabbitMQ",
                    "WebSphere Message Broker"
                ]
            },
            "Messaging Platforms": {
                childSkills: ["Azure Service Bus", "Message Queues", "NServiceBus", "WebSphere ESB"]
            },
            "Mobile": {
                childSkills: ["Xamarin Native", "Xamarin Forms", "Xamarin", "iOS", "Android", "Swift", "React Native", "Unity", "Flutter"]
            },
            ".NET": {
                searchPhrases: [".NET"],
                childSkills: [
                    "ASP.NET Core",
                    "ASP.NET Identity",
                    "ASP.NET MVC",
                    "ASP.NET Web API",
                    "ASP.NET Web Forms",
                    "ASP.NET",
                    "Entity Framework",
                    "NServiceBus",
                    "C#",
                    "WCF",
                    "WPF",
                    "COM",
                    "UWP",
                    "Windows Forms",

                ]
            },
            "NoSQL": {
                childSkills: ["Cassandra", "CouchDB", "CosmosDB", "DynamoDB", "Elasticsearch", "MongoDB", "Redis"]
            },
            "SQL": {
                childSkills: ["MariaDB", "MySQL", "PostgreSQL", "Oracle", "SQL Server"]
            },
            "Source Control": {
                childSkills: ["BitBucket", "GitHub", "GitLab", "Git", "SVN", "TFS", "CVS", "Mercurial"]
            },

            // Individual Skills
            "Amazon MQ": {
                searchPhrases: ["AmazonMQ", "Amazon MQ"]
            },
            "Angular": {
                searchPhrases: [
                    "Angular2",
                    "Angular 2",
                    "Angular4",
                    "Angular 4",
                    "Angular5",
                    "Angular 5",
                    "Angular6",
                    "Angular 6",
                    "Angular7",
                    "Angular 7",
                    "Angular8",
                    "Angular 8",
                    "Angular"
                ]
            },
            "Apache ActiveMQ": {
                searchPhrases: ["Apache ActiveMQ", "Apache Active MQ", "ActiveMQ", "Active MQ"]
            },
            "Apache Kafka": {
                searchPhrases: ["Apache Kafka", "Kafka"]
            },
            "Apache RocketMQ": {
                searchPhrases: ["Apache RocketMQ", "Apache Rocket MQ", "RocketMQ", "Rocket MQ"]
            },
            "ASP.NET Core": {
                searchPhrases: ["ASP.NET Core", ".NET Core", "NET Core"]
            },
            "ASP.NET Identity": {
                searchPhrases: ["ASP.NET Identity", ".NET Identity"]
            },
            "ASP.NET MVC": {
                searchPhrases: ["ASP.NET MVC", ".NET MVC"]
            },
            "ASP.NET Web API": {
                searchPhrases: ["ASP.NET WebAPI", "ASP.NET Web API", ".NET WebAPI", ".NET Web API"]
            },
            "ASP.NET Web Forms": {
                searchPhrases: ["Web Forms", "WebForms"]
            },
            "Azure Queue Storage": {
                searchPhrases: ["Azure Queue Storage", "Azure Queues", "Queue Storage"]
            },
            "Cassandra": {
                searchPhrases: ["Apache Cassandra", "CassandraDB", "Cassandra"]
            },
            "Cloud Services": {
                searchPhrases: ["Azure", "Amazon Web Services", "AWS", "Firebase", "Google Cloud", "Cloud"]
            },
            "CouchDB": {
                searchPhrases: ["CouchDB", "Couch"]
            },
            "CosmosDB": {
                searchPhrases: ["CosmosDB", "Cosmos"]
            },
            "Dynamo": {
                searchPhrases: ["DynamoDB", "Dynamo"]
            },
            "Elasticsearch": {
                searchPhrases: ["Elastic Search", "Elasticsearch"]
            },
            "Entity Framework": {
                searchPhrases: ["Entity Framework"]
            },
            "Go": {
                searchPhrases: ["Go,", " Go "]
            },
            "Google Cloud Pub/Sub": {
                searchPhrases: ["Google Cloud Pub/Sub", "Google Cloud Pub / Sub", "Google Pub/Sub", "Google Pub / Sub"]
            },
            "KubeMQ": {
                searchPhrases: ["KubeMQ", "Kube MQ"]
            },
            "MariaDB": {
                searchPhrases: ["MariaDB", "Maria"]
            },
            "MongoDB": {
                searchPhrases: ["MongoDB", "Mongo"]
            },
            "MuleSoft": {
                searchPhrases: ["MuleSoft", "Mule Soft"]
            },
            "NServiceBus": {
                searchPhrases: ["NServiceBus", "NSB"]
            },
            "Oracle": {
                searchPhrases: ["OracleDB", "Oracle DB", "Oracle"]
            },
            "Perl": {
                searchPhrases: ["Perl"]
            },
            "PHP": {
                searchPhrases: ["PHP"]
            },
            "PostgreSQL": {
                searchPhrases: ["PostgreSQL", "Postgress", "Postgres"]
            },
            "Python": {
                searchPhrases: ["Python"]
            },
            "QA Automation": {
                searchPhrases: ["Test Automation", "QA Automation", "Quality Assurance Automation",
                    "SDET", "Software Developer in Test", "Software Development Engineer in Test", "Software Development in Test", "Software Developer Engineer in Test",
                    "automation framework"
                ],
                childSkills: ["Selenium", "JMeter", "TestNG", "Cucumber", "Maven", "SoapUI", "Protractor", "Cypress"]
            },
            "QA Manual": {
                searchPhrases: ["QA Analyst", "Manual QA", "Quality Assurance Analyst", "Test Script", "Test Suite", "Test Case"],
                childSkills: ["Test Plan Creation", "Test Case Design", ]
            },
            "RabbitMQ": {
                searchPhrases: ["RabbitMQ", "Rabbit MQ"]
            },
            "React Native": {
                searchPhrases: ["React Native", "React.Native", "ReactNative"]
            },
            "Ruby": {
                searchPhrases: ["Ruby"]
            },
            "Scala": {
                searchPhrases: ["Scala"]
            },
            "Selenium": {
                searchPhrases: ["Selenium"],
                childSkills: ["Selenium WebDriver", "Selenium IDE", "Selenium RC", "Selenium Grid"]
            },
            "SQL Server": {
                searchPhrases: ["Microsoft SQL Server", "SQL Server", "MS SQL"]
            },
            "SVN": {
                searchPhrases: ["Subversion", "SVN"]
            },
            "TestNG": {
                searchPhrases: ["TestNG", "Test NG"]
            },
            "TFS": {
                searchPhrases: ["Team Foundation Server", "TFS"]
            },
            "Unit Testing": {
                searchPhrases: ["Unit Testing"],
                childSkills: ["Karma", "Jasmine", "Jest", "MSTest", "NUnit", "XUnit", "JUnit", "Mocha", "TestNG", "JTest", "Parasoft", "Cantata", "Unity Test", "JMockit", "Emma", "HtmlUnit", "SimpleTest"]
            },
            "UI/UX": {
                searchPhrases: ["UI/UX", "Visual Communication", "Interaction Design", "Interactive Design", "Web Design"],
                childSkills: ["HTML", "CSS", "SASS", "LESS", "JavaScript", "jQuery", "Bootstrap", "UX Research", "UX Design", "UX Writing", "Wireframing", "UI Prototyping", "Analytics"]
            },
            "Visual Basic": {
                searchPhrases: ["Visual Basic", "VB5", "VB6"]
            },
            "Windows Forms": {
                searchPhrases: ["Windows Forms", "WinForms", "Win Forms"]
            },
            "Wireframing": {
                searchPhrases: ["Wirefram", "Mockups"],
                childSkills: ["Balsamiq", "Moqups", "LucidChart", "Diagrams.net", "Visio", "Cacoo", "Sketch", "Omnigraffle", "Axure", "Terrastruct", "Mockplus", "Miro", " Xd ", "Justinmind", "ProtoPie"]
            },
            "Xamarin Forms": {
                searchPhrases: ["Xamarin.Forms", "XamarinForms", "Xamarin Forms"]
            },
            "Xamarin Native": {
                searchPhrases: ["Xamarin.iOS", "XamarinIos", "Xamarin iOS", "Xamarin.Android", "XamarinAndroid", "Xamarin Android"]
            }
        }
    }
    window.skillStats = new skillStats();
})();