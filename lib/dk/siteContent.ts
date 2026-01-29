export type DkService = {
  slug: string;
  title: string;
  summary: string;
  intro: string;
  bullets: string[];
};

export type DkCase = {
  title: string;
  industry: string;
  result: string;
  summary: string;
  whatWeDid: string[];
};

export type DkPackage = {
  name: string;
  forWho: string;
  priceNote: string;
  includes: string[];
};

export const DK_EMAIL = "hello@veveve.dk";

export const DK_PHONE_DISPLAY = process.env.NEXT_PUBLIC_DK_PHONE || "";
export const DK_PHONE_TEL = DK_PHONE_DISPLAY
  ? `tel:${DK_PHONE_DISPLAY.replace(/\s+/g, "")}`
  : "";

export const DK_SERVICES: DkService[] = [
  {
    slug: "google-ads",
    title: "Google Ads",
    summary: "Struktur, budstrategi og optimering med fokus på profit.",
    intro:
      "Vi optimerer struktur, budstrategi og søgeord med fokus på profit og forudsigelighed — ikke bare klik.",
    bullets: [
      "Account audit + quick wins",
      "Struktur og mål (leads/salg)",
      "Løbende optimering + enkel rapportering",
    ],
  },
  {
    slug: "meta-ads",
    title: "Meta Ads",
    summary: "Kreativer, audiences og skalering — uden at miste overblikket.",
    intro:
      "Vi bygger en enkel funnel med gode kreativer og et setup, der kan skaleres uden at brænde budgettet af.",
    bullets: ["Kreativ retning + tests", "Audience/retargeting", "Budgetstyring + ugeplan"],
  },
  {
    slug: "tracking-ga4-gtm",
    title: "Tracking (GA4/GTM)",
    summary: "Pålidelige data, events og dashboards til bedre beslutninger.",
    intro:
      "Pålidelige events og konverteringer er fundamentet. Vi gør det nemt at stole på dine tal (og handle på dem).",
    bullets: ["GTM/GA4 opsætning", "Events + konverteringer", "Dashboards + datakvalitet"],
  },
  {
    slug: "cro",
    title: "CRO (konverteringsoptimering)",
    summary: "Små ændringer med stor effekt: landingssider, tilbud og friktion.",
    intro: "Vi finder friktion og forbedrer landingssider/tilbud, så dit annoncebudget giver mere tilbage.",
    bullets: ["Landing page review", "Pragmatisk testplan", "Copy + UX tweaks"],
  },
];

export const DK_CASES: DkCase[] = [
  {
    title: "E-commerce (anonymiseret)",
    industry: "E-commerce",
    result: "+35% omsætning på samme spend",
    summary: "Bedre kampagnestruktur og datagrundlag gav mere effekt pr. krone.",
    whatWeDid: ["Audit + quick wins", "Kampagnestruktur", "Feed/produktfokus", "Ugentlig optimering"],
  },
  {
    title: "Lokal service (anonymiseret)",
    industry: "Services",
    result: "-28% CPA på 6 uger",
    summary: "Tracking fix + mere præcise budskaber og landingssider sænkede omkostningen pr. lead.",
    whatWeDid: ["GA4/GTM events", "Search struktur", "Landingsside friktion", "Rapportering"],
  },
  {
    title: "B2B niche (anonymiseret)",
    industry: "B2B",
    result: "+2,1x flere kvalificerede leads",
    summary: "Meta testplan + retargeting gav bedre leadkvalitet og tydeligere næste skridt.",
    whatWeDid: ["Kreativ testplan", "Retargeting", "Leadflow/form", "Budgetstyring"],
  },
];

export const DK_PACKAGES: DkPackage[] = [
  {
    name: "Starter",
    forWho: "Til dig der vil i gang hurtigt og have styr på fundamentet.",
    priceNote: "Pris afhænger af scope og spend.",
    includes: ["Audit + 30-dages plan", "Opsætning/struktur", "Ugentlig optimering", "Kort statusrapport"],
  },
  {
    name: "Vækst",
    forWho: "Til dig der vil skalere med faste tests og tydelig prioritering.",
    priceNote: "Pris afhænger af scope og spend.",
    includes: ["Alt i Starter", "Testplan (kreativer/ads)", "Tracking + dashboards", "Månedlig review"],
  },
  {
    name: "Scale",
    forWho: "Til dig med større budget og behov for tæt sparring.",
    priceNote: "Kontakt os for et oplæg.",
    includes: ["Alt i Vækst", "Tættere cadence", "Tværkanal prioritering", "CRO/landing page fokus"],
  },
];

