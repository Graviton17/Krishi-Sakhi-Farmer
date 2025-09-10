import { supabase } from "../../lib/supabase/client";
import { TABLE_NAMES } from "../config";
import { logger } from "../logger";
import { Order } from "../types";
import { BaseRepository } from "./BaseRepository";

export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(TABLE_NAMES.ORDERS);
  }

  async findByBuyer(buyerId: string): Promise<any> {
    return this.findWhere([
      { column: "buyer_id", operator: "eq", value: buyerId },
    ]);
  }

  async findByStatus(status: string): Promise<any> {
    return this.findWhere([
      { column: "status", operator: "eq", value: status },
    ]);
  }

  /**
   * Find orders by seller (farmer) through order_items -> product_listings
   */
  async findBySeller(sellerId: string): Promise<any> {
    try {
      this.logOperation("findBySeller", this.tableName, { sellerId });

      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          order_items!inner(
            id,
            quantity,
            price_at_purchase,
            listing:product_listings!inner(
              id,
              farmer_id,
              product:products(
                id,
                name,
                category
              )
            )
          )
        `
        )
        .eq("order_items.product_listings.farmer_id", sellerId)
        .order("created_at", { ascending: false });

      logger.debug(`findBySeller completed`, {
        table: this.tableName,
        sellerId,
        resultCount: data?.length || 0,
        success: !error,
      });

      return { data, error };
    } catch (error) {
      return this.handleError(error, "findBySeller");
    }
  }
}
