import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq, sql, and, asc, desc, SQL } from 'drizzle-orm';
import { AssetsService } from '../common/assets/assets.service';
import { AiService } from '../common/ai/ai.service';
import { HargapanganService } from '../hargapangan/hargapangan.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private assetsService: AssetsService,
    private aiService: AiService,
    private hargapanganService: HargapanganService,
  ) {}

  async create(petaniId: string, body: any, files: Express.Multer.File[]) {
    const fotoUrl =
      files.length > 0
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

  async findByPetani(
    petaniId: string,
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'non-active' | 'pending',
  ) {
    const offset = (page - 1) * limit;

    const petaniCondition = eq(schema.products.petaniId, petaniId);

    const conditions = [petaniCondition];

    if (status) {
      conditions.push(eq(schema.products.status, status));
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const baseQuery = this.db.select().from(schema.products).where(whereClause);

    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.products)
      .where(whereClause);

    const [data, totalResult] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      countQuery,
    ]);

    const total = Number(totalResult[0].count);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    kategoriId?: string,
    search?: string,
    sort?: 'asc' | 'desc',
  ) {
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [eq(schema.products.status, 'active')];

    if (kategoriId) {
      conditions.push(eq(schema.products.kategoriId, kategoriId));
    }

    if (search) {
      conditions.push(
        sql`(${schema.products.namaProduk} ILIKE ${`%${search}%`} OR ${schema.products.deskripsi} ILIKE ${`%${search}%`})`,
      );
    }

    const whereClause =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const orderBy =
      sort === 'desc'
        ? desc(schema.products.harga)
        : asc(schema.products.harga);

    const baseQuery = this.db
      .select()
      .from(schema.products)
      .where(whereClause)
      .orderBy(orderBy);
    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.products)
      .where(whereClause);

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

  async generateDescription(
    userId: string,
    namaProduk: string,
    kategoriId: string,
    files: Express.Multer.File[],
  ) {
    let kategoriName = '';
    if (kategoriId) {
      const cat = await this.db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, kategoriId));
      if (cat.length > 0) kategoriName = cat[0].nama;
    }

    let imageBase64 = '';
    if (files.length > 0) {
      const file = files[0];
      const base64 = file.buffer.toString('base64');
      imageBase64 = `data:${file.mimetype};base64,${base64}`;
    }

    return this.aiService.generateDescription({
      namaProduk,
      imageBase64,
      kategori: kategoriName,
    });
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

  async analyzePrice(categoryId: string, productName?: string) {
    if (!categoryId) {
      throw new BadRequestException('ID kategori harus diberikan untuk analisis harga');
    }

    const categoryResults = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, categoryId));

    if (categoryResults.length === 0) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }
    const category = categoryResults[0];

    let pricesData: any[] = [];
    try {
      const pricesResponse = await this.hargapanganService.getPrices();
      pricesData = pricesResponse.prices ?? [];
      this.logger.log(`Fetched ${pricesData.length} commodity prices for analysis`);
    } catch (e) {
      this.logger.warn('Gagal mengambil data harga pasar, AI akan tetap menganalisis tanpa data referensi');
    }

    const searchKeyword = productName || category.nama;
    const keywords = searchKeyword.toLowerCase().split(' ');
    const relevantPrices = pricesData.filter((p) =>
      keywords.some((kw) => p.commodity.toLowerCase().includes(kw)),
    );

    const dataToAnalyze = relevantPrices.length > 0 ? relevantPrices : pricesData;
    const analysis = await this.aiService.analyzeCategoryPrice(searchKeyword, dataToAnalyze);

    return {
      category: category?.nama,
      productName: productName,
      aiAnalysis: analysis,
    };
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

    let marketPrices:
      | { commodity: string; price: number; denomination: string }[]
      | undefined = undefined;
    try {
      const pricesData = await this.hargapanganService.getPrices();
      marketPrices = pricesData.prices.map((p) => ({
        commodity: p.commodity,
        price: p.nominal,
        denomination: p.denomination,
      }));
    } catch (e) {
      this.logger.warn(
        'Failed to fetch hargapangan prices, proceeding without market data',
      );
    }

    const analysisResult = await this.aiService.analyzeProduct({
      nama: product.namaProduk,
      deskripsi: product.deskripsi || '',
      kategori: kategoriName,
      marketPrices,
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

  async remove(petaniId: string, id: string) {
    const product = await this.findOne(id);

    if (product.petaniId !== petaniId) {
      throw new ForbiddenException('You can only delete your own product');
    }

    await this.db.delete(schema.products).where(eq(schema.products.id, id));
    return { message: 'Product deleted successfully' };
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

  async analyzePriceWithImages(params: {
    files: Express.Multer.File[];
    productName?: string;
    category?: string;
    location?: string;
    additionalContext?: string;
  }) {
    const { files, productName, category, location, additionalContext } = params;

    // Validasi: harus ada minimal 1 gambar
    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal 1 gambar produk harus diunggah');
    }

    // Validasi: maksimal 10 gambar
    if (files.length > 10) {
      throw new BadRequestException('Maksimal 10 gambar yang diperbolehkan');
    }

    // Validasi format dan ukuran setiap file
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Format file tidak didukung: ${file.originalname}. Gunakan jpg, jpeg, png, atau webp.`,
        );
      }
      if (file.size > maxSizeBytes) {
        throw new BadRequestException(
          `Ukuran file ${file.originalname} melebihi batas 10MB.`,
        );
      }
    }

    // Konversi semua file ke base64 data URL
    const imagesBase64 = files.map(
      (file) => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    );

    // Ambil harga pasar sebagai referensi (opsional, tidak blocking)
    let marketPrices: { commodity: string; nominal: number; denomination: string }[] = [];
    try {
      const pricesResponse = await this.hargapanganService.getPrices();
      marketPrices = (pricesResponse.prices ?? []).map((p) => ({
        commodity: p.commodity,
        nominal: p.nominal,
        denomination: p.denomination,
      }));
      this.logger.log(`Fetched ${marketPrices.length} market prices for image analysis reference`);
    } catch (e) {
      this.logger.warn('Gagal mengambil data harga pasar, analisis gambar tetap dilanjutkan');
    }

    const analysis = await this.aiService.analyzeProductImages({
      imagesBase64,
      productName,
      category,
      location,
      additionalContext,
      marketPrices,
    });

    return {
      success: true,
      data: analysis,
    };
  }
}
