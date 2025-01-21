import styles from "../styles/Footer.module.css";
import { ContactInfo } from "../../model/FooterModel";

const contactInfo: ContactInfo = {
  location: "Heibergsgade 1h, St",
  zip: "8000 Aarhus C",
  phone: "+45 61 66 39 30",
  email: "hello@veveve.dk"
};

const FooterInfo: React.FC = () => {
  return (
    <address className={styles.contact_info}>
      <div className={styles.address_block}>
        <p>{contactInfo.location}</p>
        <p>{contactInfo.zip}</p>
      </div>
      <div className={styles.contact_block}>
        <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className={styles.contact_link}>
          {contactInfo.phone}
        </a>
        <a href={`mailto:${contactInfo.email}`} className={styles.contact_link}>
          {contactInfo.email}
        </a>
      </div>
    </address>
  );
};

export default FooterInfo; 