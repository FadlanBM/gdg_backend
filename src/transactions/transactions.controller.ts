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
import { TransactionsService } from './transactions.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('checkout')
  @Roles('pembeli')
  @ApiOperation({ summary: 'Checkout cart items (Pembeli only)' })
  checkout(@Request() req, @Body() dto: CheckoutDto) {
    return this.transactionsService.checkout(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  findAll(@Request() req) {
    return this.transactionsService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction details' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('petani')
  @ApiOperation({ summary: 'Update order status (Petani only)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'diproses' | 'dikirim' | 'selesai',
  ) {
    return this.transactionsService.updateStatus(id, status);
  }
}
