
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'A felhasználónév megadása kötelező!' })
  felhasznalonev: string;

  @IsString()
  @IsNotEmpty({ message: 'A jelszó megadása kötelező!' })
  @MinLength(6, { message: 'A jelszó legalább 6 karakter hosszú kell legyen!' })
  jelszo: string;
}
