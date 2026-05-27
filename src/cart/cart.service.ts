import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async addToCart(pembeliId: string, dto: AddToCartDto) {
    // Check if item already in cart
    const existing = await this.db
      .select()
      .from(schema.carts)
      .where(
        and(
          eq(schema.carts.pembeliId, pembeliId),
          eq(schema.carts.productId, dto.productId),
          eq(schema.carts.isCheckout, false),
        ),
      );

    if (existing.length > 0) {
      const results = await this.db
        .update(schema.carts)
        .set({ jumlah: existing[0].jumlah + dto.jumlah })
        .where(eq(schema.carts.id, existing[0].id))
        .returning();
      return results[0];
    }

    const results = await this.db
      .insert(schema.carts)
      .values({
        pembeliId,
        productId: dto.productId,
        jumlah: dto.jumlah,
      })
      .returning();
    return results[0];
  }

  async getCart(pembeliId: string) {
    return this.db.query.carts.findMany({
      where: and(
        eq(schema.carts.pembeliId, pembeliId),
        eq(schema.carts.isCheckout, false),
      ),
      with: {
        product: {
          with: {
            petani: {
              with: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async updateQuantity(id: string, dto: UpdateCartDto) {
    const results = await this.db
      .update(schema.carts)
      .set({ jumlah: dto.jumlah })
      .where(eq(schema.carts.id, id))
      .returning();

    if (results.length === 0) {
      throw new NotFoundException('Cart item not found');
    }
    return results[0];
  }

  async remove(id: string) {
    const results = await this.db
      .delete(schema.carts)
      .where(eq(schema.carts.id, id))
      .returning();

    if (results.length === 0) {
      throw new NotFoundException('Cart item not found');
    }
    return results[0];
  }
}
