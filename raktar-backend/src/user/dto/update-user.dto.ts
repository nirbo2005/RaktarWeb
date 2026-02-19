import { IsString, IsOptional, IsEmail, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

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

  @IsEnum(Role)
  @IsOptional()
  rang?: Role;
}
