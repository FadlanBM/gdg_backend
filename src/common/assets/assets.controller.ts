import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ConfigService } from '@nestjs/config';
import { AssetsService } from './assets.service';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(
    private configService: ConfigService,
    private assetsService: AssetsService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload an asset temporarily' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload temporarily (Max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The asset has been successfully uploaded temporarily.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'temp-1715967000-4716.png' },
        url: {
          type: 'string',
          example:
            'http://localhost:3000/uploads/temp/temp-1715967000-4716.png',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const tempDir = process.env.VERCEL
            ? '/tmp'
            : join(process.cwd(), 'uploads/temp');
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `temp-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const port = this.configService.get<number>('port') || 3000;
    const appUrl = process.env.APP_URL;
    const baseUrl = appUrl
      ? appUrl.endsWith('/')
        ? appUrl.slice(0, -1)
        : appUrl
      : `http://localhost:${port}`;

    const fileUrl = `${baseUrl}/uploads/temp/${file.filename}`;

    // Record the upload in the database global assets table
    await this.assetsService.recordAssetInDb({
      name: file.filename,
      url: fileUrl,
      mimeType: file.mimetype,
      size: file.size,
      type: 'temp',
    });

    return {
      name: file.filename,
      url: fileUrl,
    };
  }
}
