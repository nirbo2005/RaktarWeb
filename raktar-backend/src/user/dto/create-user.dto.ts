//raktar-backend/src/user/dto/create-user.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
  IsEnum,
  Matches,
} from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString({ message: 'A névnek szövegnek kell lennie!' })
  @IsNotEmpty({ message: 'A név megadása kötelező!' })
  nev: string;

  @IsString()
  @IsNotEmpty({ message: 'A felhasználónév nem lehet üres!' })
  @MinLength(3, {
    message: 'A felhasználónévnek legalább 3 karakternek kell lennie!',
  })
  @MaxLength(20, { message: 'A felhasználónév maximum 20 karakter lehet!' })
  felhasznalonev: string;

  @IsString()
  @IsNotEmpty({ message: 'A jelszó nem lehet üres!' })
  @MinLength(8, { message: 'A jelszónak legalább 8 karakternek kell lennie!' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'A jelszó túl gyenge! Tartalmaznia kell kisbetűt, nagybetűt és számot vagy speciális karaktert!',
  })
  jelszo: string;

  @IsEmail({}, { message: 'Érvénytelen email cím formátum!' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefonszam?: string;

  @IsEnum(Role, { message: 'Érvénytelen rang!' })
  @IsOptional()
  rang?: Role;
}
