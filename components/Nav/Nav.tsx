import React, { useState } from "react";
import styles from "../../styles/navbar.module.css";
import { LinkingModel } from "../model/LinkModel";

interface Props {
  links: LinkingModel[];
}

const MobileNav: React.FC<Props> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <nav className={styles.nav}>
      <div className={styles.navFlex}>
        {" "}
        <img
          src="https://veveve-bucket-2.fra1.digitaloceanspaces.com/Icons/logo.svg"
          alt="Logo"
          className={styles.logo}
        />
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "☰" : "✖"}
        </button>
        <ul className={`${styles.links} ${isOpen ? styles.open : ""}`}>
          {links.map((link, index) => (
            <div key={link.name + link.id} className={styles.listWrapper}>
              <li
                className={
                  index === links.length - 1 ? styles.lastLink : "link"
                }
              >
                <a href={link.idtojump} className={styles.link}>
                  <h3 className={styles.LinkName}>{link.name}</h3>
                </a>
              </li>
            </div>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default MobileNav;
