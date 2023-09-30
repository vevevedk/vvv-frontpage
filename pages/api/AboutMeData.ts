// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { AboutMeData } from "../../components/model/AboutMeModel";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AboutMeData[]>
) {
  let AboutMe: AboutMeData[] = [
    new AboutMeData(
      1,
      "https://veveve-bucket-2.fra1.digitaloceanspaces.com/AboutMe/Sirius_Black_profile.webp",
      [
        "This is a test if there is a bit more text in the test areas. Lets see how all this will effect the page and stuff. I really hope it doesnt frick anything up but here it goes!",
        "This is a test if there is a bit more text in the test areas. Lets see how all this will effect the page and stuff. I really hope it doesnt frick anything up but here it goes!",
        "This is a test if there is a bit more text in the test areas. Lets see how all this will effect the page and stuff. I really hope it doesnt frick anything up but here it goes!",
        "This is a test if there is a bit more text in the test areas. Lets see how all this will effect the page and stuff. I really hope it doesnt frick anything up but here it goes!",
        "part5",
      ]
    ),
  ];

  res.status(200).json(AboutMe);
}
