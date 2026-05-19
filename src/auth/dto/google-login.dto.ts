import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const googleLoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  googleId: z.string().min(1, 'Google ID harus diisi'),
  namaLengkap: z.string().min(1, 'Nama lengkap harus diisi'),
  fotoProfil: z.string().optional(),
  role: z.enum(['petani', 'pembeli']).optional().default('pembeli'),
});

export class GoogleLoginDto {
  @ApiProperty({ example: 'user@gmail.com', description: 'Google account email' })
  email: string;

  @ApiProperty({ example: '10928301293810239', description: 'Google unique sub/identifier' })
  googleId: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name from Google profile' })
  namaLengkap: string;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/...',
    description: 'User avatar image URL from Google profile',
    required: false,
  })
  fotoProfil?: string;

  @ApiProperty({
    example: 'pembeli',
    enum: ['petani', 'pembeli'],
    description: 'User role to assign if registering for the first time',
    required: false,
    default: 'pembeli',
  })
  role?: 'petani' | 'pembeli';
}
