import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Kovács János Módosított' })
  @IsString()
  @IsOptional()
  nev?: string;

  @ApiPropertyOptional({ example: 'janos_k_uj' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(20)
  felhasznalonev?: string;

  @ApiPropertyOptional({ example: 'uj.email@example.com' })
  @IsEmail({}, { message: 'Érvénytelen email formátum!' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+36309876543' })
  @IsString()
  @IsOptional()
  telefonszam?: string;

  @ApiPropertyOptional({ example: 'RegiJelszo123!' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  regiJelszo?: string;

  @ApiPropertyOptional({ example: 'UjJelszo456!' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  ujJelszo?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.ADMIN })
  @IsEnum(Role)
  @IsOptional()
  rang?: Role;
}