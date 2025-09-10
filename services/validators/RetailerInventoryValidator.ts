/**
 * RetailerInventoryValidator
 * Validation logic for retailer inventory operations
 * Implements comprehensive business rules and data validation
 */

import { logger } from "../logger";
import { ServiceErrorCode } from "../types";

// Data types for RetailerInventory operations
export interface RetailerInventoryCreateData {
  retailer_id: string;
  listing_id: string;
  quantity_on_hand: number;
}

export interface RetailerInventoryUpdateData {
  quantity_on_hand?: number;
}

export interface RetailerInventoryAdjustmentData {
  adjustment: number; // Can be positive or negative
  reason?: string;
}

// Local validation result interface for retailer inventory operations
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class RetailerInventoryValidator {
  /**
   * Validate inventory creation data
   */
  validateCreate(data: RetailerInventoryCreateData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate retailer_id
      if (!data.retailer_id) {
        errors.push("Retailer ID is required");
      } else if (
        typeof data.retailer_id !== "string" ||
        data.retailer_id.trim().length === 0
      ) {
        errors.push("Retailer ID must be a valid string");
      }

      // Validate listing_id
      if (!data.listing_id) {
        errors.push("Listing ID is required");
      } else if (
        typeof data.listing_id !== "string" ||
        data.listing_id.trim().length === 0
      ) {
        errors.push("Listing ID must be a valid string");
      }

      // Validate quantity_on_hand
      if (
        data.quantity_on_hand === undefined ||
        data.quantity_on_hand === null
      ) {
        errors.push("Quantity on hand is required");
      } else {
        const quantityValidation = this.validateQuantity(data.quantity_on_hand);
        if (!quantityValidation.isValid) {
          errors.push(...quantityValidation.errors);
        }
        if (quantityValidation.warnings) {
          warnings.push(...quantityValidation.warnings);
        }
      }

      // Business logic validations
      if (data.quantity_on_hand > 100000) {
        warnings.push(
          "Large inventory quantity detected - please verify accuracy"
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logger.error("Error validating inventory create data:", error as Error);
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate inventory update data
   */
  validateUpdate(data: RetailerInventoryUpdateData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if at least one field is provided
      if (Object.keys(data).length === 0) {
        errors.push("At least one field must be provided for update");
        return { isValid: false, errors };
      }

      // Validate quantity_on_hand if provided
      if (data.quantity_on_hand !== undefined) {
        const quantityValidation = this.validateQuantity(data.quantity_on_hand);
        if (!quantityValidation.isValid) {
          errors.push(...quantityValidation.errors);
        }
        if (quantityValidation.warnings) {
          warnings.push(...quantityValidation.warnings);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logger.error("Error validating inventory update data:", error as Error);
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate quantity adjustment data
   */
  validateAdjustment(data: RetailerInventoryAdjustmentData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate adjustment amount
      if (data.adjustment === undefined || data.adjustment === null) {
        errors.push("Adjustment amount is required");
      } else if (
        typeof data.adjustment !== "number" ||
        isNaN(data.adjustment)
      ) {
        errors.push("Adjustment amount must be a valid number");
      } else if (data.adjustment === 0) {
        errors.push("Adjustment amount cannot be zero");
      } else if (Math.abs(data.adjustment) > 10000) {
        errors.push("Adjustment amount too large (max ±10,000)");
      }

      // Validate reason if provided
      if (data.reason !== undefined) {
        if (typeof data.reason !== "string") {
          errors.push("Reason must be a string");
        } else if (data.reason.length > 500) {
          errors.push("Reason must be 500 characters or less");
        }
      }

      // Business logic warnings
      if (Math.abs(data.adjustment) > 1000) {
        warnings.push(
          "Large adjustment amount - consider breaking into smaller adjustments"
        );
      }

      if (data.adjustment < 0 && Math.abs(data.adjustment) > 100) {
        warnings.push(
          "Large negative adjustment - ensure sufficient stock is available"
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logger.error(
        "Error validating inventory adjustment data:",
        error as Error
      );
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate quantity value
   */
  private validateQuantity(quantity: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof quantity !== "number" || isNaN(quantity)) {
      errors.push("Quantity must be a valid number");
    } else {
      if (quantity < 0) {
        errors.push("Quantity cannot be negative");
      }

      if (quantity > 100000) {
        errors.push("Quantity cannot exceed 100,000 units");
      }

      // Decimal places validation
      if (quantity % 1 !== 0 && quantity.toString().split(".")[1]?.length > 2) {
        errors.push("Quantity cannot have more than 2 decimal places");
      }

      // Business warnings
      if (quantity === 0) {
        warnings.push("Zero quantity will mark item as out of stock");
      }

      if (quantity > 0 && quantity <= 5) {
        warnings.push("Low stock quantity detected");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate bulk update data
   */
  validateBulkUpdate(
    updates: { id: string; quantity_on_hand: number }[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!Array.isArray(updates)) {
        errors.push("Updates must be an array");
        return { isValid: false, errors };
      }

      if (updates.length === 0) {
        errors.push("At least one update is required");
        return { isValid: false, errors };
      }

      if (updates.length > 100) {
        errors.push("Maximum 100 updates allowed per bulk operation");
        return { isValid: false, errors };
      }

      // Validate each update
      const processedIds = new Set<string>();

      updates.forEach((update, index) => {
        const prefix = `Item ${index + 1}:`;

        // Validate ID
        if (!update.id) {
          errors.push(`${prefix} ID is required`);
        } else if (typeof update.id !== "string") {
          errors.push(`${prefix} ID must be a string`);
        } else if (processedIds.has(update.id)) {
          errors.push(`${prefix} Duplicate ID found`);
        } else {
          processedIds.add(update.id);
        }

        // Validate quantity
        const quantityValidation = this.validateQuantity(
          update.quantity_on_hand
        );
        if (!quantityValidation.isValid) {
          quantityValidation.errors.forEach((error) => {
            errors.push(`${prefix} ${error}`);
          });
        }
        if (quantityValidation.warnings) {
          quantityValidation.warnings.forEach((warning) => {
            warnings.push(`${prefix} ${warning}`);
          });
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logger.error("Error validating bulk update data:", error as Error);
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate low stock threshold
   */
  validateLowStockThreshold(threshold: number): ValidationResult {
    const errors: string[] = [];

    if (typeof threshold !== "number" || isNaN(threshold)) {
      errors.push("Threshold must be a valid number");
    } else if (threshold < 0) {
      errors.push("Threshold cannot be negative");
    } else if (threshold > 1000) {
      errors.push("Threshold cannot exceed 1,000");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get validation error code based on error type
   */
  getErrorCode(error: string): ServiceErrorCode {
    if (error.includes("required")) {
      return ServiceErrorCode.VALIDATION_ERROR;
    }
    if (error.includes("invalid") || error.includes("must be")) {
      return ServiceErrorCode.VALIDATION_ERROR;
    }
    if (error.includes("exceed") || error.includes("too large")) {
      return ServiceErrorCode.VALIDATION_ERROR;
    }
    if (error.includes("negative")) {
      return ServiceErrorCode.VALIDATION_ERROR;
    }
    return ServiceErrorCode.VALIDATION_ERROR;
  }
}
