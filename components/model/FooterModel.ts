export class SoMe {
  id: number;
  url: string;
  name: string;

  constructor(id: number, url: string, name: string) {
    this.id = id;
    this.url = url;
    this.name = name;
  }
}

export class ContactDetails {
  location: string;
  zip: string;
  phone: string;
  email: string;
  constructor(location: string, zip: string, phone: string, email: string) {
    this.location = location;
    this.zip = zip;
    this.phone = phone;
    this.email = email;
  }
}
