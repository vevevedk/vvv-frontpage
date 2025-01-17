import React, { useState } from "react";
import styles from "../../styles/navbar.module.css";
import { LinkingModel } from "../model/LinkModel";

interface Props {
  links: LinkingModel[];
}

const MobileNavbar: React.FC<Props> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || '/icons/fallback-logo.svg';

  return (
    <nav className={styles.nav}>
      <div className={styles.navFlex}>
        <img
          src={logoUrl}
          alt="Logo"
          className={styles.logo}
        />
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>
        <ul className={`${styles.links} ${isOpen ? styles.open : ""}`}>
          {links.map((link) => (
            <li key={link.name + link.id} className={styles.listWrapper}>
              <a href={link.idtojump} className={styles.link}>
                <h3 className={styles.LinkName}>{link.name}</h3>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default MobileNavbar;