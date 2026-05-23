import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
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
  @ApiOperation({ summary: 'Create a new product (Petani only)' })
  create(@Request() req, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(req.user.userId, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products (Katalog)' })
  findAll() {
    return this.productsService.findAll();
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

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('petani')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product status (Petani only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
  ) {
    return this.productsService.updateStatus(id, updateStatusDto.status);
  }
}
