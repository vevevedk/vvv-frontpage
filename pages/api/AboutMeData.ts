// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { AboutMeData } from "../../components/model/AboutMeModel";

// Define the data
const aboutMeData: AboutMeData[] = [
  {
    id: 1,
    breadtext: ["We are a team of professionals...", "Our mission is to..."],
    img: "/images/team1.jpg",
  },
  {
    id: 2,
    breadtext: ["Our values include...", "We strive to..."],
    img: "/images/team2.jpg",
  },
  // Add more data as needed
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AboutMeData[]>
) {
  res.status(200).json(aboutMeData);
}
