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
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
    });
  }

  async generateDescription(params: {
    namaProduk: string;
    imageUrl: string;
    kategori: string;
  }) {
    const parser = StructuredOutputParser.fromZodSchema(
      z.object({
        deskripsi: z.string().describe('Deskripsi produk yang menarik dan informatif dalam bahasa Indonesia'),
        kataKunci: z.array(z.string()).describe('Kata kunci SEO untuk produk ini'),
      }),
    );

    const formatInstructions = parser.getFormatInstructions();

    const visionModel = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('openai.apiKey'),
      configuration: {
        baseURL: this.configService.get<string>('openai.baseUrl'),
      },
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
    });

    try {
      const response = await visionModel.invoke([
        new SystemMessage(
          'Anda adalah asisten ahli pertanian dan pembuat konten produk di Indonesia. ' +
          'Buatlah deskripsi produk yang menarik, informatif, dan meyakinkan berdasarkan gambar produk, nama, dan kategori yang diberikan. ' +
          'Gunakan bahasa Indonesia yang baik dan benar.',
        ),
        new HumanMessage({
          content: [
            {
              type: 'text',
              text: `Buatkan deskripsi produk untuk:\nNama: ${params.namaProduk}\nKategori: ${params.kategori}\n\n${formatInstructions}`,
            },
            {
              type: 'image_url',
              image_url: { url: params.imageUrl },
            },
          ],
        }),
      ]);

      return await parser.parse(response.content as string);
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
        alasan: z.string().describe('Alasan singkat pemberian grade'),
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
          'You are an expert agricultural quality inspector in Indonesia. ' +
            'Analyze the product information and provide quality grading according to SNI standards.',
        ),
        new HumanMessage(
          `Analyze this product:\n` +
            `Name: ${productInfo.nama}\n` +
            `Description: ${productInfo.deskripsi}\n` +
            `Category: ${productInfo.kategori}\n` +
            marketInfo +
            `\n\n` +
            formatInstructions,
        ),
      ]);

      return await parser.parse(response.content as string);
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
}
