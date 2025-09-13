import type { NextApiRequest, NextApiResponse } from 'next';
import { ServicesData } from '../../../components/model/ServicesModel';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServicesData[]>
) {
  const services: ServicesData[] = [
    new ServicesData(
      0,
      "Search Engine Marketing (SEM)",
      "Markedsføring på søgemaskiner. Optimering af Google Ads kampagner, Google My Business og Google Search Console"
    ),
    new ServicesData(
      1,
      "Social Media Marketing ( SMM )",
      "Markedsføring på sociale medier. Facebook, Instagram, LinkedIn, TikTok og andre sociale platforme."
    ),
    new ServicesData(
      2,
      "Analyse & rappoerting",
      "Analyse af markedsføring og kampagner. Rappoerting af kampagner og resultater."
    )
  ];

  res.status(200).json(services);
} 