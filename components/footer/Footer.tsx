import React from "react";
import Image from "next/image";
import VeVeVeLogo from "../../public/images/logo.svg";
import Style from "./controller/Footer.module.css";
import FooterInfo from "./controller/FooterInfo";
import FooterSome from "./controller/FooterSome";

export default function Footer() {
  return (
    <div id="contact" className={Style.Footer}>
      <div className={Style.Logo}>
        <Image src={VeVeVeLogo} alt="Logo of VeVeVe" />
      </div>
      <div className={Style.Info}>
        <FooterInfo />
        <FooterSome />
      </div>
    </div>
  );
}
