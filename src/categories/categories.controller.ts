import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat kategori baru (Admin/Petani)' })
  @ApiResponse({ status: 201, description: 'Kategori berhasil dibuat' })
  @ApiResponse({ status: 409, description: 'Kategori sudah ada' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Ambil semua kategori' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil kategori berdasarkan ID' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }



  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update kategori (Admin/Petani)' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Kategori sudah ada' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus kategori (Admin/Petani)' })
  @ApiResponse({ status: 200, description: 'Kategori berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
