import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async create(dto: CreateCategoryDto) {
    try {
      const results = await this.db
        .insert(schema.categories)
        .values(dto)
        .returning();
      return results[0];
    } catch (e) {
      if (e.code === '23505') {
        throw new ConflictException('Kategori dengan nama tersebut sudah ada');
      }
      throw e;
    }
  }

  async findAll() {
    return this.db
      .select()
      .from(schema.categories)
      .orderBy(schema.categories.createdAt);
  }

  async findOne(id: string) {
    const results = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id));

    if (results.length === 0) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }
    return results[0];
  }

  async update(id: string, dto: UpdateCategoryDto) {
    try {
      const results = await this.db
        .update(schema.categories)
        .set(dto)
        .where(eq(schema.categories.id, id))
        .returning();

      if (results.length === 0) {
        throw new NotFoundException('Kategori tidak ditemukan');
      }
      return results[0];
    } catch (e) {
      if (e.code === '23505') {
        throw new ConflictException('Kategori dengan nama tersebut sudah ada');
      }
      throw e;
    }
  }

  async remove(id: string) {
    const results = await this.db
      .delete(schema.categories)
      .where(eq(schema.categories.id, id))
      .returning();

    if (results.length === 0) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }
    return { message: 'Kategori berhasil dihapus' };
  }
}
