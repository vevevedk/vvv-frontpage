import type { NextApiRequest, NextApiResponse } from "next";
import { PriceData } from "../../components/model/PrisDataModel";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PriceData[]>
) {
  const prices: PriceData[] = [
    {
      id: 1,
      title: "Basic Package",
      price: 4999,
      description: "Perfect for small businesses",
      servicesIncluded: [
        "Website Design",
        "Mobile Responsive",
        "3 Pages",
        "Basic SEO",
        "Contact Form"
      ]
    },
    {
      id: 2,
      title: "Professional",
      price: 9999,
      description: "Ideal for growing companies",
      servicesIncluded: [
        "Everything in Basic",
        "Custom Design",
        "10 Pages",
        "Advanced SEO",
        "Analytics Integration",
        "Social Media Integration"
      ]
    },
    {
      id: 3,
      title: "Enterprise",
      price: 19999,
      description: "For large organizations",
      servicesIncluded: [
        "Everything in Professional",
        "E-commerce Integration",
        "Unlimited Pages",
        "Priority Support",
        "Monthly Maintenance",
        "Performance Optimization"
      ]
    }
  ];

  res.status(200).json(prices);
} 