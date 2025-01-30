// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { AboutMeData } from "../../components/model/AboutMeModel";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AboutMeData[]>
) {
  try {
    const aboutData: AboutMeData[] = [
      {
        id: 0,
        breadtext: [
          " Vi er specialister i markedsføring og digital kommunikation med +12 års erfaring. Vi har erfaring fra en lang række virksomheder inden for e-handel, rejsebranchen og serviceerhverv. Gennem mange års erfaring har vi opbygget et bredt fundament, som gør, at vi ud fra specialistarbejdet kan tilbyde vores kunder kompetent vejledning om, hvor i processen de befinder sig i forhold til deres mål.",
        ],
        img: "/images/about/team-1.jpg"
      }
      /*
      {
        id: 1,
        breadtext: [
          "With years of experience...",
          "Our approach combines..."
        ],
        img: "/images/about/team-2.jpg"
      }
      */
    ];

    res.status(200).json(aboutData);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json([]);
  }
}
