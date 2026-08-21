import {
  AFRICA_CITY_MARKETS,
  AFRICA_COUNTRY_MARKETS,
  AFRICA_REGIONS,
  cityGuide,
  cityHighlights,
  cityIntro,
  countryGuide,
  countryHighlights,
  countryIntro,
  nearbyCitySlugs,
  nearbyCountrySlugs,
} from "@/lib/africa-markets";
import { KENYA_COUNTIES, getCountyTowns, type KenyaCounty } from "@/lib/kenya";
import { slugify } from "@/lib/utils";

export type SalePlaceKind = "county" | "town" | "country" | "city";

export type PropertyForSalePlace = {
  slug: string;
  name: string;
  kind: SalePlaceKind;
  county: KenyaCounty | string;
  country: string;
  region: string;
  towns: string[];
  nearbySlugs: string[];
  intro: string;
  buyingGuide: string;
  highlights: [string, string, string];
};

type CountyCopy = {
  region: string;
  towns: string[];
  nearby: string[];
  intro: string;
  buyingGuide: string;
  highlights: [string, string, string];
};

const COUNTY_COPY: Record<KenyaCounty, CountyCopy> = {
  Nairobi: {
    region: "Nairobi",
    towns: [
      "Westlands",
      "Kilimani",
      "Karen",
      "Lavington",
      "Runda",
      "Langata",
      "Kasarani",
      "Syokimau",
    ],
    nearby: ["kiambu", "kajiado", "machakos"],
    intro:
      "Nairobi is Kenya’s main property market — from Kilimani apartments and Westlands mixed-use homes to Karen gardens, Runda villas, and family houses along Ngong Road. Buyers compare KES prices, title status, and commute to the CBD, Upper Hill, and the airport.",
    buyingGuide:
      "Start with the neighbourhood, not only the asking price. In Nairobi, service charge, parking, water backup, and proximity to schools move value as much as size. Inspect the title, land rates, and any management company rules before you pay a deposit. Your Home lists verified houses, apartments, and land for sale across the city so you can shortlist and book a viewing.",
    highlights: [
      "Apartments, townhouses, and villas across all price bands",
      "Strong rental demand if you are buying to let",
      "Direct contact with verified agents and owners",
    ],
  },
  Kiambu: {
    region: "Central",
    towns: ["Thika", "Ruiru", "Juja", "Kikuyu", "Limuru", "Tigoni", "Kiambu Town"],
    nearby: ["nairobi", "muranga", "machakos"],
    intro:
      "Kiambu sits on Nairobi’s northern edge and is one of Kenya’s busiest counties for houses and plots. Thika Road, Ruiru, Juja, Kikuyu, and Limuru attract buyers who want more land, newer estates, and a shorter jump into the city than farther satellite towns.",
    buyingGuide:
      "Confirm whether the plot is in a controlled development, the status of water and electricity, and the access road. Many Kiambu sales are gated courts and 50×100 plots — ask for a current search and beacon certificate. Compare Thika, Ruiru, and Kikuyu prices on Your Home before you commit.",
    highlights: [
      "Plots and family houses along Thika Road and Kikuyu",
      "Growing estates with Nairobi commuting access",
      "Land and completed homes listed side by side",
    ],
  },
  Kajiado: {
    region: "Rift Valley",
    towns: ["Kitengela", "Ongata Rongai", "Ngong", "Kiserian", "Isinya", "Kajiado Town"],
    nearby: ["nairobi", "narok", "machakos"],
    intro:
      "Kajiado is a high-demand corridor for land and houses south of Nairobi — Kitengela, Ongata Rongai, Ngong, and Kiserian. Buyers look for plots with clean title, Namanga Road access, and room to build, plus ready maisonettes in growing neighbourhoods.",
    buyingGuide:
      "Kajiado land deals need extra care: verify the title, ground rent or rates, and whether the plot sits in a planned scheme. Drive the access road in the rains. Kitengela and Rongai sell quickly, so use Your Home to compare several listings and speak to the seller before you send money.",
    highlights: [
      "Plots and houses in Kitengela, Rongai, and Ngong",
      "Space to build compared with inner Nairobi",
      "Verified land and home listings with photos",
    ],
  },
  Nakuru: {
    region: "Rift Valley",
    towns: ["Nakuru Town", "Naivasha", "Gilgil", "Njoro", "Molo", "Bahati"],
    nearby: ["kiambu", "baringo", "narok"],
    intro:
      "Nakuru County mixes town living with lake and highland homes. Buyers search Nakuru Town, Naivasha, Gilgil, and Njoro for houses, farms, and plots at a lower entry price than Nairobi, with the Nairobi–Nakuru highway and SGR shaping demand.",
    buyingGuide:
      "Decide whether you want an urban house in Nakuru Town, a Naivasha holiday or rental home, or agricultural land in Njoro and Molo. Check water sources and, for lakeside property, riparian rules. Browse current KES asking prices on Your Home and book a viewing with the listed agent.",
    highlights: [
      "Town houses, Naivasha homes, and highland farms",
      "Lower entry prices than Nairobi for similar size",
      "Land and residential sales in one search",
    ],
  },
  Mombasa: {
    region: "Coast",
    towns: ["Nyali", "Bamburi", "Kisauni", "Likoni", "Mombasa Island", "Changamwe"],
    nearby: ["kwale", "kilifi", "taita-taveta"],
    intro:
      "Mombasa property for sale covers island apartments, Nyali and Bamburi coastal homes, and mainland houses in Changamwe and Likoni. Buyers weigh sea breeze, beach access, Mombasa–Malindi Road, and title issues unique to coastal land.",
    buyingGuide:
      "On the coast, always confirm the title type and any lease remaining. Ask about flooding, sea wall condition, and management fees for apartments. Nyali and Bamburi command a premium; island flats suit investors who want rental demand from the port and CBD. Shortlist on Your Home, then inspect in person.",
    highlights: [
      "Nyali, Bamburi, and island apartments",
      "Homes near the beach, port, and CBD",
      "Verified coastal listings with photos",
    ],
  },
  Kisumu: {
    region: "Nyanza",
    towns: ["Kisumu CBD", "Milimani", "Riat", "Mamboleo", "Kondele", "Dunga"],
    nearby: ["siaya", "vihiga", "kericho"],
    intro:
      "Kisumu is Western Kenya’s lakeside city. Property for sale includes Milimani homes, CBD apartments, and expanding estates in Riat and Mamboleo. Buyers look for lake views, airport access, and solid rental demand from government and lake-region trade.",
    buyingGuide:
      "Compare Milimani and lakeside plots with newer estates on the Kakamega and Busia roads. Check drainage — parts of Kisumu flood in long rains. Use Your Home to see asking prices in KES, then visit with a local advocate before you transfer funds.",
    highlights: [
      "Milimani houses and city apartments",
      "Growing estates toward Riat and Mamboleo",
      "Lake-region demand for homes and rentals",
    ],
  },
  Machakos: {
    region: "Eastern",
    towns: ["Machakos Town", "Syokimau", "Mlolongo", "Athi River", "Kangundo", "Matuu"],
    nearby: ["nairobi", "kiambu", "makueni", "kajiado"],
    intro:
      "Machakos County catches Nairobi overflow along Mombasa Road — Syokimau, Mlolongo, Athi River — plus Machakos Town and Kangundo. Buyers want apartments, maisonettes, and plots with SGR and airport access without Nairobi rates.",
    buyingGuide:
      "Syokimau and Mlolongo sell on commute time; Machakos Town offers more land. Confirm the developer, parking, and water for apartments. For plots, get a survey and check industrial-zone buffers around Athi River. Compare listings on Your Home before you travel to view.",
    highlights: [
      "Syokimau and Mlolongo apartments",
      "Plots toward Machakos Town and Kangundo",
      "Airport and Mombasa Road access",
    ],
  },
  "Uasin Gishu": {
    region: "Rift Valley",
    towns: ["Eldoret", "Burnt Forest", "Turbo", "Moiben", "Ziwa"],
    nearby: ["nandi", "trans-nzoia", "elgeyo-marakwet"],
    intro:
      "Uasin Gishu is anchored by Eldoret — a fast-growing town for houses, apartments, and farms. Buyers include families, athletes’ investors, and people relocating from Nairobi who want cooler weather and the Eldoret–Nairobi highway.",
    buyingGuide:
      "Eldoret estates vary widely in finishing and water supply. Ask about tarmac access and school catchments. Farmland around Turbo and Moiben needs soil and title checks. Browse Eldoret property for sale on Your Home and filter by price in KES.",
    highlights: [
      "Eldoret houses and apartments",
      "Farms on the Uasin Gishu plateau",
      "Growing town with highway access",
    ],
  },
  Kwale: {
    region: "Coast",
    towns: ["Diani", "Ukunda", "Kwale Town", "Msambweni", "Lungalunga"],
    nearby: ["mombasa", "kilifi", "taita-taveta"],
    intro:
      "Kwale is home to Diani, Ukunda, and south-coast land. Property for sale includes beach villas, holiday homes, and plots behind the shoreline. Buyers mix personal use with BnB potential, so title and beach-access rights matter.",
    buyingGuide:
      "Never buy south-coast land on a WhatsApp screenshot. Confirm the title, survey, and any beach or forest reserve boundary. Diani villas need a realistic view of occupancy if you plan short-stays. Your Home shows verified Kwale listings so you can compare before you fly to view.",
    highlights: [
      "Diani and Ukunda beach homes",
      "Plots behind the south coast",
      "Holiday-home and residential sales",
    ],
  },
  Kilifi: {
    region: "Coast",
    towns: ["Kilifi Town", "Malindi", "Watamu", "Mtwapa", "Vipingo", "Mariakani"],
    nearby: ["mombasa", "kwale", "tana-river"],
    intro:
      "Kilifi County stretches from Mtwapa and Vipingo to Kilifi Town, Malindi, and Watamu. Buyers look for beach plots, retirement homes, and houses along the Mombasa–Malindi highway with a slower pace than Mombasa island.",
    buyingGuide:
      "Coastal titles and lease years are the first check. Watamu and Malindi suit holiday and second homes; Mtwapa is closer to Mombasa jobs. Inspect water, access roads, and erosion risk. Shortlist Kilifi property for sale on Your Home, then walk the plot with a surveyor.",
    highlights: [
      "Malindi, Watamu, and Kilifi Town homes",
      "Mtwapa and Vipingo for Mombasa commuters",
      "Beach and inland plots with verified photos",
    ],
  },
  Kisii: {
    region: "Nyanza",
    towns: ["Kisii Town", "Ogembo", "Keroka", "Suneka"],
    nearby: ["nyamira", "migori", "homa-bay"],
    intro:
      "Kisii Town and the surrounding highlands are a steady market for family houses, shops with rooms, and small farms. Buyers often come from the diaspora or from Nairobi looking for a home near relatives and the Kisii–Keroka corridor.",
    buyingGuide:
      "Highland plots can be steep — check access for construction trucks and rain runoff. Confirm succession on family land before you pay. Your Home lists Kisii property for sale with prices in KES so you can compare town and rural options.",
    highlights: [
      "Kisii Town houses and commercial rooms",
      "Highland farms near Keroka and Ogembo",
      "Family and diaspora buyers welcome",
    ],
  },
  Meru: {
    region: "Eastern",
    towns: ["Meru Town", "Maua", "Nkubu", "Timau", "Mikinduri"],
    nearby: ["tharaka-nithi", "isiolo", "laikipia"],
    intro:
      "Meru County offers town houses on the slopes of Mt Kenya, farmland in Timau, and trading-centre plots in Nkubu and Maua. Buyers want cooler climate, agricultural income, and a growing county headquarters.",
    buyingGuide:
      "Agricultural land needs water rights and soil questions; town plots need rates and access. Timau and Nanyuki-adjacent farms attract Nairobi buyers. Use Your Home to see current Meru listings, then visit during both dry and wet seasons if you can.",
    highlights: [
      "Meru Town homes and Mt Kenya farms",
      "Timau and Nkubu land opportunities",
      "Cooler climate than the lowlands",
    ],
  },
  Kakamega: {
    region: "Western",
    towns: ["Kakamega Town", "Mumias", "Lugari", "Malava", "Butere"],
    nearby: ["vihiga", "bungoma", "nandi"],
    intro:
      "Kakamega is Western Kenya’s largest county by population. Property for sale includes Kakamega Town houses, Mumias plots, and rural land under the forest and sugar-belt towns. Buyers look for affordable family homes and rental units near the university and hospital.",
    buyingGuide:
      "Town houses near Kakamega CBD rent well to students and civil servants. Rural land needs clear succession. Compare asking prices on Your Home and confirm beacons on the ground before you sign.",
    highlights: [
      "Kakamega Town and Mumias houses",
      "Affordable plots for first-time buyers",
      "University and hospital rental demand",
    ],
  },
  Bungoma: {
    region: "Western",
    towns: ["Bungoma Town", "Webuye", "Kimilili", "Chwele", "Malakisi"],
    nearby: ["trans-nzoia", "busia", "kakamega"],
    intro:
      "Bungoma sits on the Kenya–Uganda corridor with Webuye, Kimilili, and Bungoma Town as the main property centres. Buyers search for family houses, shops, and farmland with highway access.",
    buyingGuide:
      "Webuye and Bungoma Town suit people who want tarmac and services. Farmland toward Mt Elgon needs access and title checks. Browse Bungoma property for sale on Your Home, then inspect with a local advocate.",
    highlights: [
      "Bungoma Town and Webuye homes",
      "Highway trade and family houses",
      "Farms toward the Mt Elgon side",
    ],
  },
  "Trans Nzoia": {
    region: "Rift Valley",
    towns: ["Kitale", "Kiminini", "Endebess", "Saboti"],
    nearby: ["uasin-gishu", "west-pokot", "bungoma"],
    intro:
      "Trans Nzoia is Kitale country — maize farms, town plots, and houses for families who want highland living. Property for sale ranges from Kitale estates to acreage toward Endebess and the national park edge.",
    buyingGuide:
      "Farm size, rainfall, and title are the big three. Town plots in Kitale should have clear access. Your Home lists Trans Nzoia houses and land so you can compare KES prices before travelling from Nairobi or Eldoret.",
    highlights: [
      "Kitale town houses and estates",
      "Agricultural land in a high-rainfall zone",
      "Gateway to western highland living",
    ],
  },
  Laikipia: {
    region: "Rift Valley",
    towns: ["Nanyuki", "Nyahururu", "Rumuruti", "Ngobit"],
    nearby: ["nyeri", "meru", "samburu", "nakuru"],
    intro:
      "Laikipia draws buyers to Nanyuki, Nyahururu, and conservation-adjacent land. Property for sale includes town houses, cottages, and larger plots with mountain views and a cooler climate.",
    buyingGuide:
      "Nanyuki demand is strong for second homes and rentals. Check water, fencing, and any conservancy neighbour issues. Nyahururu offers more town living. Compare Laikipia listings on Your Home and visit in person — photos miss the wind and access roads.",
    highlights: [
      "Nanyuki and Nyahururu homes",
      "Cool climate and mountain views",
      "Town plots and larger lifestyle land",
    ],
  },
  Nyeri: {
    region: "Central",
    towns: ["Nyeri Town", "Karatina", "Othaya", "Mukurwe-ini", "Naromoru"],
    nearby: ["muranga", "kirinyaga", "laikipia"],
    intro:
      "Nyeri County is a Central Kenya favourite for family houses, tea-zone homes, and Karatina trade. Buyers want Nyeri Town convenience, Othaya quiet, and land with reliable rainfall.",
    buyingGuide:
      "Central Kenya family land often has succession history — get a search. Karatina and Nyeri Town have rental demand. Use Your Home to filter Nyeri property for sale by price, then walk the plot with a surveyor.",
    highlights: [
      "Nyeri Town and Karatina houses",
      "Tea-highland homes around Othaya",
      "Stable family-buyer market",
    ],
  },
  "Murang'a": {
    region: "Central",
    towns: ["Murang'a Town", "Kenol", "Kandara", "Kangari", "Maragua"],
    nearby: ["kiambu", "nyeri", "kirinyaga"],
    intro:
      "Murang'a sits between Nairobi’s Kiambu edge and Nyeri. Kenol, Murang'a Town, and Kandara attract buyers who want plots and houses with Thika Road or Murang'a Road access and more space than Nairobi.",
    buyingGuide:
      "Kenol has seen fast estate growth — check the developer and water. Rural land needs succession and access checks. Compare Murang'a property for sale on Your Home before you drive up from Nairobi.",
    highlights: [
      "Kenol and Murang'a Town estates",
      "Plots with Nairobi-road access",
      "Houses and agricultural land",
    ],
  },
  Kirinyaga: {
    region: "Central",
    towns: ["Kerugoya", "Kutus", "Sagana", "Mwea", "Kianyaga"],
    nearby: ["nyeri", "embu", "muranga"],
    intro:
      "Kirinyaga offers Kerugoya–Kutus town homes, Sagana highway plots, and Mwea irrigation-belt land. Buyers look for rice-zone farms and quieter Central Kenya living.",
    buyingGuide:
      "Mwea land value tracks water access. Town plots in Kerugoya should have rates clearance. Shortlist Kirinyaga listings on Your Home and confirm irrigation or river rights in writing.",
    highlights: [
      "Kerugoya and Kutus houses",
      "Mwea and Sagana land",
      "Highway access toward Nairobi",
    ],
  },
  Nyandarua: {
    region: "Central",
    towns: ["Ol Kalou", "Engineer", "Nyahururu", "Njabini", "Kinangop"],
    nearby: ["nyeri", "nakuru", "laikipia"],
    intro:
      "Nyandarua is highland country — Kinangop, Engineer, Ol Kalou — known for potatoes, dairy, and cool-climate homes. Buyers want acreage and town plots without Nairobi density.",
    buyingGuide:
      "Frost, road condition, and water define value here. Town plots in Ol Kalou differ from Kinangop farms. Browse Nyandarua property for sale on Your Home, then visit in the cold season if you plan to live there year-round.",
    highlights: [
      "Kinangop and Ol Kalou land",
      "Cool-climate family homes",
      "Agricultural and residential sales",
    ],
  },
  Embu: {
    region: "Eastern",
    towns: ["Embu Town", "Runyenjes", "Siakago", "Manyatta"],
    nearby: ["kirinyaga", "tharaka-nithi", "kitui"],
    intro:
      "Embu Town on the Mt Kenya slopes is a compact market for houses, shops, and small farms. Buyers from Nairobi look for cooler weather and a calmer county headquarters.",
    buyingGuide:
      "Slope and access matter for building. Confirm title on family land. Your Home lists Embu property for sale so you can compare town and Runyenjes options in KES.",
    highlights: [
      "Embu Town houses and plots",
      "Runyenjes and Manyatta land",
      "Mt Kenya slope living",
    ],
  },
  Kitui: {
    region: "Eastern",
    towns: ["Kitui Town", "Mwingi", "Mutomo", "Kibwezi East"],
    nearby: ["machakos", "makueni", "tana-river"],
    intro:
      "Kitui County offers affordable town plots in Kitui and Mwingi plus larger dryland farms. Buyers who want space and lower KES prices than the Nairobi metro start here.",
    buyingGuide:
      "Water is the first question on Kitui land. Town plots need a realistic plan for drilling or county supply. Compare Kitui and Mwingi listings on Your Home and inspect boreholes or rivers yourself.",
    highlights: [
      "Kitui Town and Mwingi plots",
      "Larger farms at accessible prices",
      "Space away from Nairobi density",
    ],
  },
  Makueni: {
    region: "Eastern",
    towns: ["Wote", "Mtito Andei", "Kibwezi", "Email", "Sultan Hamud"],
    nearby: ["machakos", "kajiado", "kitui"],
    intro:
      "Makueni sits on the Mombasa Road and SGR belt — Email, Sultan Hamud, Kibwezi, Wote. Buyers look for highway plots, farms, and houses with a lower price than Machakos satellite towns.",
    buyingGuide:
      "Highway frontage is valuable but check setbacks. Inland farms need water. Your Home shows Makueni property for sale so you can compare Wote town homes with Mombasa Road plots.",
    highlights: [
      "Mombasa Road and SGR corridor plots",
      "Wote town houses",
      "Farms toward Kibwezi",
    ],
  },
  "Tharaka-Nithi": {
    region: "Eastern",
    towns: ["Chuka", "Chogoria", "Marimanti", "Kathwana"],
    nearby: ["meru", "embu", "kitui"],
    intro:
      "Tharaka-Nithi includes Chuka and Chogoria on the Mt Kenya road and drier Tharaka lowlands. Buyers want highland homes, tea-zone land, and quieter town plots.",
    buyingGuide:
      "Highland vs lowland water and climate are very different — visit the exact ward. Confirm title. Browse Tharaka-Nithi listings on Your Home before you travel from Nairobi or Meru.",
    highlights: [
      "Chuka and Chogoria highland homes",
      "Tea-zone and town plots",
      "Quieter alternative to Meru Town",
    ],
  },
  Nyamira: {
    region: "Nyanza",
    towns: ["Nyamira Town", "Keroka", "Nyansiongo"],
    nearby: ["kisii", "kericho", "bomet"],
    intro:
      "Nyamira is a compact highland county next to Kisii. Property for sale is mostly family houses, tea plots, and Nyamira Town shops with rooms.",
    buyingGuide:
      "Steep land is common — budget for foundation and access. Family land needs succession papers. Compare Nyamira property for sale on Your Home with nearby Kisii listings.",
    highlights: [
      "Nyamira Town houses",
      "Highland tea and family plots",
      "Close to Kisii amenities",
    ],
  },
  "Homa Bay": {
    region: "Nyanza",
    towns: ["Homa Bay Town", "Mbita", "Oyugis", "Kendu Bay", "Ndhiwa"],
    nearby: ["migori", "kisii", "kisumu"],
    intro:
      "Homa Bay County covers lake towns, Mbita, and Oyugis. Buyers look for lakeside land, town houses, and farms with a lower price than Kisumu city.",
    buyingGuide:
      "Lakeside plots need riparian and flood checks. Town houses in Homa Bay and Oyugis should have clear access. Shortlist on Your Home, then see the lake level and road in person.",
    highlights: [
      "Homa Bay Town and Oyugis homes",
      "Lakeside land toward Mbita",
      "Affordable Nyanza alternatives",
    ],
  },
  Migori: {
    region: "Nyanza",
    towns: ["Migori Town", "Awendo", "Kehancha", "Isebania"],
    nearby: ["homa-bay", "kisii", "narok"],
    intro:
      "Migori sits on the Tanzania border corridor. Property for sale includes Migori Town houses, Awendo, and border-trade plots at Isebania.",
    buyingGuide:
      "Border towns can be busy — check security and access. Agricultural land needs title clarity. Use Your Home to compare Migori listings in KES before you travel.",
    highlights: [
      "Migori Town and Awendo houses",
      "Isebania corridor plots",
      "Cross-border trade locations",
    ],
  },
  Siaya: {
    region: "Nyanza",
    towns: ["Siaya Town", "Bondo", "Ugunja", "Usenge", "Yala"],
    nearby: ["kisumu", "busia", "vihiga"],
    intro:
      "Siaya offers lake and inland towns — Bondo, Siaya Town, Ugunja. Buyers search for affordable houses, lakeside land, and farms near Kisumu County.",
    buyingGuide:
      "Lakeside vs inland water access differs. Town plots should have a plan for utilities. Browse Siaya property for sale on Your Home and inspect during rains if the plot is low-lying.",
    highlights: [
      "Siaya Town and Bondo homes",
      "Land near Lake Victoria",
      "Lower prices than Kisumu city",
    ],
  },
  Vihiga: {
    region: "Western",
    towns: ["Mbale", "Luanda", "Chavakali", "Hamisi"],
    nearby: ["kakamega", "kisumu", "nandi"],
    intro:
      "Vihiga is a small, densely settled highland county between Kakamega and Kisumu. Property for sale is mostly compact family plots and houses in Mbale, Luanda, and Chavakali.",
    buyingGuide:
      "Plots are often small — confirm beacons carefully. Access lanes can be tight for construction. Compare Vihiga listings on Your Home with Kakamega if you need more land.",
    highlights: [
      "Mbale and Luanda houses",
      "Compact highland family plots",
      "Between Kakamega and Kisumu",
    ],
  },
  Busia: {
    region: "Western",
    towns: ["Busia Town", "Malaba", "Nambale", "Port Victoria"],
    nearby: ["siaya", "bungoma", "kakamega"],
    intro:
      "Busia is a border county with Busia Town, Malaba, and Port Victoria. Buyers look for trade-area plots, family houses, and land near the Uganda crossing.",
    buyingGuide:
      "Border demand can raise town plot prices. Confirm title and flooding near the lake. Your Home lists Busia property for sale so you can compare town and rural options.",
    highlights: [
      "Busia Town and Malaba plots",
      "Border-trade locations",
      "Lake and inland land",
    ],
  },
  Bomet: {
    region: "Rift Valley",
    towns: ["Bomet Town", "Sotik", "Mulot", "Longisa"],
    nearby: ["kericho", "narok", "nyamira"],
    intro:
      "Bomet is tea and highland country. Property for sale includes Bomet Town houses, Sotik plots, and farms on the Kericho–Narok belt.",
    buyingGuide:
      "Tea-zone land value tracks rainfall and access. Town houses need water and tarmac questions answered. Shortlist Bomet listings on Your Home, then visit Sotik and Bomet Town in one trip.",
    highlights: [
      "Bomet Town and Sotik homes",
      "Highland farms and tea-belt land",
      "Kericho–Narok road access",
    ],
  },
  Kericho: {
    region: "Rift Valley",
    towns: ["Kericho Town", "Litein", "Londiani", "Kipkelion"],
    nearby: ["bomet", "nandi", "nakuru"],
    intro:
      "Kericho is famous for tea estates and a cool highland town. Buyers look for Kericho Town houses, Litein, and land with reliable rain.",
    buyingGuide:
      "Estate-neighbouring land may have company or lease issues — read the title. Town plots in Kericho are competitive. Compare Kericho property for sale on Your Home before you bid.",
    highlights: [
      "Kericho Town highland homes",
      "Tea-belt land and Litein plots",
      "Cool climate and strong rainfall",
    ],
  },
  Nandi: {
    region: "Rift Valley",
    towns: ["Kapsabet", "Nandi Hills", "Mosoriot", "Lessos"],
    nearby: ["uasin-gishu", "kericho", "kakamega"],
    intro:
      "Nandi County centres on Kapsabet and Nandi Hills. Property for sale includes town houses, athlete-town rentals, and highland farms between Eldoret and Kisumu routes.",
    buyingGuide:
      "Kapsabet has rental demand. Farms need access and title. Use Your Home to see Nandi listings, then compare with Eldoret if you need a larger town.",
    highlights: [
      "Kapsabet and Nandi Hills houses",
      "Highland farms toward Eldoret",
      "Growing county headquarters",
    ],
  },
  "Elgeyo-Marakwet": {
    region: "Rift Valley",
    towns: ["Iten", "Kapsowar", "Tambach", "Chepkorio"],
    nearby: ["uasin-gishu", "baringo", "west-pokot"],
    intro:
      "Elgeyo-Marakwet is Iten and escarpment country. Buyers want highland training-town homes, Kapsowar, and land with views over the Kerio Valley.",
    buyingGuide:
      "Escarpment plots need geotechnical caution. Iten houses can double as rentals for visitors. Browse listings on Your Home and visit the exact ridge — access varies.",
    highlights: [
      "Iten highland homes",
      "Kapsowar and valley-edge land",
      "Cool climate on the escarpment",
    ],
  },
  Baringo: {
    region: "Rift Valley",
    towns: ["Kabarnet", "Eldama Ravine", "Marigat", "Mogotio"],
    nearby: ["nakuru", "elgeyo-marakwet", "laikipia"],
    intro:
      "Baringo mixes Kabarnet highlands, Eldama Ravine, and lower country around Marigat. Property for sale includes town houses and larger dryland or lakeside plots.",
    buyingGuide:
      "Highland vs lowland climate is a big split. Check security advice for remote plots. Compare Baringo listings on Your Home and inspect water sources.",
    highlights: [
      "Kabarnet and Eldama Ravine homes",
      "Land toward Marigat and Mogotio",
      "Highland and rift-floor options",
    ],
  },
  Narok: {
    region: "Rift Valley",
    towns: ["Narok Town", "Kilgoris", "Ntulele", "Suswa"],
    nearby: ["kajiado", "bomet", "nakuru"],
    intro:
      "Narok Town and the Maasai Mara approach attract buyers of town plots, highway land, and larger ranches. Demand follows the Nairobi–Narok road and tourism.",
    buyingGuide:
      "Large land needs thorough title and community-land checks. Town plots in Narok should have access and rates clarity. Your Home lists Narok property for sale — verify on the ground with an advocate who knows the county.",
    highlights: [
      "Narok Town plots and houses",
      "Highway land toward Nairobi",
      "Larger parcels with title checks",
    ],
  },
  "West Pokot": {
    region: "Rift Valley",
    towns: ["Kapenguria", "Makutano", "Ortum", "Kacheliba"],
    nearby: ["trans-nzoia", "turkana", "elgeyo-marakwet"],
    intro:
      "West Pokot’s main market is Kapenguria and Makutano. Buyers look for town houses, shops, and land along the Kitale–Lodwar corridor.",
    buyingGuide:
      "Town plots are the practical start. Remote land needs access and local guidance. See West Pokot listings on Your Home, then visit Kapenguria in person.",
    highlights: [
      "Kapenguria town houses",
      "Makutano trade plots",
      "Corridor land toward Turkana",
    ],
  },
  Turkana: {
    region: "Rift Valley",
    towns: ["Lodwar", "Kakuma", "Lokichoggio", "Kalokol"],
    nearby: ["west-pokot", "samburu", "marsabit"],
    intro:
      "Turkana’s urban property market is centred on Lodwar, with Kakuma and other towns serving specific demand. Buyers look for town plots, houses, and land tied to the county headquarters.",
    buyingGuide:
      "Services, water, and access dominate value. Work with a local advocate on title. Compare Lodwar property for sale on Your Home and plan a site visit.",
    highlights: [
      "Lodwar town plots and houses",
      "County-headquarters demand",
      "Land with verified contacts",
    ],
  },
  Samburu: {
    region: "Rift Valley",
    towns: ["Maralal", "Archers Post", "Wamba", "Baragoi"],
    nearby: ["laikipia", "isiolo", "turkana"],
    intro:
      "Samburu property for sale is led by Maralal town plots and land toward Archers Post. Buyers include residents, county workers, and people seeking larger dryland parcels.",
    buyingGuide:
      "Confirm title and access. Town plots in Maralal are easier to service than remote land. Use Your Home to find Samburu listings, then inspect with local guidance.",
    highlights: [
      "Maralal town property",
      "Land toward Archers Post",
      "Larger dryland parcels",
    ],
  },
  Isiolo: {
    region: "Eastern",
    towns: ["Isiolo Town", "Oldonyiro", "Garbatulla", "Merti"],
    nearby: ["meru", "samburu", "marsabit", "garissa"],
    intro:
      "Isiolo Town is growing with the LAPSSET and Isiolo airport story. Property for sale includes town plots, houses, and land on the Isiolo–Nanyuki and Isiolo–Marsabit roads.",
    buyingGuide:
      "Town plots near the highway and airport road attract speculation — still do a proper search. Water and access decide rural land. Shortlist Isiolo listings on Your Home before you travel.",
    highlights: [
      "Isiolo Town plots and houses",
      "Highway and airport-road land",
      "Northern Kenya gateway location",
    ],
  },
  Marsabit: {
    region: "Eastern",
    towns: ["Marsabit Town", "Moyale", "Laisamis", "North Horr"],
    nearby: ["isiolo", "samburu", "mandera"],
    intro:
      "Marsabit and Moyale are the main urban markets. Buyers look for town plots, houses, and land on the Ethiopia-road corridor.",
    buyingGuide:
      "Moyale border demand differs from Marsabit Town. Confirm title and services. Browse Marsabit property for sale on Your Home and visit the exact neighbourhood.",
    highlights: [
      "Marsabit Town and Moyale plots",
      "Corridor land toward Ethiopia",
      "Town houses with local contacts",
    ],
  },
  Garissa: {
    region: "North Eastern",
    towns: ["Garissa Town", "Dadaab", "Modogashe", "Balambala"],
    nearby: ["tana-river", "wajir", "kitui", "isiolo"],
    intro:
      "Garissa Town is the county’s property hub. Buyers search for houses, commercial rooms, and plots in and around the town.",
    buyingGuide:
      "Focus on serviced town plots. Use a local advocate. Your Home lists Garissa property for sale so you can compare asking prices in KES.",
    highlights: [
      "Garissa Town houses and plots",
      "County-headquarters demand",
      "Verified seller contacts",
    ],
  },
  Wajir: {
    region: "North Eastern",
    towns: ["Wajir Town", "Habaswein", "Griftu", "Bute"],
    nearby: ["garissa", "mandera", "isiolo"],
    intro:
      "Wajir Town leads the local property market. Listings are mostly town plots, houses, and land with access to the county headquarters.",
    buyingGuide:
      "Town services and title come first. Compare Wajir listings on Your Home and inspect with someone who knows the neighbourhoods.",
    highlights: [
      "Wajir Town plots and houses",
      "County-centre land",
      "Direct listing contacts",
    ],
  },
  Mandera: {
    region: "North Eastern",
    towns: ["Mandera Town", "Elwak", "Takaba", "Rhamu"],
    nearby: ["wajir", "marsabit"],
    intro:
      "Mandera Town and Elwak are the main centres for property for sale. Buyers look for town houses, shops, and plots near the border and county offices.",
    buyingGuide:
      "Work with a local advocate on every transfer. Town plots with access are the practical buys. See Mandera listings on Your Home, then verify on site.",
    highlights: [
      "Mandera Town and Elwak property",
      "Border and county-town demand",
      "Houses and plots with contacts",
    ],
  },
  Lamu: {
    region: "Coast",
    towns: ["Lamu Town", "Mokowe", "Hindi", "Mpeketoni"],
    nearby: ["tana-river", "kilifi", "garissa"],
    intro:
      "Lamu County covers the archipelago and mainland towns like Mokowe and Mpeketoni. Property for sale includes island houses, mainland plots, and land tied to the LAPSSET conversation.",
    buyingGuide:
      "Island vs mainland rules differ. Titles on the coast need extra care. Compare Lamu listings on Your Home and visit with a surveyor who knows the islands.",
    highlights: [
      "Lamu island and Mokowe homes",
      "Mainland plots at Mpeketoni",
      "Coastal titles with due diligence",
    ],
  },
  "Tana River": {
    region: "Coast",
    towns: ["Hola", "Garsen", "Bura", "Madogo"],
    nearby: ["kitui", "garissa", "kilifi", "lamu"],
    intro:
      "Tana River property for sale is centred on Hola, Garsen, and Bura. Buyers look for town plots, farms near the river, and land along the Garsen–Malindi and Garsen–Garissa roads.",
    buyingGuide:
      "Flood risk near the river is real — see the plot in a wet season if you can. Town plots in Hola are easier to service. Shortlist on Your Home, then confirm beacons.",
    highlights: [
      "Hola and Garsen town plots",
      "River-adjacent farms with caution",
      "Road-corridor land",
    ],
  },
  "Taita-Taveta": {
    region: "Coast",
    towns: ["Voi", "Taveta", "Wundanyi", "Mwatate"],
    nearby: ["kwale", "makueni", "kajiado"],
    intro:
      "Taita-Taveta includes Voi on the Mombasa Road, Taveta at the Tanzania border, and Taita Hills towns. Buyers search for highway plots, Voi houses, and cooler hill land.",
    buyingGuide:
      "Voi demand follows the highway and park tourism. Hill land needs access. Border plots in Taveta need extra title care. Compare Taita-Taveta property for sale on Your Home.",
    highlights: [
      "Voi highway and town homes",
      "Taita Hills land",
      "Taveta border plots",
    ],
  },
};

const TOWN_COPY: Array<{
  name: string;
  county: KenyaCounty;
  nearby: string[];
  intro: string;
  buyingGuide: string;
  highlights: [string, string, string];
}> = [
  {
    name: "Westlands",
    county: "Nairobi",
    nearby: ["kilimani", "lavington", "nairobi"],
    intro:
      "Westlands is one of Nairobi’s strongest markets for apartments and townhouses for sale. Buyers want to live near offices, malls, and the Waiyaki Way corridor, with easy access to the CBD and the Northern Bypass.",
    buyingGuide:
      "Check service charge, parking, and the age of the building. Older walk-ups and new gated courts price very differently. Compare Westlands property for sale on Your Home, then view at rush hour to test noise and access.",
    highlights: [
      "Apartments and townhouses near offices",
      "Strong resale and rental demand",
      "Waiyaki Way and bypass access",
    ],
  },
  {
    name: "Kilimani",
    county: "Nairobi",
    nearby: ["westlands", "lavington", "nairobi"],
    intro:
      "Kilimani is a high-rise and mixed-use belt between the CBD, Ngong Road, and Argwings Kodhek. Property for sale is mostly apartments, with some townhouses on quieter streets.",
    buyingGuide:
      "Ask about water backup, lifts, and management. Density is high — visit in the evening. Your Home lists Kilimani apartments for sale so you can compare price per square metre in KES.",
    highlights: [
      "Apartments close to the CBD",
      "Ngong Road and Argwings Kodhek",
      "Investor and owner-occupier stock",
    ],
  },
  {
    name: "Karen",
    county: "Nairobi",
    nearby: ["ngong", "nairobi"],
    intro:
      "Karen is Nairobi’s garden suburb — larger plots, maisonettes, and villas. Buyers pay for space, schools, and a quieter setting on the Ngong Road and Langata side of the city.",
    buyingGuide:
      "Plot size, title, and flood/drainage matter as much as the house. Some listings include staff quarters and boreholes. Compare Karen houses for sale on Your Home and walk the compound with a surveyor.",
    highlights: [
      "Villas, maisonettes, and large plots",
      "Schools and green neighbourhoods",
      "Premium Nairobi family homes",
    ],
  },
  {
    name: "Lavington",
    county: "Nairobi",
    nearby: ["kilimani", "karen", "nairobi"],
    intro:
      "Lavington sits between Kilimani and James Gichuru — leafy streets with apartments, townhouses, and a few standalone homes for sale.",
    buyingGuide:
      "Service charge and parking decide apartment value. Townhouses sell on privacy and compound size. Shortlist Lavington property for sale on Your Home, then inspect finishes in daylight.",
    highlights: [
      "Townhouses and apartments",
      "Leafy streets near James Gichuru",
      "Family-oriented Nairobi living",
    ],
  },
  {
    name: "Runda",
    county: "Nairobi",
    nearby: ["nairobi", "kiambu"],
    intro:
      "Runda is a gated, low-density market for villas and large homes. Buyers want security, plot size, and access toward Kiambu Road and the UN area.",
    buyingGuide:
      "Estate rules, plot ratios, and borehole or council water should be in writing. Compare Runda houses for sale on Your Home — photos rarely show the full compound.",
    highlights: [
      "Villas on large plots",
      "Gated estate living",
      "North Nairobi premium belt",
    ],
  },
  {
    name: "Thika",
    county: "Kiambu",
    nearby: ["ruiru", "juja", "kiambu"],
    intro:
      "Thika is a full town on the Superhighway with houses, apartments, and plots for sale. Buyers want Nairobi access without Nairobi prices.",
    buyingGuide:
      "Check the estate’s water and the Superhighway junction you will actually use. Industrial-adjacent plots need a buffer. Browse Thika property for sale on Your Home.",
    highlights: [
      "Town houses and new estates",
      "Thika Superhighway access",
      "Plots around the town",
    ],
  },
  {
    name: "Ruiru",
    county: "Kiambu",
    nearby: ["thika", "juja", "kiambu", "nairobi"],
    intro:
      "Ruiru is one of Kenya’s fastest-growing satellite towns. Property for sale includes apartments, maisonettes, and 50×100 plots with Thika Road commuting.",
    buyingGuide:
      "Developer reputation and water are the usual surprises. Visit the access road after rain. Compare Ruiru homes and plots on Your Home before you pay a reservation fee.",
    highlights: [
      "Apartments and gated courts",
      "Plots for building",
      "Nairobi commute via Thika Road",
    ],
  },
  {
    name: "Kitengela",
    county: "Kajiado",
    nearby: ["kajiado", "nairobi", "syokimau"],
    intro:
      "Kitengela is a major land and housing market south of Nairobi on Namanga Road. Buyers look for plots, maisonettes, and houses with room to grow.",
    buyingGuide:
      "Title, beacons, and the exact distance to tarmac decide price. Some schemes are far from services. Your Home lists Kitengela property for sale so you can compare several plots in one search.",
    highlights: [
      "Plots and maisonettes",
      "Namanga Road corridor",
      "Space compared with inner Nairobi",
    ],
  },
  {
    name: "Nyali",
    county: "Mombasa",
    nearby: ["mombasa", "kilifi"],
    intro:
      "Nyali is Mombasa’s premium coastal suburb for apartments and houses for sale, with beach access, malls, and the Nyali Bridge link to the island.",
    buyingGuide:
      "Check the title, service charge, and how close you are to the high-water line. Compare Nyali property for sale on Your Home, then view on a weekday and a weekend.",
    highlights: [
      "Coastal apartments and houses",
      "Beach and mall access",
      "Strong Mombasa resale demand",
    ],
  },
  {
    name: "Diani",
    county: "Kwale",
    nearby: ["kwale", "mombasa"],
    intro:
      "Diani is Kenya’s best-known south-coast strip for villas, holiday homes, and land for sale behind the beach.",
    buyingGuide:
      "Holiday-home numbers only work if the title is clean and management is real. Walk the beach access. Shortlist Diani villas on Your Home before you fly in.",
    highlights: [
      "Beach villas and holiday homes",
      "Ukunda and Diani beach belt",
      "Title-checked coastal sales",
    ],
  },
  {
    name: "Naivasha",
    county: "Nakuru",
    nearby: ["nakuru", "nairobi"],
    intro:
      "Naivasha is a lake town for weekend homes, flower-farm housing, and plots along the Nairobi–Nakuru highway.",
    buyingGuide:
      "Riparian rules and water access matter near the lake. Highway plots sell on commute time. Compare Naivasha property for sale on Your Home.",
    highlights: [
      "Lake and highway homes",
      "Weekend and rental demand",
      "Plots toward Hell’s Gate and town",
    ],
  },
  {
    name: "Eldoret",
    county: "Uasin Gishu",
    nearby: ["uasin-gishu", "nandi", "trans-nzoia"],
    intro:
      "Eldoret is the Rift’s fastest-growing town for houses, apartments, and plots for sale, with the Nairobi highway and airport supporting demand.",
    buyingGuide:
      "New estates vary in finishing. Check water, access, and school catchments. Browse Eldoret property for sale on Your Home and filter by KES budget.",
    highlights: [
      "Town houses and apartments",
      "Plots on growing corridors",
      "Highland climate and highway access",
    ],
  },
  {
    name: "Syokimau",
    county: "Machakos",
    nearby: ["machakos", "nairobi", "kitengela"],
    intro:
      "Syokimau is a high-demand apartment and maisonette market next to the SGR and Jomo Kenyatta International Airport.",
    buyingGuide:
      "Noise, parking, and water backup are the practical checks. Compare Syokimau apartments for sale on Your Home, then visit during a flight-path evening.",
    highlights: [
      "Apartments near SGR and the airport",
      "Maisonettes in gated courts",
      "Mombasa Road commuting",
    ],
  },
  {
    name: "Ngong",
    county: "Kajiado",
    nearby: ["kajiado", "karen"],
    intro:
      "Ngong sits on Nairobi’s south-west edge with cooler weather, hill views, and a mix of houses and plots for sale.",
    buyingGuide:
      "Access roads and water vary street by street. Compare Ngong property for sale on Your Home with Karen if you need more services.",
    highlights: [
      "Houses and plots with hill views",
      "Cooler than the Nairobi basin",
      "Link toward Karen and Kiserian",
    ],
  },
  {
    name: "Juja",
    county: "Kiambu",
    nearby: ["thika", "ruiru", "kiambu"],
    intro:
      "Juja sits between Ruiru and Thika, popular with families and students for houses, apartments, and plots along Thika Road.",
    buyingGuide:
      "University-area rentals differ from family estates. Check water and the exact Superhighway exit. See Juja property for sale on Your Home.",
    highlights: [
      "Family houses and student rentals",
      "Thika Road access",
      "Plots between Ruiru and Thika",
    ],
  },
];

function slugForName(name: string) {
  return slugify(name);
}

function buildCountyPlace(name: KenyaCounty): PropertyForSalePlace {
  const copy = COUNTY_COPY[name];
  const extraTowns = getCountyTowns(name);
  const towns = [...new Set([...copy.towns, ...extraTowns])].slice(0, 10);
  return {
    slug: slugForName(name),
    name,
    kind: "county",
    county: name,
    country: "Kenya",
    region: copy.region,
    towns,
    nearbySlugs: copy.nearby,
    intro: copy.intro,
    buyingGuide: copy.buyingGuide,
    highlights: copy.highlights,
  };
}

function buildTownPlace(
  town: (typeof TOWN_COPY)[number],
): PropertyForSalePlace {
  return {
    slug: slugForName(town.name),
    name: town.name,
    kind: "town",
    county: town.county,
    country: "Kenya",
    region: COUNTY_COPY[town.county].region,
    towns: [],
    nearbySlugs: town.nearby,
    intro: town.intro,
    buyingGuide: town.buyingGuide,
    highlights: town.highlights,
  };
}

const COUNTY_PLACES: PropertyForSalePlace[] =
  KENYA_COUNTIES.map(buildCountyPlace);

const TOWN_PLACES: PropertyForSalePlace[] = TOWN_COPY.map(buildTownPlace);

const KENYA_PLACES = [...COUNTY_PLACES, ...TOWN_PLACES];
const KENYA_SLUGS = new Set(KENYA_PLACES.map((place) => place.slug));

function buildAfricaCountryPlace(
  country: (typeof AFRICA_COUNTRY_MARKETS)[number],
): PropertyForSalePlace {
  return {
    slug: country.slug,
    name: country.name,
    kind: "country",
    county: country.name,
    country: country.name,
    region: country.region,
    towns: country.cities.map((city) => city.name),
    nearbySlugs: nearbyCountrySlugs(country),
    intro: countryIntro(country),
    buyingGuide: countryGuide(country),
    highlights: countryHighlights(country),
  };
}

function buildAfricaCityPlace(
  city: (typeof AFRICA_CITY_MARKETS)[number],
): PropertyForSalePlace {
  return {
    slug: city.slug,
    name: city.name,
    kind: "city",
    county: city.name,
    country: city.country,
    region: city.region,
    towns: [],
    nearbySlugs: nearbyCitySlugs(city),
    intro: cityIntro(city),
    buyingGuide: cityGuide(city),
    highlights: cityHighlights(city),
  };
}

/** Skip Kenya country hub (the /property-for-sale index already covers it). */
const AFRICA_COUNTRY_PLACES: PropertyForSalePlace[] = AFRICA_COUNTRY_MARKETS.filter(
  (country) => country.name !== "Kenya" && !KENYA_SLUGS.has(country.slug),
).map(buildAfricaCountryPlace);

const AFRICA_CITY_PLACES: PropertyForSalePlace[] = AFRICA_CITY_MARKETS.filter(
  (city) => !KENYA_SLUGS.has(city.slug),
).map(buildAfricaCityPlace);

const AFRICA_PLACES = [...AFRICA_COUNTRY_PLACES, ...AFRICA_CITY_PLACES];

const PLACES_BY_SLUG = new Map<string, PropertyForSalePlace>(
  [...KENYA_PLACES, ...AFRICA_PLACES].map((place) => [place.slug, place]),
);

for (const place of PLACES_BY_SLUG.values()) {
  place.nearbySlugs = place.nearbySlugs.filter((slug) =>
    PLACES_BY_SLUG.has(slug),
  );
}

export const PROPERTY_FOR_SALE_REGIONS = [
  "Nairobi",
  "Central",
  "Coast",
  "Rift Valley",
  "Eastern",
  "Nyanza",
  "Western",
  "North Eastern",
] as const;

export function getAllPropertyForSalePlaces(): PropertyForSalePlace[] {
  return [...KENYA_PLACES, ...AFRICA_PLACES];
}

export function getAfricaPropertyPlaces(): PropertyForSalePlace[] {
  return AFRICA_PLACES;
}

export function getAfricaCountryPlaces(): PropertyForSalePlace[] {
  return AFRICA_COUNTRY_PLACES;
}

export function getAfricaPlacesByRegion() {
  return AFRICA_REGIONS.map((region) => ({
    region,
    places: AFRICA_COUNTRY_PLACES.filter((place) => place.region === region),
  })).filter((group) => group.places.length > 0);
}

export function getPropertyForSaleCounties(): PropertyForSalePlace[] {
  return COUNTY_PLACES;
}

export function getPropertyForSalePlace(
  slug: string,
): PropertyForSalePlace | null {
  return PLACES_BY_SLUG.get(slug.toLowerCase()) ?? null;
}

export function getPlacesByRegion() {
  return PROPERTY_FOR_SALE_REGIONS.map((region) => ({
    region,
    places: COUNTY_PLACES.filter((place) => place.region === region),
  })).filter((group) => group.places.length > 0);
}

export function getNearbyPlaces(place: PropertyForSalePlace) {
  return place.nearbySlugs
    .map((slug) => PLACES_BY_SLUG.get(slug))
    .filter((item): item is PropertyForSalePlace => Boolean(item));
}

export function propertyForSalePath(slug: string) {
  return `/property-for-sale/${slug}`;
}

export function placeLocationLabel(place: PropertyForSalePlace) {
  if (place.kind === "town") return `${place.name}, ${place.county}, Kenya`;
  if (place.kind === "county") return `${place.name} County, Kenya`;
  if (place.kind === "city") return `${place.name}, ${place.country}`;
  return place.name;
}

export function placeSearchFilters(place: PropertyForSalePlace) {
  if (place.kind === "country") {
    return { country: place.country };
  }
  if (place.kind === "city") {
    return { country: place.country, town: place.name };
  }
  if (place.kind === "town") {
    return { town: place.name, county: String(place.county) };
  }
  return { county: String(place.county) };
}

export function salePlaceTitle(place: PropertyForSalePlace) {
  return `Property for Sale in ${placeLocationLabel(place)}`;
}

export function salePlaceDescription(place: PropertyForSalePlace) {
  const area = placeLocationLabel(place);
  return `Find verified houses, apartments, and land for sale in ${area}. Compare prices, view photos, and contact sellers on Your Home (yourhome.co.ke) — Africa real estate, BnB, and rentals.`;
}

export function salePlaceFaqs(place: PropertyForSalePlace) {
  const where = placeLocationLabel(place);
  return [
    {
      question: `Are there houses for sale in ${place.name}?`,
      answer: `Yes. Your Home lists verified houses, apartments, and land for sale in ${where}. New listings go live after admin review, with photos and local prices.`,
    },
    {
      question: `How do I buy property in ${place.name}?`,
      answer: `${place.buyingGuide} After you shortlist, contact the seller or agent on the listing, book a viewing, and complete a title search with your advocate before you pay.`,
    },
    {
      question: `Is land for sale in ${place.name}?`,
      answer: `Yes. Plots and land for sale in ${where} appear alongside homes. Confirm beacons, access, and the title on the ground — Your Home is the marketplace, not the seller.`,
    },
  ];
}

export function salePlaceKeywords(place: PropertyForSalePlace): string[] {
  return [
    `property for sale ${place.name}`,
    `houses for sale ${place.name}`,
    `land for sale ${place.name}`,
    `${place.name} real estate`,
    `${place.name} ${place.country} property`,
    `plots for sale ${place.name}`,
    `best real estate ${place.country}`,
    "Africa real estate",
    "yourhome.co.ke",
  ];
}
