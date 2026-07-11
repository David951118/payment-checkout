export interface ProductProps {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrl: string;
}

export class Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priceInCents: number;
  private _stock: number;
  readonly imageUrl: string;

  constructor(props: ProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.priceInCents = props.priceInCents;
    this._stock = props.stock;
    this.imageUrl = props.imageUrl;
  }

  get stock(): number {
    return this._stock;
  }

  hasStock(quantity: number): boolean {
    return quantity > 0 && this._stock >= quantity;
  }

  totalPriceInCents(quantity: number): number {
    return this.priceInCents * quantity;
  }
}
