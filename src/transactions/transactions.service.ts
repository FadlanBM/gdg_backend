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
    // 1. Create Transaction from the DTO directly
    const transaction = await this.db
      .insert(schema.transactions)
      .values({
        pembeliId,
        petaniId: dto.petaniId,
        totalPembayaran: dto.totalHarga.toString(),
        metodeBayar: dto.metodePembayaran,
        status: dto.status,
        tanggalPengambilan: new Date(dto.tanggalPengambilan),
        statusPembayaran: 'menunggu',
        statusPesanan: 'menunggu',
      })
      .returning();

    const transactionId = transaction[0].id;

    // 2. Create Transaction Items from items in DTO
    await this.db.insert(schema.transactionItems).values(
      dto.items.map((item) => ({
        transactionId,
        productId: item.productId,
        jumlah: item.jumlah,
        hargaSnapshot: item.hargaSatuan.toString(),
      })),
    );

    // 3. Mark cart items as checked out
    const cartIds = dto.items.map((item) => item.cartId);
    if (cartIds.length > 0) {
      await this.db
        .update(schema.carts)
        .set({ isCheckout: true })
        .where(inArray(schema.carts.id, cartIds));
    }

    return this.findOne(transactionId);
  }

  async findOne(id: string) {
    const result = await this.db.query.transactions.findFirst({
      where: eq(schema.transactions.id, id),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        pembeli: {
          with: {
            profile: true,
            location: true,
          },
        },
        petani: {
          with: {
            profile: true,
            location: true,
          },
        },
      },
    });
    if (!result) {
      throw new NotFoundException('Transaction not found');
    }

    // Format response to include alamatLengkap and titikKoordinat
    const { pembeli, petani, ...transactionData } = result;
    return {
      ...transactionData,
      pembeli: pembeli
        ? {
            namaLengkap: pembeli.profile?.namaLengkap,
            nomorTelepon: pembeli.profile?.nomorTelepon,
            alamatLengkap: pembeli.profile?.alamatLengkap,
            titikKoordinat: pembeli.location
              ? {
                  latitude: pembeli.location.latitude,
                  longitude: pembeli.location.longitude,
                }
              : null,
          }
        : null,
      petani: petani
        ? {
            namaLengkap: petani.profile?.namaLengkap,
            nomorTelepon: petani.profile?.nomorTelepon,
            alamatLengkap: petani.profile?.alamatLengkap,
            titikKoordinat: petani.location
              ? {
                  latitude: petani.location.latitude,
                  longitude: petani.location.longitude,
                }
              : null,
          }
        : null,
    };
  }

  async findAll(userId: string, role: string, status?: string) {
    const conditions: any[] = [];

    if (role === 'pembeli') {
      conditions.push(eq(schema.transactions.pembeliId, userId));
    } else if (role === 'petani') {
      conditions.push(eq(schema.transactions.petaniId, userId));
    }

    // Filter by status if provided
    if (status) {
      const normalizedStatus = status.toLowerCase();
      if (normalizedStatus === 'pending' || normalizedStatus === 'accepted') {
        conditions.push(
          eq(schema.transactions.status, normalizedStatus as 'pending' | 'accepted'),
        );
      }
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const transactions = await this.db.query.transactions.findMany({
      where: whereClause,
      with: {
        items: {
          with: {
            product: true,
          },
        },
        pembeli: {
          with: {
            profile: true,
          },
        },
      },
    });

    // Format response
    return transactions.map((tx) => {
      const { pembeli, ...txData } = tx;
      return {
        ...txData,
        pembeli: pembeli
          ? {
              namaLengkap: pembeli.profile?.namaLengkap,
              nomorTelepon: pembeli.profile?.nomorTelepon,
            }
          : null,
      };
    });
  }

  async updateStatus(id: string, status: 'diterima' | 'ditolak' | 'selesai') {
    // 1. Dapatkan informasi transaksi sebelum update
    const transaction = await this.db.query.transactions.findFirst({
      where: eq(schema.transactions.id, id),
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const results = await this.db
      .update(schema.transactions)
      .set({ statusPesanan: status })
      .where(eq(schema.transactions.id, id))
      .returning();

    // 2. Jika status diubah menjadi 'selesai', tambahkan saldo ke profil petani
    if (status === 'selesai' && transaction.statusPesanan !== 'selesai') {
      const petaniProfile = await this.db.query.profiles.findFirst({
        where: eq(schema.profiles.userId, transaction.petaniId!),
      });

      if (petaniProfile) {
        const currentSaldo = parseFloat(petaniProfile.saldo?.toString() || '0');
        const transactionTotal = parseFloat(transaction.totalPembayaran.toString());
        const newSaldo = currentSaldo + transactionTotal;

        await this.db
          .update(schema.profiles)
          .set({ saldo: newSaldo.toString() })
          .where(eq(schema.profiles.userId, transaction.petaniId!));
      }
    }

    return results[0];
  }

  async submitPaymentProof(
    id: string,
    pembeliId: string,
    file?: Express.Multer.File,
  ) {
    const transaction = await this.findOne(id);

    if (transaction.pembeliId !== pembeliId) {
      throw new BadRequestException('You do not own this transaction');
    }

    let buktiBayarUrl = transaction.buktiBayarUrl;
    if (file) {
      buktiBayarUrl = await this.assetsService.saveFile(file, 'transactions');
    }

    const results = await this.db
      .update(schema.transactions)
      .set({
        buktiBayarUrl,
        statusPembayaran: file ? 'berhasil' : transaction.statusPembayaran,
      })
      .where(eq(schema.transactions.id, id))
      .returning();

    return results[0];
  }
}
