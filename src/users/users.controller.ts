import {
  Controller,
  Get,
  Patch,
  Body,
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
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssetsService } from '../common/assets/assets.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly assetsService: AssetsService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMe(@Request() req) {
    return this.usersService.findProfileByUserId(req.user.userId);
  }

  @Patch('me')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fotoProfil: {
          type: 'string',
          format: 'binary',
          description: 'Foto profil (opsional)',
        },
        email: { type: 'string', example: 'user@example.com' },
        namaLengkap: { type: 'string', example: 'John Doe' },
        nomorTelepon: { type: 'string', example: '081234567890' },
        alamatLengkap: { type: 'string', example: 'Jl. Malioboro No. 12' },
        latitude: { type: 'number', example: -7.797068 },
        longitude: { type: 'number', example: 110.370529 },
        formattedAddress: { type: 'string' },
        googlePlaceId: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Update current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated.' })
  @UseInterceptors(FileInterceptor('fotoProfil', { storage: memoryStorage() }))
  async updateMe(
    @Request() req,
    @UploadedFile() fotoProfil: Express.Multer.File,
    @Body() body: any,
  ) {
    const userId = req.user.userId;

    if (body.email || body.pass) {
      await this.usersService.updateUser(userId, {
        email: body.email,
        password: body.pass,
      });
    }

    let uploadedFotoUrl: string | undefined;
    if (fotoProfil) {
      uploadedFotoUrl = await this.assetsService.saveFile(fotoProfil, 'avatars');
    }

    await this.usersService.updateProfile(userId, {
      namaLengkap: body.namaLengkap,
      nomorTelepon: body.nomorTelepon,
      alamatLengkap: body.alamatLengkap,
      fotoProfil: uploadedFotoUrl,
    });

    if (body.latitude !== undefined || body.longitude !== undefined) {
      await this.usersService.upsertLocation(userId, {
        latitude: body.latitude?.toString(),
        longitude: body.longitude?.toString(),
        formattedAddress: body.formattedAddress,
        googlePlaceId: body.googlePlaceId,
      });
    }

    return this.usersService.findProfileByUserId(userId);
  }
}
