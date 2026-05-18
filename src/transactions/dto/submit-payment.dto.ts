import { ApiProperty } from '@nestjs/swagger';

export class SubmitPaymentDto {
  @ApiProperty({
    example: 'http://localhost:3000/uploads/temp/temp-1715967000-4716.png',
    description: 'URL bukti pembayaran sementara dari endpoint /assets/upload',
  })
  buktiBayarUrl: string;
}
