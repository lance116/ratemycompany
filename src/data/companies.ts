export interface Company {
  id: number;
  name: string;
  logo: string;
  rating: number;
  elo: number;
  reviews: Review[];
  tags: string[];
  description: string;
  pay?: string;
  averagePay: number;
  culture: number;
  prestige: number;
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  content: string;
  date: string;
  program: string;
  year: string;
}

export const baseCompanies: Company[] = [
  {
    id: 1,
    name: "Google",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Leading technology company with innovative culture",
    tags: ["Search", "Cloud", "AI/ML", "Ads"],
    pay: "$69.71/hr",
    reviews: []
  },
  {
    id: 2,
    name: "Microsoft",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Global technology leader with diverse opportunities",
    tags: ["Azure", "Office", "Gaming", "Enterprise"],
    pay: "~$50/hr",
    reviews: []
  },
  {
    id: 3,
    name: "Meta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
    rating: 0,
    elo: 1600,
    description: "Social technology company building the metaverse",
    tags: ["Social Media", "VR/AR", "Mobile", "AI"],
    pay: "$55/hr",
    reviews: []
  },
  {
    id: 4,
    name: "Amazon",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    rating: 0,
    elo: 1600,
    description: "E-commerce and cloud computing giant",
    tags: ["AWS", "E-commerce", "Logistics", "Alexa"],
    pay: "$73.73/hr",
    reviews: []
  },
  {
    id: 5,
    name: "Apple",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    rating: 0,
    elo: 1600,
    description: "Consumer technology and innovation leader",
    tags: ["iOS", "Hardware", "Design", "Consumer"],
    pay: "$58/hr",
    reviews: []
  },
  {
    id: 6,
    name: "Netflix",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Streaming entertainment and content platform",
    tags: ["Streaming", "Content", "Microservices", "Data"],
    pay: "$63/hr",
    reviews: []
  },
  {
    id: 7,
    name: "Shopify",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg",
    rating: 0,
    elo: 1600,
    description: "E-commerce platform powering businesses worldwide",
    tags: ["E-commerce", "Payments", "Canadian", "Ruby"],
    pay: "$52/hr",
    reviews: []
  },
  {
    id: 8,
    name: "Tesla",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg",
    rating: 0,
    elo: 1600,
    description: "Electric vehicles and sustainable energy",
    tags: ["Automotive", "Energy", "Autopilot", "Manufacturing"],
    pay: "$40/hr",
    reviews: []
  },
  {
    id: 9,
    name: "Uber",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png",
    rating: 0,
    elo: 1600,
    description: "Mobility and delivery technology platform",
    tags: ["Rideshare", "Delivery", "Maps", "Payments"],
    pay: "$63/hr",
    reviews: []
  },
  {
    id: 10,
    name: "Spotify",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
    rating: 0,
    elo: 1600,
    description: "Audio streaming and media services platform",
    tags: ["Music", "Audio", "Recommendations", "Mobile"],
    pay: "$58/hr",
    reviews: []
  },
  {
    id: 11,
    name: "Airbnb",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg",
    rating: 0,
    elo: 1600,
    description: "Online marketplace for lodging and experiences",
    tags: ["Marketplace", "Travel", "Payments", "Mobile"],
    pay: "$49.38/hr",
    reviews: []
  },
  {
    id: 12,
    name: "Stripe",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
    rating: 0,
    elo: 1600,
    description: "Financial infrastructure for the internet",
    tags: ["Payments", "FinTech", "APIs", "Infrastructure"],
    pay: "$78/hr",
    reviews: []
  },
  {
    id: 13,
    name: "Databricks",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/63/Databricks_Logo.png",
    rating: 0,
    elo: 1600,
    description: "Unified data analytics platform",
    tags: ["Big Data", "Analytics", "ML", "Spark"],
    pay: "$60/hr",
    reviews: []
  },
  {
    id: 14,
    name: "Palantir",
    logo: "/palantir.png",
    rating: 0,
    elo: 1600,
    description: "Big data analytics and software solutions",
    tags: ["Big Data", "Government", "Analytics", "Security"],
    pay: "$60.58/hr",
    reviews: []
  },
  {
    id: 15,
    name: "Snowflake",
    logo: "/snowflake.png",
    rating: 0,
    elo: 1600,
    description: "Cloud data platform company",
    tags: ["Data Warehouse", "Cloud", "Analytics", "SQL"],
    pay: "$53/hr",
    reviews: []
  },
  {
    id: 16,
    name: "Coinbase",
    logo: "/coinbase.png",
    rating: 0,
    elo: 1600,
    description: "Cryptocurrency exchange platform",
    tags: ["Crypto", "FinTech", "Exchange", "Blockchain"],
    pay: "$66/hr",
    reviews: []
  },
  {
    id: 17,
    name: "Discord",
    logo: "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
    rating: 0,
    elo: 1600,
    description: "Voice, video and text communication service",
    tags: ["Gaming", "Communication", "Real-time", "Community"],
    pay: "~$50/hr",
    reviews: []
  },
  {
    id: 18,
    name: "Figma",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
    rating: 0,
    elo: 1600,
    description: "Collaborative interface design tool",
    tags: ["Design", "Collaboration", "Web", "Creative"],
    pay: "$60/hr",
    reviews: []
  },
  {
    id: 19,
    name: "Notion",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    rating: 0,
    elo: 1600,
    description: "All-in-one workspace for notes and collaboration",
    tags: ["Productivity", "Collaboration", "Notes", "Workspace"],
    pay: "$60/hr",
    reviews: []
  },
  {
    id: 20,
    name: "Zoom",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg",
    rating: 0,
    elo: 1600,
    description: "Video communications platform",
    tags: ["Video", "Communication", "Enterprise", "Remote"],
    pay: "$52/hr",
    reviews: []
  },
  {
    id: 21,
    name: "Twilio",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Twilio-logo-red.svg",
    rating: 0,
    elo: 1600,
    description: "Cloud communications platform",
    tags: ["APIs", "Communication", "SMS", "Voice"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 22,
    name: "Salesforce",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Customer relationship management platform",
    tags: ["CRM", "Enterprise", "Cloud", "Sales"],
    pay: "$49/hr",
    reviews: []
  },
  {
    id: 23,
    name: "Adobe",
    logo: "/adobe.png",
    rating: 0,
    elo: 1600,
    description: "Digital media and creativity software",
    tags: ["Creative", "Design", "Media", "SaaS"],
    pay: "$45/hr",
    reviews: []
  },
  {
    id: 24,
    name: "MongoDB",
    logo: "/mongo.png",
    rating: 0,
    elo: 1600,
    description: "Document database platform",
    tags: ["Database", "NoSQL", "Cloud", "Developer Tools"],
    pay: "$61.50/hr",
    reviews: []
  },
  {
    id: 25,
    name: "Roblox",
    logo: "/roblox.png",
    rating: 0,
    elo: 1600,
    description: "Online game platform and creation system",
    tags: ["Gaming", "Platform", "UGC", "Virtual Worlds"],
    pay: "$64/hr",
    reviews: []
  },
  {
    id: 26,
    name: "Nvidia",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Graphics processing and AI computing company",
    tags: ["GPU", "AI", "Gaming", "Data Center"],
    pay: "$59/hr",
    reviews: []
  },
  {
    id: 27,
    name: "Intel",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282006-2020%29.svg",
    rating: 0,
    elo: 1600,
    description: "Semiconductor and computing technology company",
    tags: ["CPU", "Semiconductors", "Hardware", "Data Center"],
    pay: "$60/hr",
    reviews: []
  },
  {
    id: 28,
    name: "IBM",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Enterprise technology and cloud services",
    tags: ["Enterprise", "Cloud", "AI", "Consulting"],
    pay: "$50/hr",
    reviews: []
  },
  {
    id: 29,
    name: "Oracle",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Database and enterprise software company",
    tags: ["Database", "Enterprise", "Cloud", "Java"],
    pay: "$46/hr",
    reviews: []
  },
  {
    id: 30,
    name: "Cisco",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
    rating: 0,
    elo: 1600,
    description: "Networking and cybersecurity solutions",
    tags: ["Networking", "Security", "Enterprise", "Hardware"],
    pay: "$55/hr",
    reviews: []
  },
  {
    id: 31,
    name: "Dell Technologies",
    logo: "/dell.png",
    rating: 0,
    elo: 1600,
    description: "Computer technology and infrastructure solutions",
    tags: ["Hardware", "Enterprise", "Storage", "Servers"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 32,
    name: "HP",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg",
    rating: 0,
    elo: 1600,
    description: "Personal systems and printing solutions",
    tags: ["Hardware", "Printing", "PCs", "Enterprise"],
    pay: "$50.31/hr",
    reviews: []
  },
  {
    id: 33,
    name: "Qualcomm",
    logo: "/qualcomm.png",
    rating: 0,
    elo: 1600,
    description: "Wireless technology and semiconductor company",
    tags: ["Wireless", "Semiconductors", "Mobile", "5G"],
    pay: "$51/hr",
    reviews: []
  },
  {
    id: 34,
    name: "Samsung Electronics",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
    rating: 0,
    elo: 1600,
    description: "Consumer electronics and semiconductor manufacturer",
    tags: ["Electronics", "Mobile", "Semiconductors", "Display"],
    pay: "$42/hr",
    reviews: []
  },
  {
    id: 35,
    name: "Sony",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Entertainment and technology conglomerate",
    tags: ["Gaming", "Entertainment", "Electronics", "Music"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 36,
    name: "LG Electronics",
    logo: "/LG.png",
    rating: 0,
    elo: 1600,
    description: "Consumer electronics and home appliances",
    tags: ["Electronics", "Appliances", "Display", "Mobile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 37,
    name: "Broadcom",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Broadcom_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Semiconductor and infrastructure software company",
    tags: ["Semiconductors", "Software", "Infrastructure", "Chips"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 38,
    name: "Lyft",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Lyft_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Rideshare and transportation platform",
    tags: ["Rideshare", "Transportation", "Mobility", "Sharing Economy"],
    pay: "$58/hr",
    reviews: []
  },
  {
    id: 39,
    name: "ByteDance",
    logo: "/tiktok.png",
    rating: 0,
    elo: 1600,
    description: "Social media and content platform company",
    tags: ["Social Media", "TikTok", "AI", "Content"],
    pay: "$52/hr",
    reviews: []
  },
  {
    id: 40,
    name: "Baidu",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/15/Baidu_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Chinese search engine and AI company",
    tags: ["Search", "AI", "China", "Autonomous Driving"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 41,
    name: "Tencent",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Tencent_Logo.svg",
    rating: 0,
    elo: 1600,
    description: "Chinese technology and gaming conglomerate",
    tags: ["Gaming", "Social Media", "China", "WeChat"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 42,
    name: "Alibaba",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/16/Alibaba_Group_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Chinese e-commerce and cloud computing company",
    tags: ["E-commerce", "Cloud", "China", "FinTech"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 43,
    name: "Huawei",
    logo: "/huawei.png",
    rating: 0,
    elo: 1600,
    description: "Chinese telecommunications and technology company",
    tags: ["Telecommunications", "5G", "Mobile", "China"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 44,
    name: "Xiaomi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Chinese electronics and smartphone manufacturer",
    tags: ["Mobile", "Electronics", "IoT", "China"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 45,
    name: "PayPal",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
    rating: 0,
    elo: 1600,
    description: "Digital payments and financial services platform",
    tags: ["Payments", "FinTech", "E-commerce", "Digital Wallet"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 46,
    name: "Square",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/76/Square_Inc._logo.svg",
    rating: 0,
    elo: 1600,
    description: "Financial services and mobile payment company",
    tags: ["Payments", "FinTech", "Mobile", "Bitcoin"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 47,
    name: "Epic Games",
    logo: "/epic%20games.png",
    rating: 0,
    elo: 1600,
    description: "Video game development and publishing company",
    tags: ["Gaming", "Unreal Engine", "Fortnite", "Game Development"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 48,
    name: "Electronic Arts",
    logo: "/ea.png",
    rating: 0,
    elo: 1600,
    description: "Video game publishing and development company",
    tags: ["Gaming", "Sports Games", "Publishing", "Entertainment"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 49,
    name: "Activision Blizzard",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/Activision_Blizzard_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Video game publishing and development company",
    tags: ["Gaming", "Call of Duty", "World of Warcraft", "Publishing"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 50,
    name: "Unity Technologies",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/Unity_Technologies_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Game engine and development platform",
    tags: ["Game Engine", "Development Tools", "3D", "Mobile Games"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 51,
    name: "Reddit",
    logo: "/reddit.png",
    rating: 0,
    elo: 1600,
    description: "Social news aggregation and discussion platform",
    tags: ["Social Media", "Forums", "Community", "Content"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 52,
    name: "Twitter",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
    rating: 0,
    elo: 1600,
    description: "Social media and microblogging platform",
    tags: ["Social Media", "Microblogging", "News", "Real-time"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 53,
    name: "Snap Inc.",
    logo: "/snapchat.png",
    rating: 0,
    elo: 1600,
    description: "Social media and camera company",
    tags: ["Social Media", "Snapchat", "AR", "Mobile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 54,
    name: "Pinterest",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png",
    rating: 0,
    elo: 1600,
    description: "Visual discovery and bookmarking platform",
    tags: ["Social Media", "Visual Discovery", "Inspiration", "E-commerce"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 55,
    name: "LinkedIn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    rating: 0,
    elo: 1600,
    description: "Professional networking and career platform",
    tags: ["Professional Network", "Career", "B2B", "Microsoft"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 56,
    name: "Slack",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Slack_Technologies_Logo.svg",
    rating: 0,
    elo: 1600,
    description: "Business communication and collaboration platform",
    tags: ["Communication", "Collaboration", "B2B", "Salesforce"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 57,
    name: "Dropbox",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg",
    rating: 0,
    elo: 1600,
    description: "Cloud storage and file synchronization service",
    tags: ["Cloud Storage", "File Sync", "Collaboration", "Productivity"],
    pay: "$54.81/hr",
    reviews: []
  },
  {
    id: 58,
    name: "Atlassian",
    logo: "/atlassian.png",
    rating: 0,
    elo: 1600,
    description: "Software development and collaboration tools",
    tags: ["Development Tools", "Jira", "Confluence", "Agile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 59,
    name: "Cloudflare",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Cloudflare_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Web performance and security services",
    tags: ["CDN", "Security", "DNS", "Web Performance"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 60,
    name: "VMware",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/VMware_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Cloud infrastructure and virtualization software",
    tags: ["Virtualization", "Cloud", "Enterprise", "Infrastructure"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 61,
    name: "ServiceNow",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/ServiceNow_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Cloud computing platform for digital workflows",
    tags: ["Cloud", "Workflow", "Enterprise", "Automation"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 62,
    name: "Workday",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Workday_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Enterprise cloud applications for finance and HR",
    tags: ["Enterprise", "HR", "Finance", "Cloud"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 63,
    name: "SAP",
    logo: "/sap.webp",
    rating: 0,
    elo: 1600,
    description: "Enterprise application software and services",
    tags: ["Enterprise", "ERP", "Software", "Business"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 64,
    name: "Okta",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Okta_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Identity and access management platform",
    tags: ["Identity", "Security", "Authentication", "Enterprise"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 65,
    name: "Toast",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Toast_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Restaurant technology and point-of-sale platform",
    tags: ["Restaurant Tech", "POS", "FinTech", "SaaS"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 66,
    name: "Affirm",
    logo: "/affirm.png",
    rating: 0,
    elo: 1600,
    description: "Buy now, pay later financial services",
    tags: ["FinTech", "Payments", "Credit", "E-commerce"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 67,
    name: "Plaid",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Plaid_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Financial data network and API platform",
    tags: ["FinTech", "API", "Banking", "Data"],
    pay: "$55.96/hr",
    reviews: []
  },
  {
    id: 68,
    name: "Duolingo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/63/Duolingo_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Language learning platform and mobile app",
    tags: ["Education", "Mobile", "Language Learning", "Gamification"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 69,
    name: "Coursera",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Coursera_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Online learning platform and MOOC provider",
    tags: ["Education", "Online Learning", "MOOCs", "University"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 70,
    name: "Riot Games",
    logo: "/riot%20games.png",
    rating: 0,
    elo: 1600,
    description: "Video game developer and publisher",
    tags: ["Gaming", "League of Legends", "Esports", "Development"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 71,
    name: "Bungie",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Bungie_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Video game developer and publisher",
    tags: ["Gaming", "Destiny", "Halo", "Development"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 72,
    name: "Valve",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Valve_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Video game developer and digital distribution platform",
    tags: ["Gaming", "Steam", "Half-Life", "Digital Distribution"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 73,
    name: "Nintendo",
    logo: "/nintendo.png",
    rating: 0,
    elo: 1600,
    description: "Video game console and software company",
    tags: ["Gaming", "Console", "Mario", "Zelda"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 74,
    name: "PlayStation",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0d/PlayStation_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Gaming console and entertainment brand",
    tags: ["Gaming", "Console", "Sony", "Entertainment"],
    pay: "$53/hr",
    reviews: []
  },
  {
    id: 75,
    name: "Twitch",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Twitch_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Live streaming platform for gaming and content",
    tags: ["Gaming", "Streaming", "Live Video", "Community"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 76,
    name: "DoorDash",
    logo: "/doordash.png",
    rating: 0,
    elo: 1600,
    description: "Food delivery and logistics platform",
    tags: ["Delivery", "Food", "Logistics", "Mobile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 77,
    name: "Instacart",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Instacart_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Grocery delivery and pickup service",
    tags: ["Delivery", "Grocery", "Logistics", "Mobile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 78,
    name: "eBay",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Online marketplace and auction platform",
    tags: ["E-commerce", "Marketplace", "Auctions", "Retail"],
    pay: "$53/hr",
    reviews: []
  },
  {
    id: 79,
    name: "Etsy",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Etsy_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Online marketplace for handmade and vintage items",
    tags: ["E-commerce", "Handmade", "Crafts", "Marketplace"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 80,
    name: "Grubhub",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Grubhub_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Food delivery and restaurant platform",
    tags: ["Delivery", "Food", "Restaurants", "Mobile"],
    pay: "$45/hr",
    reviews: []
  },
  {
    id: 81,
    name: "Deliveroo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Deliveroo_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Food delivery platform and logistics service",
    tags: ["Delivery", "Food", "Logistics", "Mobile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 82,
    name: "Robinhood",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Robinhood_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Commission-free stock trading and investment platform",
    tags: ["FinTech", "Trading", "Investing", "Mobile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 83,
    name: "Chime",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Chime_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Digital banking and financial services platform",
    tags: ["FinTech", "Banking", "Digital", "Mobile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 84,
    name: "SoFi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/SoFi_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Personal finance and lending platform",
    tags: ["FinTech", "Lending", "Banking", "Personal Finance"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 85,
    name: "Brex",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Brex_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Corporate credit card and financial services",
    tags: ["FinTech", "Corporate", "Credit Cards", "B2B"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 86,
    name: "Revolut",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Revolut_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Digital banking and financial services app",
    tags: ["FinTech", "Banking", "Digital", "International"],
    pay: "$27.69/hr",
    reviews: []
  },
  {
    id: 87,
    name: "Wise",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Wise_logo.svg",
    rating: 0,
    elo: 1600,
    description: "International money transfer and financial services",
    tags: ["FinTech", "Money Transfer", "International", "Banking"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 88,
    name: "Capital One",
    logo: "/capital%20one.png",
    rating: 0,
    elo: 1600,
    description: "Financial services and credit card company",
    tags: ["FinTech", "Banking", "Credit Cards", "Financial Services"],
    pay: "$64/hr",
    reviews: []
  },
  {
    id: 89,
    name: "Goldman Sachs",
    logo: "/goldman%20sachs.png",
    rating: 0,
    elo: 1600,
    description: "Investment banking and financial services",
    tags: ["Investment Banking", "Finance", "Trading", "Investment"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 90,
    name: "Jane Street",
    logo: "/jane%20street.png",
    rating: 0,
    elo: 1600,
    description: "Quantitative trading and market making firm",
    tags: ["Quantitative Trading", "Finance", "Algorithms", "High Frequency"],
    pay: "$120.19/hr",
    reviews: []
  },
  {
    id: 91,
    name: "Citadel",
    logo: "/citadel.jpg",
    rating: 0,
    elo: 1600,
    description: "Investment management and trading firm",
    tags: ["Quantitative Trading", "Hedge Fund", "Finance", "Algorithms"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 92,
    name: "Two Sigma",
    logo: "/two%20sigma.png",
    rating: 0,
    elo: 1600,
    description: "Quantitative investment management and technology",
    tags: ["Quantitative Trading", "Hedge Fund", "Data Science", "Finance"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 93,
    name: "Jump Trading",
    logo: "/jump.png",
    rating: 0,
    elo: 1600,
    description: "Quantitative trading and market making firm",
    tags: ["Quantitative Trading", "Finance", "Algorithms", "High Frequency"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 94,
    name: "Hudson River Trading",
    logo: "/HRT.png",
    rating: 0,
    elo: 1600,
    description: "Quantitative trading and technology firm",
    tags: ["Quantitative Trading", "Finance", "Algorithms", "Technology"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 95,
    name: "IMC Trading",
    logo: "/imc.jpg",
    rating: 0,
    elo: 1600,
    description: "Quantitative trading and market making firm",
    tags: ["Quantitative Trading", "Finance", "Algorithms", "Market Making"],
    pay: "$96.35/hr",
    reviews: []
  },
  {
    id: 96,
    name: "Optiver",
    logo: "/optiver.png",
    rating: 0,
    elo: 1600,
    description: "Market making and quantitative trading firm",
    tags: ["Quantitative Trading", "Market Making", "Finance", "Algorithms"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 97,
    name: "DRW",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/DRW_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Quantitative trading and technology firm",
    tags: ["Quantitative Trading", "Finance", "Technology", "Algorithms"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 98,
    name: "D.E. Shaw",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/DE_Shaw_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Investment management and quantitative research",
    tags: ["Quantitative Trading", "Hedge Fund", "Finance", "Research"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 99,
    name: "Millennium",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Millennium_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Global investment management firm",
    tags: ["Hedge Fund", "Investment Management", "Finance", "Global"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 100,
    name: "AMD",
    logo: "/amd.png",
    rating: 0,
    elo: 1600,
    description: "Semiconductor and microprocessor company",
    tags: ["CPU", "GPU", "Semiconductors", "Hardware"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 101,
    name: "Texas Instruments",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Texas_Instruments_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Semiconductor and technology company",
    tags: ["Semiconductors", "Electronics", "Chips", "Technology"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 102,
    name: "Micron Technology",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Micron_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Memory and storage solutions company",
    tags: ["Memory", "Storage", "Semiconductors", "Hardware"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 103,
    name: "ASML",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/ASML_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Semiconductor equipment and lithography systems",
    tags: ["Semiconductors", "Equipment", "Lithography", "Manufacturing"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 104,
    name: "Arm",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Arm_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Semiconductor and software design company",
    tags: ["CPU", "Semiconductors", "Design", "Mobile"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 105,
    name: "GitHub",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/GitHub_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Code hosting and collaboration platform",
    tags: ["Development", "Git", "Open Source", "Microsoft"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 106,
    name: "GitLab",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/GitLab_logo.svg",
    rating: 0,
    elo: 1600,
    description: "DevOps platform and code collaboration tool",
    tags: ["DevOps", "Git", "CI/CD", "Development"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 107,
    name: "HashiCorp",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/HashiCorp_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Infrastructure automation and cloud tooling",
    tags: ["DevOps", "Infrastructure", "Cloud", "Automation"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 108,
    name: "DigitalOcean",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/DigitalOcean_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Cloud computing and infrastructure platform",
    tags: ["Cloud", "Infrastructure", "VPS", "Hosting"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 109,
    name: "Fastly",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Fastly_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Edge cloud platform and CDN services",
    tags: ["CDN", "Edge Computing", "Performance", "Cloud"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 110,
    name: "Elastic",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Elastic_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Search and analytics engine platform",
    tags: ["Search", "Analytics", "Elasticsearch", "Data"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 111,
    name: "Confluent",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Confluent_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Data streaming platform and Apache Kafka company",
    tags: ["Data Streaming", "Kafka", "Real-time", "Data"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 112,
    name: "Datadog",
    logo: "/datadog.png",
    rating: 0,
    elo: 1600,
    description: "Monitoring and analytics platform for cloud applications",
    tags: ["Monitoring", "Analytics", "DevOps", "Cloud"],
    pay: "N/A",
    reviews: []
  },
  {
    id: 113,
    name: "Docker",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Docker_logo.svg",
    rating: 0,
    elo: 1600,
    description: "Containerization platform and development tools",
    tags: ["Containers", "DevOps", "Development", "Platform"],
    pay: "N/A",
    reviews: []
  }
];

import { getStoredRatings, getEloHistory, updateEloHistory, getCompanyReviews, calculateOverallRating, calculateAveragePay, calculateAverageCulture, calculateAveragePrestige } from '@/utils/elo';

export const getCompanies = (): Company[] => {
  const storedRatings = getStoredRatings();
  
  // First, create all companies with their current ELO ratings
  const companiesWithElo = baseCompanies.map(company => {
    const currentElo = storedRatings[company.id] || company.elo;
      const reviews = getCompanyReviews(company.id);
      const overallRating = calculateOverallRating(reviews);
      const averagePay = calculateAveragePay(reviews);
      const culture = calculateAverageCulture(reviews);
      const prestige = calculateAveragePrestige(reviews);
      
      // Update pay string based on average pay from reviews
      const payString = averagePay > 0 ? `$${averagePay}/hr` : company.pay;
      
      return {
        ...company,
        elo: currentElo,
        rating: overallRating,
        reviews: reviews,
        averagePay: averagePay,
        culture: culture,
        prestige: prestige,
        pay: payString
      };
  });
  
  // Sort by ELO to get proper rankings
  const sortedCompanies = companiesWithElo.sort((a, b) => b.elo - a.elo);
  
  // Now initialize ELO history for companies that don't have it, using the sorted order
  sortedCompanies.forEach(company => {
    const history = getEloHistory(company.id);
    if (history.length === 0) {
      updateEloHistory(company.id, company.elo, sortedCompanies);
    }
  });
  
  return sortedCompanies;
};

export const companies = getCompanies();