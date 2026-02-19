//raktar-frontend/src/types/User.ts
export type UserRole = "NEZELODO" | "KEZELO" | "ADMIN";

export interface User {
  id: number;
  nev: string;
  felhasznalonev: string;
  rang: UserRole; // boolean admin helyett
  email?: string;
  telefonszam?: string;
  isBanned?: boolean;
}