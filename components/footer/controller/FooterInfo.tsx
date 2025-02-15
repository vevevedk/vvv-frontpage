import Style from "./Footer.module.css";
import { ContactInfo } from "../../model/FooterModel";

const contactInfo: ContactInfo = {
  location: "Heibergsgade 1h, St",
  zip: "8000 Aarhus C",
  phone: "+45 61 66 39 30",
  email: "hello@veveve.dk"
};

const FooterInfo: React.FC = () => {
  return (
    <address className={Style.FooterInfo}>
      <div>
        <h3>{contactInfo.location}</h3>
        <h3>{contactInfo.zip}</h3>
        <h3>
          <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}>
            {contactInfo.phone}
          </a>
        </h3>
        <h3>
          <a href={`mailto:${contactInfo.email}`}>
            {contactInfo.email}
          </a>
        </h3>
      </div>
    </address>
  );
};

export default FooterInfo;