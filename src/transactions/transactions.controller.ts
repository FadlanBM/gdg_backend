import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'accepted'],
    description: 'Filter by transaction status',
  })
  findAll(@Request() req, @Query('status') status?: string) {
    return this.transactionsService.findAll(
      req.user.userId,
      req.user.role,
      status,
    );
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

  @Patch(':id/payment')
  @Roles('pembeli')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File bukti pembayaran',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Submit payment proof with file (Pembeli only)' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  submitPayment(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.transactionsService.submitPaymentProof(
      id,
      req.user.userId,
      file,
    );
  }
}
