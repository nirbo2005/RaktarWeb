// raktar-frontend/src/types/Batch.ts
import { type Product } from "./Product";

export type Batch = {
  id: number;
  productId: number;
  product?: Product;
  parcella: string; 
  mennyiseg: number;
  lejarat: string | Date | null;
  bekerules: string | Date;
};

/**
 * Egy adott polc (parcella) statisztikai adatai a térképhez
 */
export type ShelfInfo = {
  weight: number;
  count: number;
  category?: string;
};

/**
 * A teljes raktártérkép struktúrája
 */
export type WarehouseMapData = {
  maxWeight: number;
  shelves: Record<string, ShelfInfo>;
};

/**
 * Automatikus helykereső válaszstruktúrája
 */
export type BestSpaceResponse = {
  parcella: string;
  availableKg: number;
};