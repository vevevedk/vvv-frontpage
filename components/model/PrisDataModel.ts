export class PriceData {
  id: number;
  title: string;
  price: number;
  servicesIncluded: string[];

  constructor(
    id: number,
    title: string,
    price: number,
    servicesIncluded: string[]
  ) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.servicesIncluded = servicesIncluded;
  }
}
