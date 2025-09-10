import { TABLE_NAMES } from "../config";
import { OrderItem } from "../types";
import { BaseRepository } from "./BaseRepository";

export class OrderItemsRepository extends BaseRepository<OrderItem> {
  constructor() {
    super(TABLE_NAMES.ORDER_ITEMS);
  }

  async findByOrder(orderId: string): Promise<any> {
    return this.findWhere([
      { column: "order_id", operator: "eq", value: orderId },
    ]);
  }

  async findByListing(listingId: string): Promise<any> {
    return this.findWhere([
      { column: "listing_id", operator: "eq", value: listingId },
    ]);
  }

  async calculateOrderTotal(orderId: string): Promise<any> {
    return this.query("SUM(quantity * price_at_purchase) as total", [
      { column: "order_id", operator: "eq", value: orderId },
    ]);
  }
}
