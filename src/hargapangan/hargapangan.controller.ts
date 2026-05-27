import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HargapanganService } from './hargapangan.service';

@ApiTags('hargapangan')
@Controller('hargapangan')
export class HargapanganController {
  constructor(private readonly hargapanganService: HargapanganService) {}

  @Get('markets')
  @ApiOperation({
    summary: 'Ambil daftar pasar dari Sistem Informasi Harga Pangan Kota Yogyakarta',
  })
  getMarkets() {
    return this.hargapanganService.getMarkets();
  }

  @Get('prices')
  @ApiOperation({
    summary: 'Ambil harga komoditas pangan terkini dari Kota Yogyakarta',
  })
  @ApiQuery({
    name: 'pasarId',
    required: false,
    description: 'ID pasar (kosongkan untuk semua pasar)',
    type: Number,
  })
  getPrices(@Query('pasarId') pasarId?: string) {
    return this.hargapanganService.getPrices(
      pasarId ? parseInt(pasarId, 10) : undefined,
    );
  }

  @Get('price-changes')
  @ApiOperation({
    summary: 'Ambil perubahan harga komoditas hari ini dari Kota Yogyakarta',
  })
  @ApiQuery({
    name: 'pasarId',
    required: false,
    description: 'ID pasar (kosongkan untuk semua pasar)',
    type: Number,
  })
  getPriceChanges(@Query('pasarId') pasarId?: string) {
    return this.hargapanganService.getPriceChanges(
      pasarId ? parseInt(pasarId, 10) : undefined,
    );
  }
}
