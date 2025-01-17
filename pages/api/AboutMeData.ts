// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { AboutMeData } from "../../components/model/AboutMeModel";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ data: 'About Me Data' });
}
