import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'uuid-product-id', description: 'ID Produk' })
  productId: string;

  @ApiProperty({ example: 2, description: 'Jumlah item' })
  jumlah: number;
}

export class UpdateCartDto {
  @ApiProperty({ example: 5, description: 'Jumlah item baru' })
  jumlah: number;
}
