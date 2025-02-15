import Style from "./Footer.module.css";
import { ContactInfo } from "../../model/FooterModel";

const contactInfo: ContactInfo = {
  location: "Heibergsgade 1h, St",
  zip: "8000 Aarhus C",
  phone: "+45 61 66 39 30",
  email: "andreas@veveve.dk"
};

const FooterInfo = () => {
  return (
    <div className={Style.footerInfo}>
      <div>
        <p>{contactInfo.location}</p>
        <p>{contactInfo.zip}</p>
      </div>
      <div>
        <p>{contactInfo.phone}</p>
        <p>{contactInfo.email}</p>
      </div>
    </div>
  );
};

export default FooterInfo;