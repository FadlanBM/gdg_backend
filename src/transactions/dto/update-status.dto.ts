import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    example: 'diterima',
    enum: ['diterima', 'ditolak', 'selesai'],
    description: 'Status pesanan baru',
  })
  @IsEnum(['diterima', 'ditolak', 'selesai'], {
    message: 'Status harus salah satu dari: diterima, ditolak, selesai',
  })
  status: 'diterima' | 'ditolak' | 'selesai';
}
