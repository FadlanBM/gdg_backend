import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HargapanganService } from './hargapangan.service';

@ApiTags('hargapangan')
@Controller('hargapangan')
export class HargapanganController {
  constructor(private readonly hargapanganService: HargapanganService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Get all provinces tracked by Bank Indonesia' })
  getProvinces() {
    return this.hargapanganService.getProvinces();
  }

  @Get('market-types')
  @ApiOperation({ summary: 'Get all market types (Traditional, Modern, Wholesaler, Producer)' })
  getMarketTypes() {
    return this.hargapanganService.getMarketTypes();
  }

  @Get('prices')
  @ApiOperation({ summary: 'Get real-time prices for 21 food commodities' })
  @ApiQuery({
    name: 'provinceId',
    required: false,
    description: 'Province ID (use 0 or omit for National Average)',
    type: Number,
  })
  @ApiQuery({
    name: 'marketTypeId',
    required: false,
    description: 'Market Type ID (1: Traditional, 2: Modern, 3: Wholesaler, 4: Producer)',
    type: Number,
  })
  getPrices(
    @Query('provinceId') provinceId?: string,
    @Query('marketTypeId') marketTypeId?: string,
  ) {
    const provId = provinceId ? parseInt(provinceId, 10) : 0;
    const mktTypeId = marketTypeId ? parseInt(marketTypeId, 10) : 1;
    return this.hargapanganService.getPrices(provId, mktTypeId);
  }
}
