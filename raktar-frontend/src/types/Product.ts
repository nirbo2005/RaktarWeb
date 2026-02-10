export type Product = {
  id: number;
  nev: string;
  gyarto: string;
  lejarat: Date;
  ar: number;         // ÚJ/PÓTOLT: Az ár mező fontos az Audit Log "regiAdat/ujAdat" JSON-jéhez
  mennyiseg: number;
  parcella: string;
  isDeleted: boolean; // ÚJ: A logoknál látnunk kell, ha egy termék már nincs az aktív készletben
};