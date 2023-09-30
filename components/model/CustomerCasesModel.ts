export class CustomerCasesData {
  id: number;
  title: string;
  img: string;
  stats: string[];

  constructor(id: number, title: string, img: string, stats: string[]) {
    this.id = id;
    this.title = title;
    this.img = img;
    this.stats = stats;
  }
}
