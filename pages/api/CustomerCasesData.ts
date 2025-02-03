import type { NextApiRequest, NextApiResponse } from "next";
import { CustomerCasesData } from "../../components/model/CustomerCasesModel";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomerCasesData[]>
) {
  const cases: CustomerCasesData[] = [
    {
      id: 1,
      title: "Wo clé",
      img: "/images/cases/wocle.svg",
      stats: ["Fra 0 til 20 t. kr. månedlig omsætning", "ROAS 8 opnået indenfor 6 mdr."]
    },
    {
      id: 2,
      title: "Crossfit Lageret Holstebro",
      img: "/images/cases/crossfit-lageret.jpg",
      stats: ["50% reduktion i Ad Spend på Google", "Top placering på vigtigste søgninger på Google"]
    },
    {
      id: 3,
      title: "Porsaco",
      img: "/images/cases/porsa.png",
      stats: ["Opsætning af konverteringssporing i Google Analytics", "Robust kampagnestruktur på Google Search Ads"]
    }
  ];

  res.status(200).json(cases);
}