import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'A felhasználónév megadása kötelező!' })
  felhasznalonev: string;

  @IsEmail({}, { message: 'Érvénytelen email formátum!' })
  @IsNotEmpty({ message: 'Az email megadása kötelező!' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'A telefonszám megadása kötelező!' })
  telefonszam: string;
}
