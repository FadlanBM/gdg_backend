import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
