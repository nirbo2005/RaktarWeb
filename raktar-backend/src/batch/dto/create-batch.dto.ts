import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ example: 1, description: 'A termék azonosítója (ID)' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 'A1-1', description: 'Parcella formátuma: [Részleg(A-D)][Sor(1-5)]-[Oszlop(1-4)]' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-D][1-5]-[1-4]$/, {
    message:
      'Parcella formátuma kötelezően: [Részleg(A-D)][Sor(1-5)]-[Oszlop(1-4)], pl. "A1-1" vagy "C5-4".',
  })
  parcella: string;

  @ApiProperty({ example: 50, description: 'A betárolni kívánt mennyiség' })
  @IsInt()
  @Min(1)
  mennyiseg: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z', description: 'Opcionális lejárati dátum' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lejarat?: Date;
}