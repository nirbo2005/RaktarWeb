import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin88' })
  @IsString()
  @IsNotEmpty({ message: 'A felhasználónév megadása kötelező!' })
  felhasznalonev: string;

  @ApiProperty({ example: 'admin@raktarweb.hu' })
  @IsEmail({}, { message: 'Érvénytelen email formátum!' })
  @IsNotEmpty({ message: 'Az email megadása kötelező!' })
  email: string;

  @ApiProperty({ example: '+36301234567' })
  @IsString()
  @IsNotEmpty({ message: 'A telefonszám megadása kötelező!' })
  telefonszam: string;
}