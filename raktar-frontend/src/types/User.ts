//raktar-frontend/src/types/User.ts
export interface User {
  id: number;
  nev: string;
  felhasznalonev: string;
  admin: boolean;
  email?: string;
  telefonszam?: string;
  isBanned?: boolean;
}
