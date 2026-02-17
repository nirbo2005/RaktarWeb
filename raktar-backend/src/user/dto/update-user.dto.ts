//raktar-backend/src/user/dto/update-user.dto.ts
import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nev?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(20)
  felhasznalonev?: string;

  @IsEmail({}, { message: 'Érvénytelen email formátum!' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefonszam?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  regiJelszo?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  ujJelszo?: string;
}
