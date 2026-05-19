import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

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

  async updateGoogleId(userId: string, googleId: string) {
    const results = await this.db
      .update(schema.users)
      .set({ googleId })
      .where(eq(schema.users.id, userId))
      .returning();
    return results[0];
  }
}
