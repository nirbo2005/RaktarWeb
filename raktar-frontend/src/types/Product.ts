//raktar-frontend/src/types/Product.ts
import { type Batch } from "./Batch";

export type ProductCategory =
  | "ELEKTRONIKA"
  | "ELELMISZER"
  | "VEGYSZER"
  | "IRODASZER"
  | "AUTO_MOTOR"
  | "RUHAZAT"
  | "BARKACS"
  | "SPORT"
  | "JATEK"
  | "HAZTARTAS"
  | "KOZMETIKA"
  | "KONYVEK"
  | "BUTOR"
  | "EGESZSEGUGY"
  | "EGYEB";

export type Product = {
  id: number;
  nev: string;
  gyarto: string;
  kategoria: ProductCategory;
  beszerzesiAr: number;
  eladasiAr: number;
  suly: number;
  minimumKeszlet: number;
  isDeleted: boolean;
  batches?: Batch[];
};
