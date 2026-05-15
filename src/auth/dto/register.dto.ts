import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  pass: string;

  @ApiProperty({ example: 'pembeli', enum: ['petani', 'pembeli'], description: 'User role' })
  role: 'petani' | 'pembeli';

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  namaLengkap: string;
}
