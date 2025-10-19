import type { NextApiRequest, NextApiResponse } from "next";
import { ServicesData } from "@/components/model/CardDataModel";

const servicesData: ServicesData[] = [
  {
    id: 1,
    title: "Web Development",
    url: "/services/web-development",
    description: "Custom web solutions tailored to your business needs.",
    extra: "Responsive design, modern frameworks"
  },
  {
    id: 2,
    title: "Mobile App Development",
    url: "/services/mobile-apps",
    description: "Innovative mobile applications for iOS and Android.",
    extra: "Native and cross-platform development"
  },
  {
    id: 3,
    title: "Cloud Solutions",
    url: "/services/cloud",
    description: "Scalable cloud infrastructure and migration services.",
    extra: "AWS, Azure, Google Cloud expertise"
  }
  // Add more services as needed
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServicesData[]>
) {
  res.status(200).json(servicesData);
}