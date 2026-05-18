import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateProductStatusDto {
  @ApiProperty({
    example: 'active',
    enum: ['active', 'non-active'],
    description: 'Status produk baru',
  })
  @IsEnum(['active', 'non-active'])
  status: 'active' | 'non-active';
}
