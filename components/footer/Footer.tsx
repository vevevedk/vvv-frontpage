import React from "react";
import Image from "next/image";
import VeVeVeLogo from "../../public/images/logo.svg";
import FooterInfo from "./components/FooterInfo";
import FooterSocial from "./components/FooterSocial";

export default function Footer() {
  return (
    <footer id="contact" className="w-full bg-dark-grey py-12 px-4 md:py-16 md:px-8">
      <div className="max-w-wrapper mx-auto flex flex-col items-center gap-8">
        <div className="w-48 h-12 md:w-60 md:h-14 relative">
          <Image 
            src={VeVeVeLogo} 
            alt="VeVeVe Logo" 
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col items-center gap-8 w-full md:flex-row md:justify-around md:items-start">
          <FooterInfo />
          <FooterSocial />
        </div>
      </div>
    </footer>
  );
}
