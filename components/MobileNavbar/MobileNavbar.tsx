import React, { useState } from "react";
import styles from "../../styles/navbar.module.css";
import { LinkingModel } from "../model/LinkModel";

interface Props {
  links: LinkingModel[];
}

const MobileNavbar: React.FC<Props> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || '/icons/fallback-logo.svg';

  console.log("MobileNavbar rendered");
  console.log("isOpen state:", isOpen);
  console.log("logoUrl:", logoUrl);
  console.log("links:", links);

  const toggleMenu = () => {
    console.log("Toggling menu...");
    setIsOpen(!isOpen);
  };

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
          onClick={toggleMenu}
        >
          <svg 
            stroke="currentColor" 
            fill="currentColor" 
            strokeWidth="0" 
            viewBox="0 0 448 512" 
            height="24px"
            width="24px"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" />
            ) : (
              <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z" />
            )}
          </svg>
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