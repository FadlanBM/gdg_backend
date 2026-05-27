import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    example: 'dikirim',
    enum: ['diproses', 'dikirim', 'selesai'],
    description: 'Status pesanan baru',
  })
  @IsEnum(['diproses', 'dikirim', 'selesai'], {
    message: 'Status harus salah satu dari: diproses, dikirim, selesai',
  })
  status: 'diproses' | 'dikirim' | 'selesai';
}
