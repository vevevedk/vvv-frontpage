export class ServicesData {
  id: number;
  title: string;
  url: string;
  description: string;
  extra?: string;
  constructor(
    id: number,
    title: string,
    url: string,
    description: string,
    extra?: string
  ) {
    this.id = id;
    this.title = title;
    this.url = url;
    this.description = description;
    this.extra = extra;
  }
}
