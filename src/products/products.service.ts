import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq, sql } from 'drizzle-orm';
import { AssetsService } from '../common/assets/assets.service';
import { AiService } from '../common/ai/ai.service';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private assetsService: AssetsService,
    private aiService: AiService,
  ) {}

  async create(
    petaniId: string,
    body: any,
    files: Express.Multer.File[],
  ) {
    const fotoUrl = files.length > 0
      ? await Promise.all(
          files.map((file) => this.assetsService.saveFile(file, 'products')),
        )
      : [];

    const results = await this.db
      .insert(schema.products)
      .values({
        namaProduk: body.namaProduk,
        kategoriId: body.kategoriId || null,
        deskripsi: body.deskripsi,
        harga: body.harga ? String(body.harga) : null,
        tipeStok: body.tipeStok || 'kg',
        stok: body.stok ? Number(body.stok) : 0,
        fotoUrl,
        petaniId,
        status: 'pending',
      })
      .returning();
    return results[0];
  }

  async findAll(page: number = 1, limit: number = 10, kategoriId?: string) {
    const offset = (page - 1) * limit;

    const baseQuery = this.db.select().from(schema.products);
    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.products);

    if (kategoriId) {
      baseQuery.where(eq(schema.products.kategoriId, kategoriId));
      countQuery.where(eq(schema.products.kategoriId, kategoriId));
    }

    const [data, totalResult] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      countQuery,
    ]);

    const total = Number(totalResult[0].count);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const results = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id));

    if (results.length === 0) {
      throw new NotFoundException('Product not found');
    }
    return results[0];
  }

  async analyze(id: string) {
    const product = await this.findOne(id);

    let kategoriName = '';
    if (product.kategoriId) {
      const cat = await this.db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, product.kategoriId));
      if (cat.length > 0) kategoriName = cat[0].nama;
    }

    const analysisResult = await this.aiService.analyzeProduct({
      nama: product.namaProduk,
      deskripsi: product.deskripsi || '',
      kategori: kategoriName,
    });

    const analysis = await this.db
      .insert(schema.aiAnalysis)
      .values({
        productId: product.id,
        gradeSni: analysisResult.gradeSni,
        skorKualitas: analysisResult.skorKualitas.toString(),
        saranHargaAi: analysisResult.saranHarga.toString(),
        hargaAkhirPetani: analysisResult.saranHarga.toString(),
      })
      .onConflictDoUpdate({
        target: schema.aiAnalysis.productId,
        set: {
          gradeSni: analysisResult.gradeSni,
          skorKualitas: analysisResult.skorKualitas.toString(),
          saranHargaAi: analysisResult.saranHarga.toString(),
          hargaAkhirPetani: analysisResult.saranHarga.toString(),
        },
      })
      .returning();

    await this.db
      .update(schema.products)
      .set({ status: 'active' })
      .where(eq(schema.products.id, id));

    return analysis[0];
  }

  async updateStatus(id: string, status: 'active' | 'non-active') {
    try {
      const results = await this.db
        .update(schema.products)
        .set({ status })
        .where(eq(schema.products.id, id))
        .returning();

      if (results.length === 0) {
        throw new NotFoundException('Product not found');
      }
      return results[0];
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      console.error('Update Status Error:', e);
      throw new BadRequestException(
        `Failed to update status. Ensure status is 'active' or 'non-active'.`,
      );
    }
  }
}
