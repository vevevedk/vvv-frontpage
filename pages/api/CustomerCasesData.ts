// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { CustomerCasesData } from "../../components/model/CustomerCasesModel";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomerCasesData[]>
) {
  let CustomerCases: CustomerCasesData[] = [
    new CustomerCasesData(
      1,
      "tintin butikken",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/CustomerCases/tintin.jpg",
      ["SEO 325%", "Profit 2403238%", "fdsfs", "grtrreds"]
    ),
    new CustomerCasesData(
      2,
      "test2",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/CustomerCases/tintin.jpg",
      ["SEO 325%", "Profit 240%", "fdsfs", "grtrresdkpwoeruwpds"]
    ),
    new CustomerCasesData(
      3,
      "test3",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/CustomerCases/tintin.jpg",
      ["SEO 325%", "Profit 240%", "fdsfs", "grtrreds"]
    ),
    new CustomerCasesData(
      4,
      "test4",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/CustomerCases/tintin.jpg",
      ["SEO 325%", "Profit 240%", "fdsfs", "grtrreds"]
    ),
    new CustomerCasesData(
      5,
      "test5",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/CustomerCases/tintin.jpg",
      ["SEO 325%", "Profit 240%"]
    ),
    new CustomerCasesData(
      6,
      "test6",
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/CustomerCases/tintin.jpg",
      ["SEO 325%", "Profit 240%", "fdsfs", "grtrreds"]
    ),
  ];

  res.status(200).json(CustomerCases);
}
