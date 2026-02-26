//raktar-backend/src/auth/dto/force-change-password.dto.ts
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForceChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'A felhasználónév megadása kötelező!' })
  felhasznalonev: string;

  @IsString()
  @IsNotEmpty({ message: 'Az ideiglenes jelszó megadása kötelező!' })
  ideiglenesJelszo: string;

  @IsString()
  @MinLength(6, {
    message: 'Az új jelszónak legalább 6 karakternek kell lennie!',
  })
  ujJelszo: string;
}
