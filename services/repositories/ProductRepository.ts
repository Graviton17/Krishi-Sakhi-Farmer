import { supabase } from "../../lib/supabase/client";
import { TABLE_NAMES } from "../config";
import { logger } from "../logger";
import { Product } from "../types";
import { BaseRepository } from "./BaseRepository";

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super(TABLE_NAMES.PRODUCTS);
  }

  async findByCategory(category: string): Promise<any> {
    return this.findWhere([
      { column: "category", operator: "eq", value: category },
    ]);
  }

  async searchByName(query: string): Promise<any> {
    return this.findWhere([
      { column: "name", operator: "ilike", value: `%${query}%` },
    ]);
  }

  /**
   * Find products by farmer through product_listings
   */
  async findByFarmer(farmerId: string): Promise<any> {
    try {
      this.logOperation("findByFarmer", this.tableName, { farmerId });

      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          product_listings!inner(
            id,
            farmer_id,
            quantity_available,
            unit_of_measure,
            price_per_unit,
            status,
            harvest_date
          )
        `
        )
        .eq("product_listings.farmer_id", farmerId);

      logger.debug(`findByFarmer completed`, {
        table: this.tableName,
        farmerId,
        resultCount: data?.length || 0,
        success: !error,
      });

      return { data, error };
    } catch (error) {
      return this.handleError(error, "findByFarmer");
    }
  }
}
