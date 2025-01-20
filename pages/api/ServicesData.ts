import type { NextApiRequest, NextApiResponse } from 'next';
import { ServicesData } from '../../components/model/ServicesModel';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServicesData[]>
) {
  const services: ServicesData[] = [
    new ServicesData(
      0,
      "Web Development",
      "Modern and responsive web development using the latest technologies. We create fast, secure, and scalable web applications tailored to your needs."
    ),
    new ServicesData(
      1,
      "Digital Marketing",
      "Strategic digital marketing solutions to boost your online presence. SEO optimization, social media management, and content marketing strategies."
    ),
    new ServicesData(
      2,
      "UI/UX Design",
      "User-centered design solutions that create engaging and intuitive experiences. We focus on creating interfaces that users love to interact with."
    )
  ];

  res.status(200).json(services);
} 