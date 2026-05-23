import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Tomat Organik', description: 'Nama produk' })
  namaProduk: string;

  @ApiProperty({
    example: 'Tomat segar pilihan dari petani lokal',
    description: 'Deskripsi produk',
  })
  deskripsi: string;

  @ApiPropertyOptional({ example: 15000, description: 'Harga produk (Rupiah)' })
  harga?: string;

  @ApiPropertyOptional({
    example: 'kg',
    description: 'Tipe stok (kg, gram, liter, unit, dll)',
    default: 'kg',
  })
  tipeStok?: string;

  @ApiProperty({ example: 100, description: 'Stok produk' })
  stok: number;

  @ApiProperty({
    example: 'https://example.com/tomat.jpg',
    description: 'URL foto produk',
  })
  fotoUrl: string;
}
