import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['namaProduk', 'deskripsi', 'stok'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'File gambar produk (bisa multiple)',
        },
        namaProduk: { type: 'string', example: 'Tomat Organik' },
        kategoriId: { type: 'string', example: 'uuid-kategori' },
        deskripsi: { type: 'string', example: 'Tomat segar' },
        harga: { type: 'number', example: 15000 },
        tipeStok: { type: 'string', example: 'kg' },
        stok: { type: 'integer', example: 100 },
      },
    },
  })
  @ApiOperation({ summary: 'Create a new product with images (Petani only)' })
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  create(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    return this.productsService.create(req.user.userId, body, files || []);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination (Katalog)' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by product name or description',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort by price (asc/desc)',
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('kategoriId') kategoriId?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.productsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      kategoriId,
      search,
      sort,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my products (Petani only)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'non-active', 'pending'],
  })
  findMyProducts(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'active' | 'non-active' | 'pending',
  ) {
    return this.productsService.findByPetani(
      req.user.userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      status,
    );
  }

  @Post('analyze-price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani', 'admin')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Analisis harga & kualitas produk dari multiple gambar menggunakan AI Vision (Petani/Admin)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['images'],
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Gambar produk (min 1, maks 10 gambar | jpg/jpeg/png/webp | maks 10MB/gambar)',
        },
        productName: { type: 'string', example: 'Mangga Harum Manis' },
        category: { type: 'string', example: 'Buah' },
        location: { type: 'string', example: 'Yogyakarta' },
        additionalContext: { type: 'string', example: 'Dipanen kemarin pagi' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  analyzePriceWithImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('productName') productName?: string,
    @Body('category') category?: string,
    @Body('location') location?: string,
    @Body('additionalContext') additionalContext?: string,
  ) {
    return this.productsService.analyzePriceWithImages({
      files: files || [],
      productName,
      category,
      location,
      additionalContext,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post('generate-description')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Generate AI product description from image (Petani only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['namaProduk', 'kategoriId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Gambar produk',
        },
        namaProduk: { type: 'string', example: 'Tomat Organik' },
        kategoriId: { type: 'string', example: 'uuid-kategori' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('file', 1, { storage: memoryStorage() }))
  generateDescription(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('namaProduk') namaProduk: string,
    @Body('kategoriId') kategoriId: string,
  ) {
    return this.productsService.generateDescription(
      req.user.userId,
      namaProduk,
      kategoriId,
      files || [],
    );
  }

  @Post(':id/analyze')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run AI Analysis for a product (Petani only)' })
  analyze(@Param('id') id: string) {
    return this.productsService.analyze(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (Owner only)' })
  remove(@Request() req, @Param('id') id: string) {
    return this.productsService.remove(req.user.userId, id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product status (Petani only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'non-active'],
          example: 'active',
        },
      },
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'non-active',
  ) {
    return this.productsService.updateStatus(id, status);
  }
}
