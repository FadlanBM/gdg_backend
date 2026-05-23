import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface CommodityPrice {
  commodity: string;
  nominal: number;
  change: number;
  changePercentage: number;
  denomination: string;
  date: string | null;
}

export interface PricesResponse {
  provinceId: number;
  marketTypeId: number;
  updatedAt: string;
  prices: CommodityPrice[];
}

@Injectable()
export class HargapanganService {
  private readonly logger = new Logger(HargapanganService.name);
  private cache = new Map<string, CacheEntry<any>>();
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('hargaPangan.url', 'https://www.bi.go.id/hargapangan');
  }

  // List of 21 commodities tracked on the home page
  private readonly commodities = [
    'Bawang Merah Ukuran Sedang',
    'Bawang Putih Ukuran Sedang',
    'Beras Kualitas Bawah I',
    'Beras Kualitas Bawah II',
    'Beras Kualitas Medium I',
    'Beras Kualitas Medium II',
    'Beras Kualitas Super I',
    'Beras Kualitas Super II',
    'Cabai Merah Besar',
    'Cabai Merah Keriting ',
    'Cabai Rawit Hijau',
    'Cabai Rawit Merah',
    'Daging Ayam Ras Segar',
    'Daging Sapi Kualitas 1',
    'Daging Sapi Kualitas 2',
    'Gula Pasir Kualitas Premium',
    'Gula Pasir Lokal',
    'Minyak Goreng Curah',
    'Minyak Goreng Kemasan Bermerk 1',
    'Minyak Goreng Kemasan Bermerk 2',
    'Telur Ayam Ras Segar',
  ];

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setToCache<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Fetch all provinces from Bank Indonesia
   */
  async getProvinces(): Promise<any[]> {
    const cacheKey = 'provinces';
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    try {
      this.logger.log('Fetching provinces list from BI...');
      const response = await fetch(
        `${this.baseUrl}/WebSite/Home/GetProvinceAll`,
      );
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      
      // Cache for 24 hours
      this.setToCache(cacheKey, data, 24 * 60 * 60 * 1000);
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch provinces', error);
      throw new HttpException(
        'Failed to retrieve provinces list from Bank Indonesia',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Fetch all market/price types from Bank Indonesia
   */
  async getMarketTypes(): Promise<any[]> {
    const cacheKey = 'market_types';
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    try {
      this.logger.log('Fetching market types list from BI...');
      const response = await fetch(
        `${this.baseUrl}/WebSite/Home/GetType`,
      );
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();

      // Cache for 24 hours
      this.setToCache(cacheKey, data, 24 * 60 * 60 * 1000);
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch market types', error);
      throw new HttpException(
        'Failed to retrieve market types from Bank Indonesia',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Fetch real-time food prices by province and market type
   */
  async getPrices(provinceId: number = 0, marketTypeId: number = 1): Promise<PricesResponse> {
    const cacheKey = `prices:${provinceId}:${marketTypeId}`;
    const cached = this.getFromCache<PricesResponse>(cacheKey);
    if (cached) {
      this.logger.log(`Serving prices from cache for key: ${cacheKey}`);
      return cached;
    }

    try {
      this.logger.log(`Initiating food prices scrape (provinceId: ${provinceId}, marketTypeId: ${marketTypeId})`);
      
      // 1. Fetch home page to extract temp_id
      const homeRes = await fetch(`${this.baseUrl}/home/index`);
      if (!homeRes.ok) {
        throw new Error(`Failed to load home page: ${homeRes.statusText}`);
      }
      const html = await homeRes.text();
      
      const tempIdMatch = html.match(/id="temp_id"[^>]*value="([^"]+)"/);
      if (!tempIdMatch) {
        throw new Error('Failed to parse temp_id from the BI home page HTML');
      }
      const tempId = tempIdMatch[1];
      this.logger.debug(`Extracted tempId: ${tempId}`);

      // 2. If filtering by specific province or non-default market type, trigger the session update
      if (provinceId !== 0 || marketTypeId !== 1) {
        this.logger.log(`Updating BI session chart data for provId: ${provinceId}, priceTypeId: ${marketTypeId}`);
        const updateUrl = `${this.baseUrl}/WebSite/Home/UpdateChartData?tempId=${tempId}&provId=${provinceId}&priceTypeId=${marketTypeId}`;
        const updateRes = await fetch(updateUrl);
        if (!updateRes.ok) {
          this.logger.warn(`Failed to update chart session data: ${updateRes.statusText}`);
        }
      }

      // 3. Fetch data for each commodity in parallel
      const pricePromises = this.commodities.map(async (com): Promise<CommodityPrice> => {
        try {
          const dataUrl = `${this.baseUrl}/WebSite/Home/GetChartData?tempId=${tempId}&comName=${encodeURIComponent(com)}&forInfo=true`;
          const dataRes = await fetch(dataUrl);
          if (!dataRes.ok) {
            throw new Error(`HTTP Error: ${dataRes.status}`);
          }
          const json = await dataRes.json();
          const item = json.data?.[0];

          return {
            commodity: com,
            nominal: item?.nominal ?? 0,
            change: item?.harga ?? 0,
            changePercentage: item?.fluc ?? 0,
            denomination: item?.denomination ?? 'kg',
            date: item?.date ? new Date(item.date).toISOString().split('T')[0] : null,
          };
        } catch (err) {
          this.logger.error(`Error fetching price for commodity [${com}]:`, err.message);
          return {
            commodity: com,
            nominal: 0,
            change: 0,
            changePercentage: 0,
            denomination: 'kg',
            date: null,
          };
        }
      });

      const prices = await Promise.all(pricePromises);
      
      const responseData: PricesResponse = {
        provinceId,
        marketTypeId,
        updatedAt: new Date().toISOString(),
        prices,
      };

      // Cache for 1 hour (3600000 ms)
      this.setToCache(cacheKey, responseData, 60 * 60 * 1000);
      
      return responseData;
    } catch (error) {
      this.logger.error('Scraping food prices failed', error);
      throw new HttpException(
        `Failed to retrieve food prices: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
