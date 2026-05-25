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
