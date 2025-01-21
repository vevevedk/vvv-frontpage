import styles from "../styles/Footer.module.css";
import { SocialMedia } from "../../model/FooterModel";

const socialLinks: SocialMedia[] = [
  {
    id: 1,
    url: "https://www.linkedin.com/company/veveve",
    name: "LinkedIn",
    icon: "/images/social/linkedin.svg"
  },
  {
    id: 2,
    url: "https://www.instagram.com/veveve.dk",
    name: "Instagram",
    icon: "/images/social/instagram.svg"
  }
];

const FooterSocial: React.FC = () => {
  return (
    <div className={styles.social_links}>
      <h3 className={styles.social_title}>Find os på</h3>
      <div className={styles.social_container}>
        {socialLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.social_link}
            aria-label={`Visit our ${link.name} page`}
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default FooterSocial; 