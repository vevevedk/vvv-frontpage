import React from "react";
import styles from "../../styles/navbar.module.css";
import { LinkingModel } from "../model/LinkModel";
import MobileNavbar from "../MobileNavbar/MobileNavbar";

interface Props {
  links: LinkingModel[];
}

const Nav: React.FC<Props> = ({ links }) => {
  return (
    <>
      <div className={styles.desktopNav}>
        <nav className={styles.nav}>
          <div className={styles.navFlex}>
            <img
              src={process.env.NEXT_PUBLIC_LOGO_URL || '/icons/fallback-logo.svg'}
              alt="Logo"
              className={styles.logo}
            />
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
        <MobileNavbar links={links} />
      </div>
    </>
  );
};

export default Nav;