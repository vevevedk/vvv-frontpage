import type { NextApiRequest, NextApiResponse } from "next";
import { PriceData } from "@/components/model/PrisDataModel";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PriceData[]>
) {
  const prices: PriceData[] = [
    {
      id: 1,
      title: "PPC / Paid Social Specialist",
      price: 750,
      description: "Fleksibel månedlig betaling",
      servicesIncluded: [
        "Opsæting og optimering af kampagner",
        "Bud og Budget management",
        "Optimering af målretning",
        "Analyse og rapportering",
      ]
    },
    {
      id: 2,
      title: "Digital Marketing Strategi",
      price: 1050,
      description: "Når du har brug for sparring og rådgivning",
      servicesIncluded: [
        "Evaluering af KPIer",
        "Forecasting af KPIer og budgetter",
        "Evaluering af Marketings Mix",
      ]
    },
    {
      id: 3,
      title: "En del af holdet",
      price: 19999,
      description: "For virksomheder der vil in-house",
      servicesIncluded: [
        "Vi kommer med de kompetencer I mangler",
        "Vi hjælper med rekruttering og ledelse",
        "Vi agere som mentorer og sparer med jeres medarbejdere"
      ]
    }
  ];

  res.status(200).json(prices);
} 