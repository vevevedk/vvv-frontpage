import Style from "./Footer.module.css";
import { ContactDetails } from "../../model/FooterModel";
let contactDetails: ContactDetails = new ContactDetails(
  "Heibergsgade 1h, St",
  "8000 Aarhus C",
  "+45 61 66 39 30",
  "hello@veveve.dk"
);

const FooterInfo: React.FC = () => {
  return (
    <address className={Style.FooterInfo}>
      <div key={contactDetails.phone}>
        <h3>{contactDetails.location} </h3>
        <h3>{contactDetails.zip}</h3>
        <h3>
          <a href={"tel:+45" + contactDetails.phone}>{contactDetails.phone}</a>
        </h3>
        <h3>
          <a href={"mailto:" + contactDetails.email}>{contactDetails.email}</a>
        </h3>
      </div>
    </address>
  );
};

export default FooterInfo;
