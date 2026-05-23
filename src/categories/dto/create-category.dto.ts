import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Sayur', description: 'Nama kategori' })
  nama: string;

  @ApiPropertyOptional({
    example: 'Kategori untuk produk sayur-mayur',
    description: 'Deskripsi kategori',
  })
  deskripsi?: string;
}
