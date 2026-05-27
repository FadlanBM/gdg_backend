import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

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
  market?: string;
  trend?: string;
}

export interface PricesResponse {
  source: string;
  updatedAt: string;
  prices: CommodityPrice[];
}

export interface MarketInfo {
  id: number;
  nama: string;
}

@Injectable()
export class HargapanganService {
  private readonly logger = new Logger(HargapanganService.name);
  private cache = new Map<string, CacheEntry<any>>();
  private readonly baseUrl = 'https://hargapangan.jogjakota.go.id';

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
   * Get list of markets (pasar) from Jogja Harga Pangan
   */
  async getMarkets(): Promise<MarketInfo[]> {
    const cacheKey = 'jogja_markets';
    const cached = this.getFromCache<MarketInfo[]>(cacheKey);
    if (cached) return cached;

    try {
      this.logger.log('Fetching markets list from Jogja Harga Pangan...');
      const response = await fetch(`${this.baseUrl}/harga_pangan`, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; AgriBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const html = await response.text();

      // Extract pasar options from the HTML select/dropdown
      const pasarMatches = html.matchAll(/value="(\d+)"[^>]*>([^<]+Pasar[^<]*)<\/option>/gi);
      const markets: MarketInfo[] = [];

      for (const match of pasarMatches) {
        markets.push({
          id: parseInt(match[1], 10),
          nama: match[2].trim(),
        });
      }

      // If no pasar found via select, provide default known markets
      if (markets.length === 0) {
        markets.push(
          { id: 1, nama: 'Pasar Beringharjo' },
          { id: 2, nama: 'Pasar Kotagede' },
          { id: 3, nama: 'Pasar Kranggan' },
          { id: 4, nama: 'Pasar Legi' },
          { id: 5, nama: 'Pasar Satwa' },
        );
      }

      this.setToCache(cacheKey, markets, 24 * 60 * 60 * 1000);
      return markets;
    } catch (error) {
      this.logger.error('Failed to fetch markets', error);
      throw new HttpException(
        'Gagal mengambil daftar pasar dari Jogja Harga Pangan',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Fetch real-time food prices from Jogja Harga Pangan
   */
  async getPrices(pasarId?: number): Promise<PricesResponse> {
    const cacheKey = `jogja_prices:${pasarId ?? 'all'}`;
    const cached = this.getFromCache<PricesResponse>(cacheKey);
    if (cached) {
      this.logger.log(`Serving prices from cache for key: ${cacheKey}`);
      return cached;
    }

    try {
      this.logger.log(
        `Fetching Jogja Harga Pangan prices (pasarId: ${pasarId ?? 'all'})`,
      );

      const params = new URLSearchParams({
        draw: '1',
        start: '0',
        length: '100',
        'search[value]': '',
      });

      if (pasarId) {
        params.set('id_pasar', String(pasarId));
      }

      const response = await fetch(
        `${this.baseUrl}/harga_pangan?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json, text/javascript, */*',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (compatible; AgriBot/1.0)',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json = await response.json();

      if (!json.data || !Array.isArray(json.data)) {
        throw new Error('Invalid response structure from Jogja Harga Pangan');
      }

      const prices: CommodityPrice[] = json.data.map((item: any) => {
        const komoditas = item.komoditas ?? {};
        const satuan = komoditas.satuan?.nama_satuan ?? 'Kg';
        const pasar = item.pasar ?? {};

        return {
          commodity: komoditas.nama_komoditas ?? 'Unknown',
          nominal: item.harga_pangan ?? 0,
          change: item.perubahan_rp ?? 0,
          changePercentage: item.perubahan_persen ?? 0,
          denomination: satuan,
          date: item.tgl_harga_pangan ?? null,
          market: pasar.nama_pasar ?? null,
          trend: item.param_trend ?? 'tetap',
        };
      });

      const responseData: PricesResponse = {
        source: 'Sistem Informasi Harga Pangan Kota Yogyakarta',
        updatedAt: json.tgl_terakhir_verif ?? new Date().toISOString().split('T')[0],
        prices,
      };

      // Cache for 1 hour
      this.setToCache(cacheKey, responseData, 60 * 60 * 1000);
      return responseData;
    } catch (error) {
      this.logger.error('Scraping Jogja food prices failed', error);
      throw new HttpException(
        `Gagal mengambil data harga pangan: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get price changes today
   */
  async getPriceChanges(pasarId?: number): Promise<any> {
    const cacheKey = `jogja_changes:${pasarId ?? 'all'}`;
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    try {
      this.logger.log('Fetching today price changes from Jogja Harga Pangan...');

      const url = new URL(`${this.baseUrl}/harga_pangan/perubahan_hari_ini`);
      if (pasarId) {
        url.searchParams.set('id_pasar', String(pasarId));
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (compatible; AgriBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json = await response.json();

      const result = {
        source: 'Sistem Informasi Harga Pangan Kota Yogyakarta',
        updatedAt: new Date().toISOString(),
        changes: (json.data ?? []).map((item: any) => ({
          commodity: item.nama_komoditas,
          market: item.nama_pasar,
          price: item.harga_pangan,
          trend: item.trand,
          changePercentage: item.persentase,
        })),
      };

      this.setToCache(cacheKey, result, 30 * 60 * 1000);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch price changes', error);
      throw new HttpException(
        `Gagal mengambil perubahan harga hari ini: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
