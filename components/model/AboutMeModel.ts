export class AboutMeData {
  id: number;
  img: string;
  breadtext: string[];

  constructor(id: number, img: string, breadtext: string[]) {
    this.id = id;
    this.img = img;
    this.breadtext = breadtext;
  }
}
