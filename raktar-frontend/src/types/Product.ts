export type Product = {
  id: number;
  nev: string;
  gyarto: string;
  lejarat: Date;
  ar: number;
  mennyiseg: number;
  parcella: string;
  isDeleted: boolean; // EZT ADJUK HOZZÁ
};