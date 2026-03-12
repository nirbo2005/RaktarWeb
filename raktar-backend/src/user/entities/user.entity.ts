// raktar-backend/src/user/entities/user.entity.ts
import { Role } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  nev: string;
  felhasznalonev: string;
  email: string | null;
  telefonszam: string | null;
  rang: Role;
  isBanned: boolean;
  mustChangePassword: boolean;
  avatarUrl: string | null;
  theme: string; // ÚJ: Téma beállítás
  language: string; // ÚJ: Nyelv beállítás

  @Exclude()
  jelszo: string;

  @Exclude()
  currentTokenVersion: number;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
