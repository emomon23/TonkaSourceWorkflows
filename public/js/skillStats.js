(function () {
    class skillStats {
        skillStatsList = {
            // Groups
            "Amazon Web Services (AWS)": {
                searchPhrases: ["AWS"],
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
                    "AWS Lambda"
                ],
                isCoreSkill: true
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
                searchPhrases: ['Azure'],
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
                ],
                isCoreSkill: true
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
            "DevOps": {
                searchPhrases: ['DevOps', 'Dev Ops', 'Development Operations'],
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
                searchPhrases: ["Java ", "Java,"],
                childSkills: [
                    "Android",
                    "Groovy",
                    "Java Server Pages",
                    "Spring",
                    "SpringBoot",
                ],
                isCoreSkill: true
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
                ],
                isCoreSkill: true
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
                childSkills: ["Xamarin Native", "Xamarin Forms", "Xamarin", "iOS", "Android", "Swift", "React Native", "Unity", "Flutter"],
                isCoreSkill: true
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
                    "Windows Forms"
                ],
                isCoreSkill: true
            },
            "NoSQL": {
                childSkills: ["Cassandra", "CouchDB", "CosmosDB", "DynamoDB", "Elasticsearch", "MongoDB", "Redis"]
            },
            "SQL": {
                childSkills: ["MariaDB", "MySQL", "PostgreSQL", "Oracle", "SQL Server"]
            },
            "Source Control": {
                childSkills: ["BitBucket", "GitHub", "GitLab", "Git", "SVN", "TFS", "CVS", "Mercurial"],
                ignoreForAnalytics: true
            },
            "Xamarin": {
                childSkills: ["Xamarin Forms", "Xamarin Native"],
                isCoreSkill: true
            },

            // Individual Skills
            "Amazon MQ": {
                searchPhrases: ["AmazonMQ", "Amazon MQ"]
            },
            "Android": {
                searchPhrases: ["Android"],
                isCoreSkill: true
            },
            "Angular": {
                searchPhrases: ['(?=angular(?![-|.|\\s+]?js|\\s*1))'], // Don't mess with this.  It will match Angular on Angular, AngularJS, but not if just Angular.JS is present,
                isCoreSkill: true
            },
            "AngularJS": {
                searchPhrases: ['AngularJS', 'Angular JS', 'Angular 1', 'Angular1', 'Angular.JS'],
                isCoreSkill: true
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
            "COM": {
                searchPhrases: ["Component Object Model", " COM ", " COM,"]
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
            "iOS": {
                searchPhrases: ["iOS"],
                isCoreSkill: true
            },
            "KubeMQ": {
                searchPhrases: ["KubeMQ", "Kube MQ"]
            },
            "MariaDB": {
                searchPhrases: ["MariaDB", "Maria"]
            },
            "Microservice": {
                searchPhrases: ["Microservice", "Micro-service", "Micro Service"],
                isCoreSkill: true
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
                searchPhrases: ["PHP"],
                isCoreSkill: true
            },
            "PostgreSQL": {
                searchPhrases: ["PostgreSQL", "Postgres"]
            },
            "Python": {
                searchPhrases: ["Python"],
                isCoreSkill: true
            },
            "QA Automation": {
                searchPhrases: ["Test Automation", "QA Automation", "Quality Assurance Automation",
                    "SDET", "Software Developer in Test", "Software Development Engineer in Test", "Software Development in Test", "Software Developer Engineer in Test",
                    "automation framework"
                ],
                childSkills: ["Selenium", "JMeter", "TestNG", "Cucumber", "Maven", "SoapUI", "Protractor", "Cypress"],
                isCoreSkill: true
            },
            "QA Manual": {
                searchPhrases: ["QA Analyst", "Manual QA", "Quality Assurance Analyst", "Test Script", "Test Suite", "Test Case"],
                childSkills: ["Test Plan Creation", "Test Case Design"]
            },
            "RabbitMQ": {
                searchPhrases: ["RabbitMQ", "Rabbit MQ"]
            },
            "React": {
                searchPhrases: ['(?=react(?![-|.|\\s+]?native))'], // Don't mess with this.  It will match React on React, ReactNative, but not if just React Native is present
                isCoreSkill: true
            },
            "React Native": {
                searchPhrases: ["React Native", "React.Native", "ReactNative", "React-Native"],
                isCoreSkill: true
            },
            "Ruby": {
                searchPhrases: ["Ruby"],
                isCoreSkill: true
            },
            "Scala": {
                searchPhrases: ["Scala"]
            },
            "Selenium": {
                searchPhrases: ["Selenium"],
                childSkills: ["Selenium WebDriver", "Selenium IDE", "Selenium RC", "Selenium Grid"]
            },
            "SQL Server": {
                searchPhrases: ["Microsoft SQL Server", "SQL Server", "MS SQL"],
                isCoreSkill: true
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
                childSkills: ["HTML", "CSS", "SASS", "LESS", "JavaScript", "jQuery", "Bootstrap", "UX Research", "UX Design", "UX Writing", "Wireframing", "UI Prototyping", "Analytics"],
                isCoreSkill: true
            },
            "Visual Basic": {
                searchPhrases: ["Visual Basic", "VB5", "VB6"]
            },
            "VueJS": {
                searchPhrases: ["VueJS", "Vue.js", "Vue"],
                isCoreSkill: true
            },
            "Windows Forms": {
                searchPhrases: ["Windows Forms", "WinForms", "Win Forms"]
            },
            "Wireframing": {
                searchPhrases: ["Wirefram", "Mockups"],
                childSkills: ["Balsamiq", "Moqups", "LucidChart", "Diagrams.net", "Visio", "Cacoo", "Sketch", "Omnigraffle", "Axure", "Terrastruct", "Mockplus", "Miro", " Xd ", "Justinmind", "ProtoPie"]
            },
            "Xamarin Forms": {
                searchPhrases: ["Xamarin.Forms", "XamarinForms", "Xamarin Forms"],
                isCoreSkill: true
            },
            "Xamarin Native": {
                searchPhrases: ["Xamarin.iOS", "XamarinIos", "Xamarin iOS", "Xamarin.Android", "XamarinAndroid", "Xamarin Android"],
                isCoreSkills: true
            }
        }
    }
    window.skillStats = new skillStats();
})();