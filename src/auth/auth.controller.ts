import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, loginSchema } from './dto/login.dto';
import { RegisterDto, registerSchema } from './dto/register.dto';
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
  @UsePipes(new ZodValidationPipe(registerSchema))
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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
