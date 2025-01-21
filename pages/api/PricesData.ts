// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { PriceData } from "../../components/model/PrisDataModel";
import { useEffect } from 'react';
//  id: number;
//  title: string;
//  price: number;
//  description: string;

type PriceData = {
  id: number;
  title: string;
  price: number;
  description: string;
  servicesIncluded: string[];
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PriceData[]>
) {
  const prices = [
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
    }
  ];

  res.status(200).json(prices);
}

useEffect(() => {
  fetch('/api/AboutMeData')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      console.log('About Me Data:', data);
    })
    .catch((error) => {
      console.error('Error fetching About Me Data:', error);
    });
}, []);

useEffect(() => {
  fetch('/api/CardData')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Card Data:', data);
    })
    .catch((error) => {
      console.error('Error fetching Card Data:', error);
    });
}, []);

useEffect(() => {
  fetch('/api/CustomerCasesData')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Customer Cases Data:', data);
    })
    .catch((error) => {
      console.error('Error fetching Customer Cases Data:', error);
    });
}, []);

useEffect(() => {
  fetch('/api/PricesData')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Prices Data:', data);
    })
    .catch((error) => {
      console.error('Error fetching Prices Data:', error);
    });
}, []);

const videoUrl = process.env.NEXT_PUBLIC_VIDEO_URL || 'http://localhost:3000/videos/Untitled.mp4';
console.log('Video URL:', videoUrl);
