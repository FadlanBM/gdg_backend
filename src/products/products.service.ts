import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { CreateProductDto } from './dto/create-product.dto';
import { AiService } from '../common/ai/ai.service';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private aiService: AiService,
  ) {}

  async create(petaniId: string, dto: CreateProductDto) {
    const results = await this.db
      .insert(schema.products)
      .values({
        ...dto,
        petaniId,
        status: 'pending',
      })
      .returning();
    return results[0];
  }

  async findAll(kategori?: string) {
    const query = this.db.select().from(schema.products);
    if (kategori) {
      // @ts-ignore
      query.where(eq(schema.products.kategori, kategori));
    }
    return query;
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

    const analysisResult = await this.aiService.analyzeProduct({
      nama: product.namaProduk,
      deskripsi: product.deskripsi || '',
      kategori: product.kategori,
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

    // Update product status to active after analysis
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
      throw new BadRequestException(`Failed to update status. Ensure status is 'active' or 'non-active'.`);
    }
  }
}
