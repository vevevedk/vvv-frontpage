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
      img: "/images/cases/ecommerce.jpg",
      stats: ["500% Revenue Growth", "1M+ Monthly Users"]
    },
    {
      id: 2,
      title: "Crossfit Lageret Holstebro",
      img: "/images/cases/saas.jpg",
      stats: ["98% Customer Satisfaction", "50% Reduced Load Time"]
    },
    {
      id: 3,
      title: "Porsaco",
      img: "/images/cases/mobile.jpg",
      stats: ["4.8 App Store Rating", "200K+ Downloads"]
    }
  ];

  res.status(200).json(cases);
}