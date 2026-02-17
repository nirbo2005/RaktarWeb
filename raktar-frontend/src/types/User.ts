export interface User {
  id: number;
  nev: string;
  felhasznalonev: string;
  admin: boolean;
  email?: string;      // ÚJ
  telefonszam?: string; // ÚJ
  isBanned?: boolean;   // ÚJ (Admin felülethez)
}