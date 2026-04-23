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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Kovács János' })
  @IsString({ message: 'A névnek szövegnek kell lennie!' })
  @IsNotEmpty({ message: 'A név megadása kötelező!' })
  nev: string;

  @ApiProperty({ example: 'janos_k' })
  @IsString()
  @IsNotEmpty({ message: 'A felhasználónév nem lehet üres!' })
  @MinLength(3, {
    message: 'A felhasználónévnek legalább 3 karakternek kell lennie!',
  })
  @MaxLength(20, { message: 'A felhasználónév maximum 20 karakter lehet!' })
  felhasznalonev: string;

  @ApiProperty({ example: 'Jelszo123!' })
  @IsString()
  @IsNotEmpty({ message: 'A jelszó nem lehet üres!' })
  @MinLength(8, { message: 'A jelszónak legalább 8 karakternek kell lennie!' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'A jelszó túl gyenge! Tartalmaznia kell kisbetűt, nagybetűt és számot vagy speciális karaktert!',
  })
  jelszo: string;

  @ApiPropertyOptional({ example: 'janos@example.com' })
  @IsEmail({}, { message: 'Érvénytelen email cím formátum!' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+36301234567' })
  @IsString()
  @IsOptional()
  telefonszam?: string;

  @ApiPropertyOptional({ enum: Role, example: Role.KEZELO })
  @IsEnum(Role, { message: 'Érvénytelen rang!' })
  @IsOptional()
  rang?: Role;
}