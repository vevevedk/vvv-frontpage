import React, { useState } from "react";
import styles from "../../styles/navbar.module.css";
import { LinkingModel } from "../model/LinkModel";
import { FaBars, FaTimes } from 'react-icons/fa';

interface Props {
  links: LinkingModel[];
}

const Nav: React.FC<Props> = ({ links }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <div className={styles.navContainer}>
        <nav className={styles.nav}>
          <div className={styles.navFlex}>
            <a href="/" className={styles.logo}>
              <img
                src={process.env.NEXT_PUBLIC_LOGO_URL || '/icons/fallback-logo.svg'}
                alt="Logo"
              />
            </a>
            <ul className={styles.links}>
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
      </div>
      <div className={styles.mobileNav}>
        <nav className={styles.nav}>
          <div className={styles.navFlex}>
            <a href="/" className={styles.logo}>
              <img
                src={process.env.NEXT_PUBLIC_LOGO_URL || '/icons/fallback-logo.svg'}
                alt="Logo"
              />
            </a>
            <div className={styles.listWrapper}>
              <ul className={`${styles.links} ${isMenuOpen ? styles.open : ''}`}>
                {links.map((link) => (
                  <li key={link.name + link.id} className={styles.listWrapper}>
                    <a href={link.idtojump} className={styles.link}>
                      <h3 className={styles.LinkName}>{link.name}</h3>
                    </a>
                  </li>
                ))}
              </ul>
              <button className={styles.menuButton} onClick={toggleMenu}>
                {isMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Nav;