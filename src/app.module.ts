import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController, AppService } from './app';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AiModule } from './common/ai/ai.module';
import { AssetsModule } from './common/assets/assets.module';
import { HargapanganModule } from './hargapangan/hargapangan.module';
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
    CategoriesModule,
    TransactionsModule,
    AiModule,
    AssetsModule,
    HargapanganModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
