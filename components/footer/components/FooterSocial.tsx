import React from 'react';
import styles from "../styles/Footer.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faLinkedin,
  faTwitter,
  faFacebook,
  faInstagram 
} from "@fortawesome/free-brands-svg-icons";

const FooterSocial = () => {
  return (
    <div className={styles.social_links}>
      <h3 className={styles.social_title}>Find os på</h3>
      <div className={styles.social_container}>
        <a href="https://www.linkedin.com/company/vevevedk" target="_blank" rel="noopener noreferrer" className={styles.social_link}>
          <FontAwesomeIcon icon={faLinkedin} className={styles.social_icon} />
          LinkedIn
        </a>
        <a href="https://www.x.com/vevevedk" target="_blank" rel="noopener noreferrer" className={styles.social_link}>
          <FontAwesomeIcon icon={faTwitter} className={styles.social_icon} />
          X
        </a>
        <a href="https://www.facebook.com/vevevedk" target="_blank" rel="noopener noreferrer" className={styles.social_link}>
          <FontAwesomeIcon icon={faFacebook} className={styles.social_icon} />
          Facebook
        </a>
        <a href="https://www.instagram.com/vevevedk" target="_blank" rel="noopener noreferrer" className={styles.social_link}>
          <FontAwesomeIcon icon={faInstagram} className={styles.social_icon} />
          Instagram
        </a>
      </div>
    </div>
  );
};

export default FooterSocial; 