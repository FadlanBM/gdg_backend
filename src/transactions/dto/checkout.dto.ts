import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({
    example: 'QRIS',
    enum: ['QRIS', 'Transfer'],
    description: 'Metode pembayaran',
  })
  metodeBayar: 'QRIS' | 'Transfer';
}
