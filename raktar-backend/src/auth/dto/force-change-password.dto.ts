import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForceChangePasswordDto {
  @ApiProperty({ example: 'admin88' })
  @IsString()
  @IsNotEmpty({ message: 'A felhasználónév megadása kötelező!' })
  felhasznalonev: string;

  @ApiProperty({ example: 'TEMP-p@ssw0rd' })
  @IsString()
  @IsNotEmpty({ message: 'Az ideiglenes jelszó megadása kötelező!' })
  ideiglenesJelszo: string;

  @ApiProperty({ example: 'UjB1ztonsagosJelszo!' })
  @IsString()
  @MinLength(6, {
    message: 'Az új jelszónak legalább 6 karakternek kell lennie!',
  })
  ujJelszo: string;
}