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
  @ApiQuery({ name: 'search', required: false, description: 'Search by product name or description' })
  @ApiQuery({ name: 'hargaMin', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'hargaMax', required: false, description: 'Maximum price filter' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('kategoriId') kategoriId?: string,
    @Query('search') search?: string,
    @Query('hargaMin') hargaMin?: string,
    @Query('hargaMax') hargaMax?: string,
  ) {
    return this.productsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      kategoriId,
      search,
      hargaMin ? Number(hargaMin) : undefined,
      hargaMax ? Number(hargaMax) : undefined,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my products (Petani only)' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'non-active', 'pending'] })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get product details' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
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
