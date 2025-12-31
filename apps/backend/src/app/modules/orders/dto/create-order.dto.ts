import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  @IsNotEmpty()
  items: { productId: string; quantity: number }[];

  // 👇 NUEVO: Opcional (si no viene, asumimos efectivo)
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}