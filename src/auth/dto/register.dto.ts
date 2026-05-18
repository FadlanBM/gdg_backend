import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @MinLength(6)
  pass: string;

  @ApiProperty({
    example: 'pembeli',
    enum: ['petani', 'pembeli'],
    description: 'User role',
  })
  role: 'petani' | 'pembeli';

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  namaLengkap: string;

  @ApiProperty({
    example: '081234567890',
    description: 'User phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  nomorTelepon?: string;

  @ApiProperty({
    example: 'Jl. Malioboro No. 12, Yogyakarta',
    description: 'User full address',
    required: false,
  })
  @IsString()
  @IsOptional()
  alamatLengkap?: string;
}
