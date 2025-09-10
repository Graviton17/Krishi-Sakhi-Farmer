import { TABLE_NAMES } from "../config";
import { EnhancedBaseService } from "../database";
import { OrderRepository } from "../repositories";
import { FilterOptions, IOrderService, Order, ServiceResponse } from "../types";

/**
 * Enhanced Order Service with business logic
 */
export class OrderService
  extends EnhancedBaseService<Order>
  implements IOrderService
{
  constructor() {
    super(new OrderRepository(), "Order");
  }

  protected getTableName(): string {
    return TABLE_NAMES.ORDERS;
  }

  async getByBuyer(buyerId: string): Promise<ServiceResponse<Order[]>> {
    try {
      this.logBusinessEvent("getByBuyer", { buyerId });

      const filters: FilterOptions[] = [
        { column: "buyer_id", operator: "eq", value: buyerId },
      ];

      const result = await this.repository.findWhere(filters);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "getByBuyer"
        );
        return this.createResponse<Order[]>(null, serviceError);
      }

      return this.createResponse<Order[]>(result.data || [], null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getByBuyer");
      return this.createResponse<Order[]>(null, serviceError);
    }
  }

  async getBySeller(sellerId: string): Promise<ServiceResponse<Order[]>> {
    try {
      this.logBusinessEvent("getBySeller", { sellerId });

      // Use the OrderRepository's enhanced method
      const orderRepository = this.repository as OrderRepository;
      const result = await orderRepository.findBySeller(sellerId);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "getBySeller"
        );
        return this.createResponse<Order[]>(null, serviceError);
      }

      return this.createResponse<Order[]>(result.data || [], null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getBySeller");
      return this.createResponse<Order[]>(null, serviceError);
    }
  }

  async updateStatus(
    id: string,
    status: string
  ): Promise<ServiceResponse<Order>> {
    try {
      this.logBusinessEvent("updateStatus", { id, status });

      const updateData = { status };
      return await this.update(id, updateData as Partial<Order>);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "updateStatus");
      return this.createResponse<Order>(null, serviceError);
    }
  }

  async getByStatus(status: string): Promise<ServiceResponse<Order[]>> {
    try {
      this.logBusinessEvent("getByStatus", { status });

      const filters: FilterOptions[] = [
        { column: "status", operator: "eq", value: status },
      ];

      const result = await this.repository.findWhere(filters);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "getByStatus"
        );
        return this.createResponse<Order[]>(null, serviceError);
      }

      return this.createResponse<Order[]>(result.data || [], null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getByStatus");
      return this.createResponse<Order[]>(null, serviceError);
    }
  }
}
