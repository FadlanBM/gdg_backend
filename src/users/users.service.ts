import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async findOneByEmail(email: string) {
    const results = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    
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
}
