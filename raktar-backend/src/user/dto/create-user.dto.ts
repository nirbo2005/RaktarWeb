import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail, // Új import az email validáláshoz
} from 'class-validator';

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
  @MinLength(6, { message: 'A jelszónak legalább 6 karakternek kell lennie!' })
  jelszo: string;

  @IsEmail({}, { message: 'Érvénytelen email cím formátum!' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefonszam?: string;

  @IsBoolean({ message: 'Az admin mező csak logikai érték lehet!' })
  @IsOptional()
  admin?: boolean;
}
