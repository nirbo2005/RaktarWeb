import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBatchDto {
  @ApiPropertyOptional({ example: 45, description: 'Az új, módosított mennyiség a parcellán' })
  @IsOptional()
  @IsInt()
  @Min(0)
  mennyiseg?: number;

  @ApiPropertyOptional({ example: 'A1-2', description: 'Az új fizikai hely (parcella) formátuma: [Részleg(A-D)][Sor(1-5)]-[Oszlop(1-4)]' })
  @IsOptional()
  @IsString()
  parcella?: string;

  @ApiPropertyOptional({ example: '2027-01-15T00:00:00.000Z', description: 'Módosított lejárati dátum (vagy null a törléshez)' })
  @IsOptional()
  lejarat?: Date | string | null;
}