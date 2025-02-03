import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface SocialMedia {
  id: number;
  url: string;
  name: string;
  icon: IconDefinition;
}

export interface ContactInfo {
  location: string;
  zip: string;
  phone: string;
  email: string;
}
