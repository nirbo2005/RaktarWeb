//raktar-backend/src/user/entities/user.entity.ts
import { Exclude } from 'class-transformer';
import { Role } from '@prisma/client'; // Ez az import kell!

export class UserEntity {
  id: number;
  nev: string;
  felhasznalonev: string;
  email: string | null;
  telefonszam: string | null;
  rang: Role; // admin: boolean HELYETT
  isBanned: boolean;

  @Exclude()
  jelszo: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
