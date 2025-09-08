import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faLinkedin,
  faTwitter,
  faFacebook,
  faInstagram 
} from "@fortawesome/free-brands-svg-icons";

const FooterSocial = () => {
  return (
    <div className="flex flex-col items-center gap-4 md:items-start">
      <h3 className="text-lg font-medium text-white m-0">Find os på</h3>
      <div className="flex gap-6">
        <a 
          href="https://www.linkedin.com/company/vevevedk" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-white hover:text-accent transition-colors duration-300"
        >
          <FontAwesomeIcon icon={faLinkedin} className="text-2xl" />
          LinkedIn
        </a>
        <a 
          href="https://www.x.com/vevevedk" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-white hover:text-accent transition-colors duration-300"
        >
          <FontAwesomeIcon icon={faTwitter} className="text-2xl" />
          X
        </a>
        <a 
          href="https://www.facebook.com/vevevedk" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-white hover:text-accent transition-colors duration-300"
        >
          <FontAwesomeIcon icon={faFacebook} className="text-2xl" />
          Facebook
        </a>
        <a 
          href="https://www.instagram.com/vevevedk" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-white hover:text-accent transition-colors duration-300"
        >
          <FontAwesomeIcon icon={faInstagram} className="text-2xl" />
          Instagram
        </a>
      </div>
    </div>
  );
};

export default FooterSocial; 