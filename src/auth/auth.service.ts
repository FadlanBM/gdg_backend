import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

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
  }) {
    const { email, pass, role, namaLengkap, nomorTelepon, alamatLengkap } =
      data;
    const hashedPassword = await bcrypt.hash(pass, 10);

    const roleRecord = await this.usersService.findRoleByName(role);
    if (!roleRecord) {
      throw new BadRequestException(`Role '${role}' not found`);
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
    });

    return {
      ...user,
      role,
    };
  }
}
