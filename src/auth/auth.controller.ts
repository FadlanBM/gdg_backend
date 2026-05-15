import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: { email: string; pass: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  async register(
    @Body()
    registerDto: {
      email: string;
      pass: string;
      role: 'petani' | 'pembeli';
      namaLengkap: string;
    },
  ) {
    const hashedPassword = await bcrypt.hash(registerDto.pass, 10);
    return this.authService.register({
      email: registerDto.email,
      password: hashedPassword,
      role: registerDto.role,
      namaLengkap: registerDto.namaLengkap,
    });
  }
}
