import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

@Injectable()
export class AiService {
  private chat: ChatOpenAI;

  constructor(private configService: ConfigService) {
    this.chat = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('openai.apiKey'),
      configuration: {
        baseURL: this.configService.get<string>('openai.baseUrl'),
      },
      modelName: 'gemini/gemini-2.5-flash-lite',
      temperature: 0.5,
    });
  }

  async generateDescription(params: {
    namaProduk: string;
    imageBase64: string;
    kategori: string;
  }) {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        deskripsi: z
          .string()
          .describe(
            'Deskripsi produk yang menarik dan informatif dalam bahasa Indonesia',
          ),
        kataKunci: z
          .array(z.string())
          .describe('Kata kunci SEO untuk produk ini'),
      }),
    );

    const formatInstructions = parser.getFormatInstructions();

    const visionModel = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('openai.apiKey'),
      configuration: {
        baseURL: this.configService.get<string>('openai.baseUrl'),
      },
      modelName: 'gemini/gemini-2.5-flash-lite',
      temperature: 0.3,
    });

    try {
      const response = await visionModel.invoke([
        new SystemMessage(
          'Anda adalah asisten ahli pertanian dan pembuat konten produk e-commerce di Indonesia. ' +
            'Tugas Anda adalah membuat deskripsi produk yang sangat lengkap, jelas, menarik, dan informatif berdasarkan nama produk, kategori, dan gambar yang diberikan.\n' +
            'Deskripsi produk harus mencakup:\n' +
            '1. Detail Karakteristik Fisik: Jelaskan tampilan produk di gambar secara detail (warna, tingkat kematangan/kesegaran, tekstur, bentuk/ukuran, kebersihan).\n' +
            '2. Keunggulan & Kualitas: Sebutkan keunggulan produk (misal: organik, ditanam secara lokal, bebas pestisida, kualitas premium).\n' +
            '3. Manfaat Kesehatan & Kandungan Gizi (jika relevan).\n' +
            '4. Saran Penyimpanan & Penyajian: Berikan panduan cara menyimpan agar tetap segar dan cara mengonsumsinya.\n' +
            'Gunakan bahasa Indonesia yang profesional, ramah, persuasif, terstruktur dengan paragraf/poin-poin, dan mudah dipahami oleh pembeli.',
        ),
        new HumanMessage({
          content: [
            {
              type: 'text',
              text:
                `Buatkan deskripsi produk yang lengkap, terperinci, dan jelas untuk produk berikut:\n` +
                `Nama Produk: ${params.namaProduk}\n` +
                `Kategori: ${params.kategori}\n\n` +
                `Pastikan deskripsi ditulis dengan struktur yang rapi (misalnya menggunakan poin-poin/bullet points untuk detail karakteristik dan manfaat agar mudah dibaca) dan tidak ada informasi penting yang terlewat.\n\n` +
                `${formatInstructions}`,
            },
            {
              type: 'image_url',
              image_url: { url: params.imageBase64 },
            },
          ],
        }),
      ]);

      const contentString = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map(c => c.type === 'text' ? c.text : '').join('')
          : '';

      const cleanContent = contentString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return await parser.parse(cleanContent);
    } catch (e) {
      console.error('AI Generate Description Error:', e);
      return {
        deskripsi: `${params.namaProduk} berkualitas tinggi, segar dan siap dikonsumsi. Cocok untuk kebutuhan sehari-hari Anda.`,
        kataKunci: [params.namaProduk, params.kategori, 'produk segar'],
      };
    }
  }

  async analyzeProduct(productInfo: {
    nama: string;
    deskripsi: string;
    kategori: string;
    marketPrices?: { commodity: string; price: number; denomination: string }[];
  }) {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        gradeSni: z
          .enum(['A', 'B', 'C'])
          .describe('Grade kualitas berdasarkan standar SNI'),
        skorKualitas: z.number().describe('Skor kualitas dari 0-100'),
        saranHarga: z.number().describe('Rekomendasi harga jual dalam Rupiah'),
        alasan: z
          .string()
          .describe(
            'Alasan lengkap, rinci, dan jelas mengenai pemberian grade dan skor kualitas berdasarkan standar SNI serta saran harga',
          ),
      }),
    );

    const formatInstructions = parser.getFormatInstructions();

    let marketInfo = '';
    if (productInfo.marketPrices && productInfo.marketPrices.length > 0) {
      marketInfo =
        '\n\nCurrent market prices from Bank Indonesia (hargapangan):\n' +
        productInfo.marketPrices
          .map(
            (p) =>
              `- ${p.commodity}: Rp${p.price.toLocaleString('id-ID')}/${p.denomination}`,
          )
          .join('\n') +
        '\n\nUse these market prices as reference to suggest a competitive price for the product.';
    }

    try {
      const response = await this.chat.invoke([
        new SystemMessage(
          'Anda adalah seorang inspektur kualitas pertanian ahli di Indonesia. ' +
            'Tugas Anda adalah menganalisis informasi produk dan memberikan penilaian kualitas (grading) sesuai dengan standar SNI. ' +
            'PENTING: Pada bagian "alasan", Anda HARUS memberikan penjelasan yang SANGAT panjang, bervariasi, komprehensif, dan mendetail (minimal 3-4 paragraf). ' +
            'Jelaskan secara spesifik mengapa produk tersebut mendapatkan grade dan skornya, referensi indikator kualitas fisik, kriteria SNI yang relevan, serta analisis konteks harga pasar saat ini dibandingkan saran harga Anda.',
        ),
        new HumanMessage(
          `Analisis produk berikut dengan sangat detail dan berikan penjelasan yang panjang:\n` +
            `Nama: ${productInfo.nama}\n` +
            `Deskripsi: ${productInfo.deskripsi}\n` +
            `Kategori: ${productInfo.kategori}\n` +
            marketInfo +
            `\n\n` +
            formatInstructions,
        ),
      ]);

      const contentString = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map(c => c.type === 'text' ? c.text : '').join('')
          : '';

      const cleanContent = contentString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return await parser.parse(cleanContent);
    } catch (e) {
      console.error('AI Analysis Error:', e);
      // Fallback if API fails or parsing fails
      return {
        gradeSni: 'B' as const,
        skorKualitas: 75,
        saranHarga: 15000,
        alasan:
          'Analisis otomatis gagal (cek API Key/Koneksi), menggunakan nilai default.',
      };
    }
  }

  async analyzeCategoryPrice(productName: string, marketPrices: any[]) {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        hargaEstimasi: z
          .number()
          .describe('Estimasi kisaran harga jual rata-rata yang kompetitif dalam angka murni (contoh: 30000). HANYA ANGKA.'),
        satuan: z
          .string()
          .describe('Satuan berat atau ukuran untuk harga tersebut (contoh: "1 KG" atau "1 Ikat").'),
      }),
    );

    const formatInstructions = parser.getFormatInstructions();
    const marketInfo = marketPrices.length > 0
      ? marketPrices
          .map((p) => `- ${p.commodity}: Rp${p.nominal.toLocaleString('id-ID')}/${p.denomination}`)
          .join('\n')
      : 'Tidak ada data harga pasar yang tersedia saat ini.';

    try {
      const response = await this.chat.invoke([
        new SystemMessage(
          'Anda adalah seorang analis ekonomi pertanian ahli di Indonesia. ' +
            'Tugas Anda adalah memberikan estimasi dan analisis harga pasar spesifik HANYA untuk produk yang diminta. ' +
            'Jika produk yang diminta tidak ada secara eksplisit dalam Data Harga Pasar yang diberikan, jangan katakan tidak bisa dianalisis. ' +
            'Alih-alih, gunakan data komoditas lain yang relevan/mirip dalam daftar tersebut untuk mengestimasi dan memprediksi kisaran harga yang kompetitif bagi produk yang diminta.',
        ),
        new HumanMessage(
          `Produk yang Diminta: ${productName}\n\nData Harga Pasar Terkait (sebagai referensi):\n${marketInfo}\n\n${formatInstructions}`,
        ),
      ]);

      const contentString = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map(c => c.type === 'text' ? c.text : '').join('')
          : '';

      // Strip markdown code block if present
      const cleanContent = contentString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return await parser.parse(cleanContent);
    } catch (e) {
      console.error('AI Category Price Analysis Error:', e);
      return {
        hargaEstimasi: 0,
        satuan: '1 KG',
      };
    }
  }

  async analyzeProductImages(params: {
    imagesBase64: string[];
    productName?: string;
    category?: string;
    location?: string;
    currency?: string;
    additionalContext?: string;
    marketPrices?: { commodity: string; nominal: number; denomination: string }[];
  }) {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        productDetected: z.string().describe('Nama produk yang terdeteksi dari gambar'),
        estimatedPrice: z.object({
          min: z.number().describe('Estimasi harga minimum dalam Rupiah'),
          max: z.number().describe('Estimasi harga maksimum dalam Rupiah'),
          currency: z.string().default('IDR'),
        }),
        quality: z.object({
          grade: z.enum(['A', 'B', 'C', 'D', 'Reject']).describe('Grade kualitas produk'),
          score: z.number().min(0).max(100).describe('Skor kualitas 0-100'),
          freshness: z.enum(['Low', 'Medium', 'High']).describe('Tingkat kesegaran'),
          ripeness: z.enum(['Unripe', 'Semi-ripe', 'Ripe', 'Overripe']).describe('Tingkat kematangan (untuk buah)'),
          condition: z.enum(['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']).describe('Kondisi umum produk'),
        }),
        visualAnalysis: z.object({
          color: z.string().describe('Warna produk yang terdeteksi'),
          surfaceCondition: z.string().describe('Kondisi permukaan produk'),
          shapeConsistency: z.string().describe('Konsistensi bentuk produk'),
          damageDetected: z.boolean().describe('Apakah ada kerusakan fisik terdeteksi'),
          moldDetected: z.boolean().describe('Apakah ada jamur/busuk terdeteksi'),
        }),
        confidenceScore: z.number().min(0).max(1).describe('Skor kepercayaan analisis (0.0 - 1.0)'),
        reasoning: z.array(z.string()).describe('Alasan-alasan penentuan harga dan kualitas'),
        recommendation: z.object({
          sellingCategory: z.enum(['Budget', 'Standard', 'Premium']).describe('Kategori jual yang disarankan'),
          recommendedPrice: z.number().describe('Harga jual yang direkomendasikan dalam Rupiah'),
        }),
      }),
    );

    const formatInstructions = parser.getFormatInstructions();

    const visionModel = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('openai.apiKey'),
      configuration: {
        baseURL: this.configService.get<string>('openai.baseUrl'),
      },
      modelName: 'gemini/gemini-2.5-flash-lite',
      temperature: 0.3,
    });

    const contextInfo = [
      params.productName ? `Nama Produk: ${params.productName}` : '',
      params.category ? `Kategori: ${params.category}` : '',
      params.location ? `Lokasi Pasar: ${params.location}` : 'Lokasi Pasar: Indonesia',
      params.currency ? `Mata Uang: ${params.currency}` : 'Mata Uang: IDR',
      params.additionalContext ? `Informasi Tambahan: ${params.additionalContext}` : '',
    ].filter(Boolean).join('\n');

    const marketInfo = params.marketPrices && params.marketPrices.length > 0
      ? '\n\nReferensi Harga Pasar Lokal:\n' + params.marketPrices
          .map((p) => `- ${p.commodity}: Rp${p.nominal.toLocaleString('id-ID')}/${p.denomination}`)
          .join('\n')
      : '';

    // Build multi-image content
    const imageContent = params.imagesBase64.map((base64) => ({
      type: 'image_url' as const,
      image_url: { url: base64 },
    }));

    try {
      const response = await visionModel.invoke([
        new SystemMessage(
          'You are an expert agricultural and product quality analyst.\n\n' +
          'Your task is to analyze MULTIPLE product images together and determine:\n' +
          '1. Product identification\n' +
          '2. Product quality\n' +
          '3. Fruit quality grade (if applicable)\n' +
          '4. Estimated selling price in IDR\n' +
          '5. Product condition\n' +
          '6. Freshness level\n' +
          '7. Ripeness level (for fruits)\n' +
          '8. Damage detection\n' +
          '9. Final recommendation\n\n' +
          'IMPORTANT RULES:\n' +
          '- Analyze ALL images collectively, not individually.\n' +
          '- Combine information from every image before making conclusions.\n' +
          '- Prioritize visible condition, defects, freshness, color, size, and market quality.\n' +
          '- If the product is fruit, provide fruit quality grading.\n' +
          '- Estimate prices in Indonesian Rupiah (IDR) based on local market standards.\n' +
          '- Return ONLY valid JSON.\n' +
          '- Include confidence score between 0 and 1.\n' +
          '- Be conservative if uncertain.',
        ),
        new HumanMessage({
          content: [
            {
              type: 'text',
              text: `Analyze the following product from ALL ${params.imagesBase64.length} image(s) collectively.\n\n${contextInfo}${marketInfo}\n\nProvide a comprehensive analysis combining all visual data from all images.\n\n${formatInstructions}`,
            },
            ...imageContent,
          ],
        }),
      ]);

      const contentString = typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content.map(c => c.type === 'text' ? c.text : '').join('')
          : '';

      const cleanContent = contentString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      return await parser.parse(cleanContent);
    } catch (e) {
      console.error('AI Product Image Analysis Error:', e);
      return {
        productDetected: params.productName ?? 'Tidak terdeteksi',
        estimatedPrice: { min: 0, max: 0, currency: params.currency ?? 'IDR' },
        quality: {
          grade: 'C' as const,
          score: 0,
          freshness: 'Medium' as const,
          ripeness: 'Ripe' as const,
          condition: 'Fair' as const,
        },
        visualAnalysis: {
          color: 'Tidak terdeteksi',
          surfaceCondition: 'Tidak dapat dianalisis',
          shapeConsistency: 'Tidak dapat dianalisis',
          damageDetected: false,
          moldDetected: false,
        },
        confidenceScore: 0,
        reasoning: ['Analisis gagal. Pastikan gambar jelas dan koneksi AI aktif.'],
        recommendation: {
          sellingCategory: 'Standard' as const,
          recommendedPrice: 0,
        },
      };
    }
  }
}
