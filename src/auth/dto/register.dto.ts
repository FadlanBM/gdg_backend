import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  pass: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['petani', 'pembeli'], {
    message: "Role harus berupa 'petani' atau 'pembeli'",
  }),
  namaLengkap: z.string().min(1, 'Nama lengkap harus diisi'),
  nomorTelepon: z.string().optional(),
  alamatLengkap: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  formattedAddress: z.string().optional(),
  googlePlaceId: z.string().optional(),
});

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  pass: string;

  @ApiProperty({
    example: 'pembeli',
    enum: ['petani', 'pembeli'],
    description: 'User role',
  })
  role: 'petani' | 'pembeli';

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  namaLengkap: string;

  @ApiProperty({
    example: '081234567890',
    description: 'User phone number',
    required: false,
  })
  nomorTelepon?: string;

  @ApiProperty({
    example: 'Jl. Malioboro No. 12, Yogyakarta',
    description: 'User full address',
    required: false,
  })
  alamatLengkap?: string;

  @ApiProperty({
    example: -7.797068,
    description: 'Latitude coordinate from Google Maps',
    required: false,
  })
  latitude?: number;

  @ApiProperty({
    example: 110.370529,
    description: 'Longitude coordinate from Google Maps',
    required: false,
  })
  longitude?: number;

  @ApiProperty({
    example: 'Jl. Malioboro No. 12, Yogyakarta',
    description: 'Formatted address string returned from Google Maps',
    required: false,
  })
  formattedAddress?: string;

  @ApiProperty({
    example: 'ChIJz2x03FpYei4R1...',
    description: 'Google Place ID from Google Maps response',
    required: false,
  })
  googlePlaceId?: string;
}
