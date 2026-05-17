import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @Roles('pembeli')
  @ApiOperation({ summary: 'Add item to cart (Pembeli only)' })
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, dto);
  }

  @Get()
  @Roles('pembeli')
  @ApiOperation({ summary: 'Get current cart items (Pembeli only)' })
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Patch(':id')
  @Roles('pembeli')
  @ApiOperation({ summary: 'Update cart item quantity (Pembeli only)' })
  updateQuantity(@Param('id') id: string, @Body() dto: UpdateCartDto) {
    return this.cartService.updateQuantity(id, dto);
  }

  @Delete(':id')
  @Roles('pembeli')
  @ApiOperation({ summary: 'Remove item from cart (Pembeli only)' })
  remove(@Param('id') id: string) {
    return this.cartService.remove(id);
  }
}
