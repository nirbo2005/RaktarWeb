import { IsOptional, IsInt, Min, IsString } from 'class-validator';

export class UpdateBatchDto {
  @IsOptional()
  @IsInt()
  @Min(0) 
  mennyiseg?: number;

  @IsOptional()
  @IsString()
  parcella?: string;

  @IsOptional()
  lejarat?: Date | string | null;
}
