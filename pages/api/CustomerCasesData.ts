import type { NextApiRequest, NextApiResponse } from "next";
import { CustomerCasesData } from "../../components/model/CustomerCasesModel";

const customerCasesData: CustomerCasesData[] = [
  {
    id: 1,
    title: "Case Title",
    img: "/path/to/image",
    stats: ["Stat 1", "Stat 2"]
  },
  // ... more cases
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomerCasesData[]>
) {
  // Explicitly return an array
  res.status(200).json(customerCasesData);
}