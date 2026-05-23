import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UsePipes,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, loginSchema } from './dto/login.dto';
import { registerSchema } from './dto/register.dto';
import { GoogleLoginDto, googleLoginSchema } from './dto/google-login.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(loginSchema))
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 201, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.pass,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'pass', 'role', 'namaLengkap'],
      properties: {
        fotoProfil: {
          type: 'string',
          format: 'binary',
          description: 'Foto profil (opsional)',
        },
        email: { type: 'string', example: 'user@example.com' },
        pass: { type: 'string', example: 'password123' },
        role: { type: 'string', enum: ['petani', 'pembeli'] },
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
  @ApiOperation({ summary: 'User registration with profile photo' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @UseInterceptors(FileInterceptor('fotoProfil', { storage: memoryStorage() }))
  async register(
    @UploadedFile() fotoProfil: Express.Multer.File,
    @Body() body: any,
  ) {
    const parsed = registerSchema.parse(body);
    return this.authService.register({ ...parsed, fotoProfil });
  }

  @Post('google')
  @UsePipes(new ZodValidationPipe(googleLoginSchema))
  @ApiOperation({ summary: 'User login/registration via Google OAuth payload' })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged in/registered via Google.',
  })
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }
}
