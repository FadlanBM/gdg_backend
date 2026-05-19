import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Google ID Token harus diisi'),
  role: z.enum(['petani', 'pembeli']).optional().default('pembeli'),
});

export class GoogleLoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIs...',
    description: 'Google ID Token (JWT) obtained from Google Sign-In frontend',
  })
  idToken: string;

  @ApiProperty({
    example: 'pembeli',
    enum: ['petani', 'pembeli'],
    description: 'User role to assign if registering for the first time',
    required: false,
    default: 'pembeli',
  })
  role?: 'petani' | 'pembeli';
}
