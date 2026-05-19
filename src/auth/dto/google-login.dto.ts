import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Google ID Token harus diisi'),
});

export class GoogleLoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIs...',
    description: 'Google ID Token (JWT) obtained from Google Sign-In frontend',
  })
  idToken: string;
}
