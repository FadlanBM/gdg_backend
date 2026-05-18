import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Tomat Organik', description: 'Nama produk' })
  namaProduk: string;

  @ApiProperty({
    example: 'sayur',
    enum: ['sayur', 'buah', 'benih'],
    description: 'Kategori produk',
  })
  kategori: 'sayur' | 'buah' | 'benih';

  @ApiProperty({
    example: 'Tomat segar pilihan dari petani lokal',
    description: 'Deskripsi produk',
  })
  deskripsi: string;

  @ApiProperty({ example: 100, description: 'Stok produk (kg/unit)' })
  stok: number;

  @ApiProperty({
    example: 'https://example.com/tomat.jpg',
    description: 'URL foto produk',
  })
  fotoUrl: string;
}
