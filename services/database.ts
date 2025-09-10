/**
 * Enhanced base service class following industrial standard practices
 * Implements the Service Layer pattern with proper error handling, validation, and logging
 */

import { RESPONSE_MESSAGES, serviceConfig } from "./config";
import { logger } from "./logger";
import { BaseRepository } from "./repositories";
import {
  IBaseService,
  QueryOptions,
  ResponseMetadata,
  ServiceError,
  ServiceErrorCode,
  ServiceResponse,
  ValidationResult,
} from "./types";
import { ValidatorFactory } from "./validators";

export abstract class EnhancedBaseService<T = any> implements IBaseService<T> {
  protected repository: BaseRepository<T>;
  protected validator = ValidatorFactory.getBaseValidator<T>(
    this.getTableName()
  );
  protected entityName: string;

  constructor(repository: BaseRepository<T>, entityName: string) {
    this.repository = repository;
    this.entityName = entityName;
  }

  protected abstract getTableName(): string;

  /**
   * Create a standardized service response
   */
  protected createResponse<TData = T>(
    data: TData | null,
    error: ServiceError | null = null,
    message?: string,
    metadata?: ResponseMetadata
  ): ServiceResponse<TData> {
    return {
      data,
      error,
      success: !error,
      message:
        message ||
        (error
          ? RESPONSE_MESSAGES.ERROR.INTERNAL_ERROR
          : RESPONSE_MESSAGES.SUCCESS.RETRIEVED),
      metadata,
    };
  }

  /**
   * Create a standardized service error
   */
  protected createError(
    code: ServiceErrorCode,
    message: string,
    details?: any,
    context?: string
  ): ServiceError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      context: context || this.entityName,
    };
  }

  /**
   * Handle repository errors and convert to service errors
   */
  protected handleRepositoryError(error: any, operation: string): ServiceError {
    logger.error(`Repository error in ${this.entityName}.${operation}`, error);

    // Map specific database errors to service errors
    if (error.code === "PGRST116") {
      return this.createError(
        ServiceErrorCode.NOT_FOUND,
        RESPONSE_MESSAGES.ERROR.NOT_FOUND,
        error,
        `${this.entityName}.${operation}`
      );
    }

    if (error.code === "23505") {
      return this.createError(
        ServiceErrorCode.DUPLICATE_ERROR,
        RESPONSE_MESSAGES.ERROR.DUPLICATE,
        error,
        `${this.entityName}.${operation}`
      );
    }

    // Generic internal error
    return this.createError(
      ServiceErrorCode.INTERNAL_ERROR,
      RESPONSE_MESSAGES.ERROR.INTERNAL_ERROR,
      error,
      `${this.entityName}.${operation}`
    );
  }

  /**
   * Validate data before operations
   */
  protected validateData(
    data: Partial<T>,
    operation: "create" | "update" = "create"
  ): ValidationResult {
    if (!serviceConfig.enableValidation) {
      return { isValid: true, errors: [] };
    }

    switch (operation) {
      case "create":
        return this.validator?.validate(data) || { isValid: true, errors: [] };
      case "update":
        return (
          this.validator?.validateUpdate(data) || { isValid: true, errors: [] }
        );
      default:
        return this.validator?.validate(data) || { isValid: true, errors: [] };
    }
  }

  /**
   * Log business events for monitoring
   */
  protected logBusinessEvent(event: string, context?: any): void {
    logger.businessEvent(`${this.entityName}.${event}`, context);
  }

  async getAll(options?: QueryOptions): Promise<ServiceResponse<T[]>> {
    try {
      this.logBusinessEvent("getAll", { options });

      const result = await this.repository.findAll(options);

      if (result.error) {
        const serviceError = this.handleRepositoryError(result.error, "getAll");
        return this.createResponse<T[]>(null, serviceError);
      }

      const metadata: ResponseMetadata = {
        total: result.count || result.data?.length || 0,
        page: options?.pagination?.page,
        limit: options?.pagination?.limit,
      };

      return this.createResponse<T[]>(
        result.data || [],
        null,
        RESPONSE_MESSAGES.SUCCESS.RETRIEVED,
        metadata
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getAll");
      return this.createResponse<T[]>(null, serviceError);
    }
  }

  async getById(id: string): Promise<ServiceResponse<T>> {
    try {
      if (!id) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "ID is required",
          { id },
          "getById"
        );
        return this.createResponse<T>(null, error);
      }

      this.logBusinessEvent("getById", { id });

      const result = await this.repository.findById(id);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "getById"
        );
        return this.createResponse<T>(null, serviceError);
      }

      if (!result.data) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          { id },
          "getById"
        );
        return this.createResponse<T>(null, error);
      }

      return this.createResponse<T>(
        result.data,
        null,
        RESPONSE_MESSAGES.SUCCESS.RETRIEVED
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getById");
      return this.createResponse<T>(null, serviceError);
    }
  }

  async create(data: Partial<T>): Promise<ServiceResponse<T>> {
    try {
      // Validate input data
      const validation = this.validateData(data, "create");
      if (!validation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          RESPONSE_MESSAGES.ERROR.VALIDATION_FAILED,
          validation.errors,
          "create"
        );
        return this.createResponse<T>(null, error);
      }

      this.logBusinessEvent("create", { hasData: !!data });

      const result = await this.repository.create(data);

      if (result.error) {
        const serviceError = this.handleRepositoryError(result.error, "create");
        return this.createResponse<T>(null, serviceError);
      }

      this.logBusinessEvent("created", { id: (result.data as any)?.id });

      return this.createResponse<T>(
        result.data,
        null,
        RESPONSE_MESSAGES.SUCCESS.CREATED
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "create");
      return this.createResponse<T>(null, serviceError);
    }
  }

  async update(id: string, data: Partial<T>): Promise<ServiceResponse<T>> {
    try {
      if (!id) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "ID is required",
          { id },
          "update"
        );
        return this.createResponse<T>(null, error);
      }

      // Validate input data
      const validation = this.validateData(data, "update");
      if (!validation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          RESPONSE_MESSAGES.ERROR.VALIDATION_FAILED,
          validation.errors,
          "update"
        );
        return this.createResponse<T>(null, error);
      }

      this.logBusinessEvent("update", { id, hasData: !!data });

      const result = await this.repository.update(id, data);

      if (result.error) {
        const serviceError = this.handleRepositoryError(result.error, "update");
        return this.createResponse<T>(null, serviceError);
      }

      this.logBusinessEvent("updated", { id });

      return this.createResponse<T>(
        result.data,
        null,
        RESPONSE_MESSAGES.SUCCESS.UPDATED
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "update");
      return this.createResponse<T>(null, serviceError);
    }
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!id) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "ID is required",
          { id },
          "delete"
        );
        return this.createResponse<boolean>(null, error);
      }

      this.logBusinessEvent("delete", { id });

      const result = await this.repository.delete(id);

      if (result.error) {
        const serviceError = this.handleRepositoryError(result.error, "delete");
        return this.createResponse<boolean>(null, serviceError);
      }

      this.logBusinessEvent("deleted", { id });

      return this.createResponse<boolean>(
        true,
        null,
        RESPONSE_MESSAGES.SUCCESS.DELETED
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "delete");
      return this.createResponse<boolean>(null, serviceError);
    }
  }

  async count(filters?: any[]): Promise<ServiceResponse<number>> {
    try {
      this.logBusinessEvent("count", { filters });

      const result = await this.repository.count(filters);

      if (result.error) {
        const serviceError = this.handleRepositoryError(result.error, "count");
        return this.createResponse<number>(null, serviceError);
      }

      return this.createResponse<number>(
        result.count || 0,
        null,
        RESPONSE_MESSAGES.SUCCESS.RETRIEVED
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "count");
      return this.createResponse<number>(null, serviceError);
    }
  }

  /**
   * Helper method for pagination
   */
  protected createPaginationOptions(
    page: number = 0,
    limit: number = serviceConfig.defaultPageSize
  ): QueryOptions {
    const clampedLimit = Math.min(limit, serviceConfig.maxPageSize);
    return {
      pagination: {
        page: Math.max(0, page),
        limit: clampedLimit,
        offset: page * clampedLimit,
      },
    };
  }

  /**
   * Helper method for filtering
   */
  protected createFilterOptions(filters: Record<string, any>): QueryOptions {
    const filterOptions = Object.entries(filters).map(([column, value]) => ({
      column,
      operator: "eq" as const,
      value,
    }));

    return { filters: filterOptions };
  }
}
