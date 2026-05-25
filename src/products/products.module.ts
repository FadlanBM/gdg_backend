import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DatabaseModule } from '../database/database.module';
import { AssetsModule } from '../common/assets/assets.module';
import { HargapanganModule } from '../hargapangan/hargapangan.module';

@Module({
  imports: [DatabaseModule, AssetsModule, HargapanganModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
