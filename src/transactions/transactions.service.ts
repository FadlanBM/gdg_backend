import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { CheckoutDto } from './dto/checkout.dto';
import { AssetsService } from '../common/assets/assets.service';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private assetsService: AssetsService,
  ) {}

  async checkout(pembeliId: string, dto: CheckoutDto) {
    // 1. Get items in cart
    const cartItems = await this.db.query.carts.findMany({
      where: and(
        eq(schema.carts.pembeliId, pembeliId),
        eq(schema.carts.isCheckout, false),
      ),
      with: {
        product: {
          with: {
            aiAnalysis: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Calculate total and create snapshot
    let total = 0;
    const itemsToCreate = cartItems.map((item) => {
      const harga = parseFloat(
        item.product?.aiAnalysis?.hargaAkhirPetani || '0',
      );
      total += harga * item.jumlah;
      return {
        productId: item.productId,
        jumlah: item.jumlah,
        hargaSnapshot: harga.toString(),
      };
    });

    // 3. Create Transaction
    const transaction = await this.db
      .insert(schema.transactions)
      .values({
        pembeliId,
        totalPembayaran: total.toString(),
        metodeBayar: dto.metodeBayar,
        statusPembayaran: 'menunggu',
        statusPesanan: 'diproses',
      })
      .returning();

    const transactionId = transaction[0].id;

    // 4. Create Transaction Items
    await this.db.insert(schema.transactionItems).values(
      itemsToCreate.map((item) => ({
        ...item,
        transactionId,
      })),
    );

    // 5. Mark cart as checkout
    await this.db
      .update(schema.carts)
      .set({ isCheckout: true })
      .where(
        inArray(
          schema.carts.id,
          cartItems.map((item) => item.id),
        ),
      );

    return this.findOne(transactionId);
  }

  async findOne(id: string) {
    const results = await this.db.query.transactions.findFirst({
      where: eq(schema.transactions.id, id),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });
    if (!results) {
      throw new NotFoundException('Transaction not found');
    }
    return results;
  }

  async findAll(userId: string, role: string) {
    if (role === 'pembeli') {
      return this.db.query.transactions.findMany({
        where: eq(schema.transactions.pembeliId, userId),
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      });
    } else {
      // Petani sees transactions containing their products
      // This is a bit more complex with Drizzle query, using raw or subquery if needed
      // For now, let's keep it simple and show all for demo if needed, or filter.
      return this.db.query.transactions.findMany({
        with: {
          items: {
            with: {
              product: true,
            },
          },
        },
      });
    }
  }

  async updateStatus(id: string, status: 'diproses' | 'dikirim' | 'selesai') {
    const results = await this.db
      .update(schema.transactions)
      .set({ statusPesanan: status })
      .where(eq(schema.transactions.id, id))
      .returning();

    if (results.length === 0) {
      throw new NotFoundException('Transaction not found');
    }
    return results[0];
  }

  async submitPaymentProof(
    id: string,
    pembeliId: string,
    buktiBayarUrl: string,
  ) {
    const transaction = await this.findOne(id);

    if (transaction.pembeliId !== pembeliId) {
      throw new BadRequestException('You do not own this transaction');
    }

    let permanentUrl = buktiBayarUrl;
    if (buktiBayarUrl && buktiBayarUrl.includes('/uploads/temp/')) {
      try {
        permanentUrl = await this.assetsService.moveFileToPermanent(
          buktiBayarUrl,
          'transactions',
        );
      } catch (err) {
        console.error('Failed to move payment asset:', err);
      }
    }

    const results = await this.db
      .update(schema.transactions)
      .set({
        buktiBayarUrl: permanentUrl,
        statusPembayaran: 'berhasil',
      })
      .where(eq(schema.transactions.id, id))
      .returning();

    return results[0];
  }
}
