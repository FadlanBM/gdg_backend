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
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
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

  async googleLogin(data: {
    email: string;
    googleId: string;
    namaLengkap: string;
    fotoProfil?: string;
    role?: 'petani' | 'pembeli';
  }) {
    const { email, googleId, namaLengkap, fotoProfil, role = 'pembeli' } = data;

    // 1. Check if user already exists by googleId
    const user = await this.usersService.findOneByGoogleId(googleId);

    if (user) {
      return this.login({
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        createdAt: user.createdAt,
        role: user.role,
      });
    }

    // 2. Check if user already exists by email (but googleId is not linked yet)
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      // Link the account to googleId
      await this.usersService.updateGoogleId(existingUser.id, googleId);
      
      return this.login({
        id: existingUser.id,
        email: existingUser.email,
        roleId: existingUser.roleId,
        createdAt: existingUser.createdAt,
        role: existingUser.role,
      });
    }

    // 3. User does not exist, so register automatically
    const roleRecord = await this.usersService.findRoleByName(role);
    if (!roleRecord) {
      throw new BadRequestException(`Role '${role}' not found`);
    }

    // Register user record (without password since they use OAuth)
    const newUser = await this.usersService.create({
      email,
      googleId,
      roleId: roleRecord.id,
    });

    // Create profile
    await this.usersService.createProfile({
      userId: newUser.id,
      namaLengkap,
      fotoProfil,
    });

    // Login and return access token
    return this.login({
      id: newUser.id,
      email: newUser.email,
      roleId: newUser.roleId,
      createdAt: newUser.createdAt,
      role,
    });
  }
}
