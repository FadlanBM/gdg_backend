import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssetsService } from './assets.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
