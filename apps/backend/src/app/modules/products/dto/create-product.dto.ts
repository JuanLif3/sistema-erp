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
  @Min(0) 
  stock: number;

  @IsString()
  @IsOptional()
  image?: string; 

  @IsString()
  category: string;

  // 👇 AGREGA ESTO AL FINAL:
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}