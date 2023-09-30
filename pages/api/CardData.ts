// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { ServicesData } from "../../components/model/CardDataModel";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServicesData[]>
) {
  let service: ServicesData[] = [
    new ServicesData(
      1,
      "Opsætning & optimering af Google Ads kampagner",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/Icons/placeholderIcon.svg",
      "For at kunne opnå bedre resultater med Google Ads kampagner, skal vi have de rigtige kampagner sat op. Der skal styr på keyword kampagner for search, og shopping kampagner for dynamiske produktannoncer. \n\n Når det basale setup er på plads skifter fokus til optimeringsarbejdet, hvor kampagnerne i højere grad bliver optimeret mod den enkelte kundes behov."
    ),
    new ServicesData(
      2,
      "Budgethåndtering og rapportering",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/Icons/placeholderIcon.svg",
      "For hver måned bliver vi enige om hvad det forventede månedlige budget skal være per Google Ads konto, samt det forventede resultat. Ud fra det laver vi løbende rapportering, så du er informeret hvis der sker udsving."
    ),
    new ServicesData(
      3,
      "Analyse og indsigter",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/Icons/placeholderIcon.svg",
      "Ved hjælp af data udtræk fra Google Ads, og andre Google platforme såsom Google Merchant Center, Google Search Console, kan man danne mange værdifulde indsigter, som kan være værdifulde til at danne nye strategier for hvordan det overordnede setup kan optimeres. Ikke kun for Google Ads delen, men også hvordan specifikke produkter, og eller kategorier kan optimeres."
    ),
    new ServicesData(
      4,
      "Sparring og evaluering",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/Icons/placeholderIcon.svg",
      "Et samarbejde omkring opsætning og optimering af Google Ads kampagner har typisk et ret lang tidshorisont, da det tager en del tid før man rigtig får udnyttet det potentiale der ligger i samarbejdet. Derfor er løbende sparing og evaluering en fast del af vores samarbejde med kunder, for at holde øje med at vi er på vej i den rigtige retning."
    ),
  ];

  res.status(200).json(service);
}
