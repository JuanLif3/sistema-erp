import { IsString, IsNumber, IsPositive, IsOptional, Min, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0) // El stock puede ser 0, pero no negativo
  stock: number;

  @IsString()
  category: string;
}