import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async findOneByEmail(email: string) {
    const results = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        password: schema.users.password,
        googleId: schema.users.googleId,
        roleId: schema.users.roleId,
        createdAt: schema.users.createdAt,
        role: schema.roles.name,
      })
      .from(schema.users)
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.email, email));

    return results[0];
  }

  async findOneByGoogleId(googleId: string) {
    const results = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        password: schema.users.password,
        googleId: schema.users.googleId,
        roleId: schema.users.roleId,
        createdAt: schema.users.createdAt,
        role: schema.roles.name,
      })
      .from(schema.users)
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.googleId, googleId));

    return results[0];
  }

  async findRoleByName(name: string) {
    const results = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, name));
    return results[0];
  }

  async create(user: typeof schema.users.$inferInsert) {
    const results = await this.db.insert(schema.users).values(user).returning();
    return results[0];
  }

  async createProfile(profile: typeof schema.profiles.$inferInsert) {
    const results = await this.db
      .insert(schema.profiles)
      .values(profile)
      .returning();
    return results[0];
  }

  async createLocation(location: typeof schema.userLocations.$inferInsert) {
    const results = await this.db
      .insert(schema.userLocations)
      .values(location)
      .returning();
    return results[0];
  }

  async findProfileByUserId(userId: string) {
    const results = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        role: schema.roles.name,
        profile: {
          id: schema.profiles.id,
          namaLengkap: schema.profiles.namaLengkap,
          nomorTelepon: schema.profiles.nomorTelepon,
          alamatLengkap: schema.profiles.alamatLengkap,
          titikLokasi: schema.profiles.titikLokasi,
          fotoProfil: schema.profiles.fotoProfil,
          updatedAt: schema.profiles.updatedAt,
        },
        location: {
          id: schema.userLocations.id,
          latitude: schema.userLocations.latitude,
          longitude: schema.userLocations.longitude,
          formattedAddress: schema.userLocations.formattedAddress,
          googlePlaceId: schema.userLocations.googlePlaceId,
          createdAt: schema.userLocations.createdAt,
        },
      })
      .from(schema.users)
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
      .leftJoin(
        schema.userLocations,
        eq(schema.users.id, schema.userLocations.userId),
      )
      .where(eq(schema.users.id, userId));

    return results[0];
  }

  async findByRole(roleName: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const baseQuery = this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        profile: {
          id: schema.profiles.id,
          namaLengkap: schema.profiles.namaLengkap,
          nomorTelepon: schema.profiles.nomorTelepon,
          alamatLengkap: schema.profiles.alamatLengkap,
          titikLokasi: schema.profiles.titikLokasi,
          fotoProfil: schema.profiles.fotoProfil,
        },
        location: {
          id: schema.userLocations.id,
          latitude: schema.userLocations.latitude,
          longitude: schema.userLocations.longitude,
          formattedAddress: schema.userLocations.formattedAddress,
          googlePlaceId: schema.userLocations.googlePlaceId,
        },
      })
      .from(schema.users)
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .leftJoin(schema.profiles, eq(schema.users.id, schema.profiles.userId))
      .leftJoin(
        schema.userLocations,
        eq(schema.users.id, schema.userLocations.userId),
      )
      .where(eq(schema.roles.name, roleName));

    const countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.roles.name, roleName));

    const [data, totalResult] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      countQuery,
    ]);

    const total = Number(totalResult[0]?.count) || 0;

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateGoogleId(userId: string, googleId: string) {
    const results = await this.db
      .update(schema.users)
      .set({ googleId })
      .where(eq(schema.users.id, userId))
      .returning();
    return results[0];
  }

  async updateUser(
    userId: string,
    data: { email?: string; password?: string },
  ) {
    if (data.email) {
      const existing = await this.findOneByEmail(data.email);
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: Record<string, any> = {};
    if (data.email) updateData.email = data.email;
    if (data.password)
      updateData.password = await bcrypt.hash(data.password, 10);

    if (Object.keys(updateData).length === 0) return null;

    const results = await this.db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId))
      .returning();
    if (results.length === 0) throw new NotFoundException('User not found');
    return results[0];
  }

  async updateProfile(
    userId: string,
    data: {
      namaLengkap?: string;
      nomorTelepon?: string;
      alamatLengkap?: string;
      fotoProfil?: string;
    },
  ) {
    const existing = await this.db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId));

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );

    if (existing.length > 0) {
      if (Object.keys(cleanData).length === 0) return existing[0];
      const results = await this.db
        .update(schema.profiles)
        .set({ ...cleanData, updatedAt: new Date() })
        .where(eq(schema.profiles.userId, userId))
        .returning();
      return results[0];
    }

    if (!cleanData.namaLengkap) return null;

    const results = await this.db
      .insert(schema.profiles)
      .values({
        userId,
        namaLengkap: cleanData.namaLengkap,
        ...cleanData,
      } as any)
      .returning();
    return results[0];
  }

  async upsertLocation(
    userId: string,
    data: {
      latitude?: string;
      longitude?: string;
      formattedAddress?: string;
      googlePlaceId?: string;
    },
  ) {
    if (data.latitude === undefined && data.longitude === undefined)
      return null;

    const existing = await this.db
      .select()
      .from(schema.userLocations)
      .where(eq(schema.userLocations.userId, userId));

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined),
    );

    if (existing.length > 0) {
      const results = await this.db
        .update(schema.userLocations)
        .set(cleanData)
        .where(eq(schema.userLocations.userId, userId))
        .returning();
      return results[0];
    }

    const results = await this.db
      .insert(schema.userLocations)
      .values({ userId, ...cleanData } as any)
      .returning();
    return results[0];
  }
}
