import { TABLE_NAMES } from "../config";
import { ProductListing } from "../types";
import { BaseRepository } from "./BaseRepository";

export class ProductListingRepository extends BaseRepository<ProductListing> {
  constructor() {
    super(TABLE_NAMES.PRODUCT_LISTINGS);
  }

  async findByFarmer(farmerId: string): Promise<any> {
    return this.query(
      `
        *,
        products (
          id,
          name,
          description,
          category,
          image_url
        ),
        quality_reports (
          ai_score,
          notes
        )
      `,
      [{ column: "farmer_id", operator: "eq", value: farmerId }]
    );
  }

  async findAvailable(): Promise<any> {
    return this.findWhere([
      { column: "status", operator: "eq", value: "available" },
    ]);
  }
}
