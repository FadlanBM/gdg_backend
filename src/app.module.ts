import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController, AppService } from './app';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AiModule } from './common/ai/ai.module';
import { AssetsModule } from './common/assets/assets.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CartModule,
    TransactionsModule,
    AiModule,
    AssetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
