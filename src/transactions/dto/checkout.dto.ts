import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  IsDateString,
  IsEnum,
  ValidateNested,
  IsUUID,
} from 'class-validator';

export class CheckoutItemDto {
  @ApiProperty({
    example: '1d10fdc4-ebb8-40e9-b51a-cfaceb7d0d42',
    description: 'ID item di keranjang',
  })
  @IsUUID()
  cartId: string;

  @ApiProperty({
    example: '265dc95c-3f25-441d-a593-e875aa4ce1bd',
    description: 'ID produk',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 3, description: 'Jumlah item' })
  @IsNumber()
  jumlah: number;

  @ApiProperty({ example: 1000, description: 'Harga per satuan' })
  @IsNumber()
  hargaSatuan: number;
}

export class CheckoutDto {
  @ApiProperty({
    example: 'dc93f9c3-bcb6-4551-9a13-394c11d636a4',
    description: 'ID petani penjual',
  })
  @IsUUID()
  petaniId: string;

  @ApiProperty({
    example: '2026-05-30T09:00:00.000Z',
    description: 'Tanggal pengambilan barang',
  })
  @IsDateString()
  tanggalPengambilan: string;

  @ApiProperty({
    example: 'COD',
    enum: ['QRIS', 'Transfer', 'COD'],
    description: 'Metode pembayaran',
  })
  @IsEnum(['QRIS', 'Transfer', 'COD'])
  metodePembayaran: 'QRIS' | 'Transfer' | 'COD';

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'accepted'],
    description: 'Status transaksi',
  })
  @IsEnum(['pending', 'accepted'])
  status: 'pending' | 'accepted';

  @ApiProperty({ example: 3000, description: 'Total harga keseluruhan' })
  @IsNumber()
  totalHarga: number;

  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Daftar item yang di-checkout',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}
