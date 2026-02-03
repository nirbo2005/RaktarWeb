import { type User } from "./User";
import { type Product } from "./Product";

export interface AuditLog {
  id: number;
  muvelet: "CREATE" | "UPDATE" | "DELETE" | "RESTORE"; // Szigorúbb típusok!
  idopont: string;
  stockId: number | null;
  user: Pick<User, "nev">; // Csak a nev kell belőle a loghoz
  stock: Pick<Product, "nev"> | null;
}
