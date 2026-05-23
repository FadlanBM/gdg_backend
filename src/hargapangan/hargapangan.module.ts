import { Module } from '@nestjs/common';
import { HargapanganController } from './hargapangan.controller';
import { HargapanganService } from './hargapangan.service';

@Module({
  controllers: [HargapanganController],
  providers: [HargapanganService],
  exports: [HargapanganService],
})
export class HargapanganModule {}
