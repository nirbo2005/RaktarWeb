//raktar-backend/src/user/entities/user.entity.ts
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  nev: string;
  felhasznalonev: string;
  email: string | null;
  telefonszam: string | null;
  admin: boolean;
  isBanned: boolean;

  @Exclude() // Ez a titok: a jelszó mező ki lesz hagyva a JSON válaszból
  jelszo: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
