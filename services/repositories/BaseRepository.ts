/**
 * Base Repository class following the Repository pattern
 * Provides data access abstraction and centralized database operations
 */

import { supabase } from "../../lib/supabase/client";
import { ERROR_CODE_MAPPINGS } from "../config";
import { logger } from "../logger";
import {
    FilterOptions,
    IRepository,
    QueryOptions,
    ServiceErrorCode,
    SortOptions,
} from "../types";

export abstract class BaseRepository<T = any> implements IRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Apply filters to a query builder
   */
  protected applyFilters(queryBuilder: any, filters?: FilterOptions[]): any {
    if (!filters?.length) return queryBuilder;

    filters.forEach((filter) => {
      switch (filter.operator) {
        case "eq":
          queryBuilder = queryBuilder.eq(filter.column, filter.value);
          break;
        case "neq":
          queryBuilder = queryBuilder.neq(filter.column, filter.value);
          break;
        case "gt":
          queryBuilder = queryBuilder.gt(filter.column, filter.value);
          break;
        case "gte":
          queryBuilder = queryBuilder.gte(filter.column, filter.value);
          break;
        case "lt":
          queryBuilder = queryBuilder.lt(filter.column, filter.value);
          break;
        case "lte":
          queryBuilder = queryBuilder.lte(filter.column, filter.value);
          break;
        case "like":
          queryBuilder = queryBuilder.like(filter.column, filter.value);
          break;
        case "ilike":
          queryBuilder = queryBuilder.ilike(filter.column, filter.value);
          break;
        case "in":
          queryBuilder = queryBuilder.in(filter.column, filter.value);
          break;
        case "is":
          queryBuilder = queryBuilder.is(filter.column, filter.value);
          break;
      }
    });

    return queryBuilder;
  }

  /**
   * Apply sorting to a query builder
   */
  protected applySorting(queryBuilder: any, sorts?: SortOptions[]): any {
    if (!sorts?.length) return queryBuilder;

    sorts.forEach((sort) => {
      queryBuilder = queryBuilder.order(sort.column, {
        ascending: sort.ascending,
      });
    });

    return queryBuilder;
  }

  /**
   * Apply pagination to a query builder
   */
  protected applyPagination(queryBuilder: any, options?: QueryOptions): any {
    if (!options?.pagination) return queryBuilder;

    const { page, limit } = options.pagination;
    const from = page * limit;
    const to = from + limit - 1;

    return queryBuilder.range(from, to);
  }

  /**
   * Log database operations for monitoring
   */
  protected logOperation(
    operation: string,
    tableName: string,
    context?: any
  ): void {
    logger.debug(`Database ${operation}`, {
      table: tableName,
      ...context,
    });
  }

  /**
   * Handle database errors consistently
   */
  protected handleError(error: any, operation: string) {
    const errorCode = error.code || "UNKNOWN";
    const mappedCode =
      ERROR_CODE_MAPPINGS[errorCode as keyof typeof ERROR_CODE_MAPPINGS] ||
      ServiceErrorCode.INTERNAL_ERROR;

    logger.error(`Database ${operation} failed`, error, {
      table: this.tableName,
      errorCode,
      mappedCode,
    });

    return {
      data: null,
      error: {
        message: error.message || 'An unknown error occurred',
        code: mappedCode
      },
      count: null
    };
  }

  async findAll(options?: QueryOptions): Promise<any> {
    try {
      this.logOperation("findAll", this.tableName, { options });

      let queryBuilder = supabase
        .from(this.tableName)
        .select(options?.select || "*", { count: "exact" });

      // Apply filters, sorting, and pagination
      queryBuilder = this.applyFilters(queryBuilder, options?.filters);
      queryBuilder = this.applySorting(queryBuilder, options?.sorts);
      queryBuilder = this.applyPagination(queryBuilder, options);

      const result = await queryBuilder;

      logger.debug(`findAll completed`, {
        table: this.tableName,
        count: result.count,
        success: !result.error,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "findAll");
    }
  }

  async findById(id: string): Promise<any> {
    try {
      this.logOperation("findById", this.tableName, { id });

      const result = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id)
        .single();

      logger.debug(`findById completed`, {
        table: this.tableName,
        id,
        found: !!result.data,
        success: !result.error,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "findById");
    }
  }

  async findWhere(filters: FilterOptions[]): Promise<any> {
    try {
      this.logOperation("findWhere", this.tableName, { filters });

      let queryBuilder = supabase.from(this.tableName).select("*");
      queryBuilder = this.applyFilters(queryBuilder, filters);

      const result = await queryBuilder;

      logger.debug(`findWhere completed`, {
        table: this.tableName,
        filterCount: filters.length,
        resultCount: result.data?.length || 0,
        success: !result.error,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "findWhere");
    }
  }

  async create(data: any): Promise<any> {
    try {
      this.logOperation("create", this.tableName, { hasData: !!data });

      const result = await supabase
        .from(this.tableName)
        .insert(data as never)
        .select()
        .single();

      logger.debug(`create completed`, {
        table: this.tableName,
        success: !result.error,
        createdId: (result.data as any)?.id,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "create");
    }
  }

  async update(id: string, data: any): Promise<any> {
    try {
      this.logOperation("update", this.tableName, { id, hasData: !!data });

      const result = await supabase
        .from(this.tableName)
        .update(data as never)
        .eq("id", id)
        .select()
        .single();

      logger.debug(`update completed`, {
        table: this.tableName,
        id,
        success: !result.error,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "update");
    }
  }

  async delete(id: string): Promise<any> {
    try {
      this.logOperation("delete", this.tableName, { id });

      const result = await supabase.from(this.tableName).delete().eq("id", id);

      logger.debug(`delete completed`, {
        table: this.tableName,
        id,
        success: !result.error,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "delete");
    }
  }

  async count(filters?: FilterOptions[]): Promise<any> {
    try {
      this.logOperation("count", this.tableName, { filters });

      let queryBuilder = supabase
        .from(this.tableName)
        .select("*", { count: "exact", head: true });

      if (filters?.length) {
        queryBuilder = this.applyFilters(queryBuilder, filters);
      }

      const result = await queryBuilder;

      logger.debug(`count completed`, {
        table: this.tableName,
        count: result.count,
        success: !result.error,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "count");
    }
  }

  /**
   * Perform a raw query with custom select
   */
  async query(selectQuery: string, filters?: FilterOptions[]): Promise<any> {
    try {
      this.logOperation("query", this.tableName, { selectQuery, filters });

      let queryBuilder = supabase.from(this.tableName).select(selectQuery);

      if (filters?.length) {
        queryBuilder = this.applyFilters(queryBuilder, filters);
      }

      const result = await queryBuilder;

      logger.debug(`query completed`, {
        table: this.tableName,
        selectQuery,
        resultCount: result.data?.length || 0,
        success: !result.error,
      });

      return result;
    } catch (error) {
      return this.handleError(error, "query");
    }
  }
}
