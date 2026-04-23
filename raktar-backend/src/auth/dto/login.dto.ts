import { IsString, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin88' })
  @IsString()
  @IsNotEmpty({ message: 'A felhasználónév megadása kötelező!' })
  felhasznalonev: string;

  @ApiProperty({ example: 'titkosJelszo123' })
  @IsString()
  @IsNotEmpty({ message: 'A jelszó megadása kötelező!' })
  @MinLength(6, { message: 'A jelszó legalább 6 karakter hosszú kell legyen!' })
  jelszo: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}