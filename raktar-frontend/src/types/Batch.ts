import { type Product } from "./Product";

export type Batch = {
  id: number;
  productId: number;
  product?: Product;
  parcella: string; // A-D szektor, 1-5 sor, 1-4 oszlop (pl. A1-1)
  mennyiseg: number;
  lejarat: string | Date | null;
  bekerules: string | Date;
};