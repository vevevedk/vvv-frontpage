// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { PriceData } from "../../components/model/PrisDataModel";
//  id: number;
//  title: string;
//  price: number;
//  description: string;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PriceData[]>
) {
  let price: PriceData[] = [
    new PriceData(1, "Lille pakke", 1050, [
      "1x 30 minutters møde pr. måned",
      "750 kr i drift pr. konto",
    ]),
    new PriceData(2, "Mellem pakke", 1350, [
      "2x 30 minutters møde pr. måned",
      "950 kr i drift pr. konto",
    ]),
    new PriceData(3, "Stor pakke", 1950, [
      "Fast ugentlig møde",
      "950 kr i drift pr. konto",
    ]),
  ];

  res.status(200).json(price);
}
