import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AssetsService } from '../common/assets/assets.service';

interface ValidatedUser {
  id: string;
  email: string;
  roleId: string;
  createdAt: Date;
  role: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private assetsService: AssetsService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<ValidatedUser | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: ValidatedUser) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(data: {
    email: string;
    pass: string;
    role: 'petani' | 'pembeli';
    namaLengkap: string;
    nomorTelepon?: string;
    alamatLengkap?: string;
    fotoProfil?: string;
  }) {
    const {
      email,
      pass,
      role,
      namaLengkap,
      nomorTelepon,
      alamatLengkap,
      fotoProfil,
    } = data;

    // Check if user already exists
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    const roleRecord = await this.usersService.findRoleByName(role);
    if (!roleRecord) {
      throw new BadRequestException(`Role '${role}' not found`);
    }

    let uploadedFotoUrl: string | undefined = undefined;
    if (fotoProfil) {
      try {
        uploadedFotoUrl = await this.assetsService.uploadToSupabase(
          fotoProfil,
          'avatars',
        );
      } catch (err) {
        console.error('Failed to upload profile photo to Supabase:', err);
      }
    }

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      roleId: roleRecord.id,
    });

    await this.usersService.createProfile({
      userId: user.id,
      namaLengkap,
      nomorTelepon,
      alamatLengkap,
      fotoProfil: uploadedFotoUrl,
    });

    return {
      ...user,
      role,
    };
  }
}
