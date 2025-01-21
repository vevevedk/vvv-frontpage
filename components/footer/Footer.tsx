import React from "react";
import Image from "next/image";
import VeVeVeLogo from "../../public/images/logo.svg";
import styles from "./styles/Footer.module.css";
import FooterInfo from "./components/FooterInfo";
import FooterSocial from "./components/FooterSocial";

export default function Footer() {
  return (
    <footer id="contact" className={styles.footer}>
      <div className={styles.footer_content}>
        <div className={styles.logo_wrapper}>
          <Image 
            src={VeVeVeLogo} 
            alt="VeVeVe Logo" 
            width={200}
            height={50}
            priority
          />
        </div>
        <div className={styles.info_container}>
          <FooterInfo />
          <FooterSocial />
        </div>
      </div>
    </footer>
  );
}
