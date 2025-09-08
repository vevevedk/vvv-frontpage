import { ContactInfo } from "../../model/FooterModel";

const contactInfo: ContactInfo = {
  location: "Heibergsgade 1h, St",
  zip: "8000 Aarhus C",
  phone: "+45 61 66 39 30",
  email: "hello@veveve.dk"
};

const FooterInfo: React.FC = () => {
  return (
    <address className="flex flex-col items-center gap-4 md:items-start font-normal">
      <div className="flex flex-col items-center gap-2 md:items-start">
        <p className="text-white">{contactInfo.location}</p>
        <p className="text-white">{contactInfo.zip}</p>
      </div>
      <div className="flex flex-col items-center gap-2 md:items-start">
        <a 
          href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} 
          className="text-white hover:text-accent transition-colors duration-300"
        >
          {contactInfo.phone}
        </a>
        <a 
          href={`mailto:${contactInfo.email}`} 
          className="text-white hover:text-accent transition-colors duration-300"
        >
          {contactInfo.email}
        </a>
      </div>
    </address>
  );
};

export default FooterInfo; 