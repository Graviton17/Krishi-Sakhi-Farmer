import { TABLE_NAMES } from "../config";
import { EnhancedBaseService } from "../database";
import { ProductRepository } from "../repositories";
import {
  FilterOptions,
  IProductService,
  Product,
  ServiceResponse,
} from "../types";

/**
 * Enhanced Product Service with business logic
 */
export class ProductService
  extends EnhancedBaseService<Product>
  implements IProductService
{
  constructor() {
    super(new ProductRepository(), "Product");
  }

  protected getTableName(): string {
    return TABLE_NAMES.PRODUCTS;
  }

  async getByCategory(category: string): Promise<ServiceResponse<Product[]>> {
    try {
      this.logBusinessEvent("getByCategory", { category });

      const filters: FilterOptions[] = [
        { column: "category", operator: "eq", value: category },
      ];

      const result = await this.repository.findWhere(filters);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "getByCategory"
        );
        return this.createResponse<Product[]>(null, serviceError);
      }

      return this.createResponse<Product[]>(result.data || [], null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getByCategory");
      return this.createResponse<Product[]>(null, serviceError);
    }
  }

  async searchProducts(query: string): Promise<ServiceResponse<Product[]>> {
    try {
      this.logBusinessEvent("searchProducts", { query });

      const filters: FilterOptions[] = [
        { column: "name", operator: "ilike", value: `%${query}%` },
      ];

      const result = await this.repository.findWhere(filters);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "searchProducts"
        );
        return this.createResponse<Product[]>(null, serviceError);
      }

      return this.createResponse<Product[]>(result.data || [], null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "searchProducts");
      return this.createResponse<Product[]>(null, serviceError);
    }
  }

  async getByFarmer(farmerId: string): Promise<ServiceResponse<Product[]>> {
    try {
      this.logBusinessEvent("getByFarmer", { farmerId });

      // Use the ProductRepository's enhanced method
      const productRepository = this.repository as ProductRepository;
      const result = await productRepository.findByFarmer(farmerId);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "getByFarmer"
        );
        return this.createResponse<Product[]>(null, serviceError);
      }

      return this.createResponse<Product[]>(result.data || [], null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getByFarmer");
      return this.createResponse<Product[]>(null, serviceError);
    }
  }
}
