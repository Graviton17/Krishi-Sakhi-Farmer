import { TABLE_NAMES } from "../config";
import { ProductListing } from "../types";
import { BaseRepository } from "./BaseRepository";

export class ProductListingRepository extends BaseRepository<ProductListing> {
  constructor() {
    super(TABLE_NAMES.PRODUCT_LISTINGS);
  }

  async findByFarmer(farmerId: string): Promise<any> {
    // Simplified query without joins to test basic functionality
    try {
      return this.findWhere([
        { column: "farmer_id", operator: "eq", value: farmerId },
      ]);
    } catch (error) {
      console.error("Error in findByFarmer:", error);
      return { data: null, error };
    }
  }

  async findAvailable(): Promise<any> {
    return this.findWhere([
      { column: "status", operator: "eq", value: "available" },
    ]);
  }
}
