import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { join, extname } from 'path';
import * as fs from 'fs';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  constructor(
    private configService: ConfigService,
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  private getBaseUrl(): string {
    const port = this.configService.get<number>('port') || 3000;
    const appUrl = process.env.APP_URL;
    if (appUrl) {
      return appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    }
    return `http://localhost:${port}`;
  }

  /**
   * Extracts filename from URL or path
   */
  private extractFileName(urlOrName: string): string {
    if (!urlOrName) return '';
    if (urlOrName.includes('/')) {
      const parts = urlOrName.split('/');
      return parts[parts.length - 1];
    }
    return urlOrName;
  }

  /**
   * Moves a file from uploads/temp to uploads/<subFolder>
   * Returns the new permanent URL.
   */
  async moveFileToPermanent(
    tempFileUrlOrName: string,
    subFolder: string,
  ): Promise<string> {
    const fileName = this.extractFileName(tempFileUrlOrName);
    if (!fileName) {
      throw new Error('Invalid file name');
    }

    const tempPath = join(this.uploadsRoot, 'temp', fileName);
    const destDir = join(this.uploadsRoot, subFolder);
    const destPath = join(destDir, fileName);

    // Ensure destination folder exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Check if file exists in temp
    if (!fs.existsSync(tempPath)) {
      // If it's already in the destination folder, return the permanent URL
      if (fs.existsSync(destPath)) {
        return `${this.getBaseUrl()}/uploads/${subFolder}/${fileName}`;
      }
      this.logger.warn(`Temporary file not found at ${tempPath}`);
      return tempFileUrlOrName;
    }

    try {
      // Move file from temp to permanent folder
      fs.renameSync(tempPath, destPath);
      this.logger.log(
        `Successfully moved temp asset ${fileName} to ${subFolder}`,
      );

      const newUrl = `${this.getBaseUrl()}/uploads/${subFolder}/${fileName}`;
      let type = 'other';
      if (subFolder === 'products') type = 'product';
      else if (subFolder === 'transactions') type = 'payment_proof';
      else if (subFolder === 'avatars') type = 'avatar';

      await this.updateAssetTypeAndUrl(fileName, type, newUrl);
      return newUrl;
    } catch (error) {
      this.logger.error(`Failed to move temp asset: ${error.message}`);
      throw error;
    }
  }

  /**
   * Uploads a temporary file to Supabase Storage
   * Returns the public URL of the uploaded file on Supabase.
   */
  async uploadToSupabase(
    tempFileUrlOrName: string,
    folder: string,
  ): Promise<string> {
    const fileName = this.extractFileName(tempFileUrlOrName);
    if (!fileName) {
      throw new Error('Invalid file name');
    }

    const tempPath = join(this.uploadsRoot, 'temp', fileName);

    // Check if temporary file exists
    if (!fs.existsSync(tempPath)) {
      this.logger.warn(`Temporary file not found at ${tempPath}`);
      return tempFileUrlOrName;
    }

    // Initialize Supabase client
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.key');
    const bucket =
      this.configService.get<string>('supabase.bucket') || 'assets';

    if (
      !supabaseUrl ||
      !supabaseKey ||
      supabaseKey === 'your_supabase_anon_or_service_role_key'
    ) {
      this.logger.warn(
        'Supabase URL or Key not configured. Falling back to local storage relocation.',
      );
      return this.moveFileToPermanent(tempFileUrlOrName, 'avatars');
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Read file buffer
      const fileBuffer = fs.readFileSync(tempPath);
      const ext = extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.pdf') contentType = 'application/pdf';

      const remotePath = `${folder}/${fileName}`;

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from(bucket)
        .upload(remotePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw new Error(`Supabase Storage upload error: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(remotePath);

      this.logger.log(
        `Successfully uploaded asset to Supabase Storage: ${urlData.publicUrl}`,
      );

      const newUrl = urlData.publicUrl;
      let type = 'other';
      if (folder === 'avatars') type = 'avatar';
      else if (folder === 'products') type = 'product';
      else if (folder === 'transactions') type = 'payment_proof';

      await this.updateAssetTypeAndUrl(fileName, type, newUrl);

      // Delete local temporary file
      try {
        fs.unlinkSync(tempPath);
        this.logger.log(`Deleted local temp file: ${tempPath}`);
      } catch (err) {
        this.logger.error(`Failed to delete local temp file: ${err.message}`);
      }

      return urlData.publicUrl;
    } catch (err) {
      this.logger.error(
        `Supabase upload failed: ${err.message}. Falling back to local storage.`,
      );
      return this.moveFileToPermanent(tempFileUrlOrName, 'avatars');
    }
  }

  /**
   * Inserts an asset record in the database global assets table.
   */
  async recordAssetInDb(data: {
    name: string;
    url: string;
    mimeType?: string;
    size?: number;
    type?: string;
    uploadedById?: string;
  }) {
    try {
      const results = await this.db
        .insert(schema.assets)
        .values({
          name: data.name,
          url: data.url,
          mimeType: data.mimeType || null,
          size: data.size || null,
          type: data.type || 'other',
          uploadedById: data.uploadedById || null,
        })
        .returning();
      this.logger.log(`Asset successfully recorded in database: ${data.name}`);
      return results[0];
    } catch (err) {
      this.logger.error(`Failed to record asset in database: ${err.message}`);
    }
  }

  /**
   * Updates an existing asset record's type, url, and user relationship in the database.
   */
  async updateAssetTypeAndUrl(
    name: string,
    type: string,
    newUrl: string,
    uploadedById?: string,
  ) {
    try {
      const results = await this.db
        .update(schema.assets)
        .set({
          type,
          url: newUrl,
          uploadedById: uploadedById || null,
        })
        .where(eq(schema.assets.name, name))
        .returning();
      this.logger.log(`Asset ${name} updated in db to type: ${type}`);
      return results[0];
    } catch (err) {
      this.logger.error(
        `Failed to update asset ${name} in database: ${err.message}`,
      );
    }
  }
}
