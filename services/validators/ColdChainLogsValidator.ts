/**
 * ColdChainLogsValidator
 * Validation logic for cold chain log operations
 * Implements comprehensive business rules and data validation
 */

import { logger } from "../logger";
import { ServiceErrorCode } from "../types";

// Data types for ColdChainLog operations
export interface ColdChainLogCreateData {
  retailer_id: string;
  storage_unit_id: string;
  temperature: number;
  notes?: string;
  logged_by_id?: string;
}

export interface ColdChainLogUpdateData {
  temperature?: number;
  notes?: string;
}

export interface TemperatureRangeData {
  min_temp: number;
  max_temp: number;
}

// Local validation result interface for cold chain log operations
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class ColdChainLogsValidator {
  /**
   * Validate log creation data
   */
  validateCreate(data: ColdChainLogCreateData): ValidationResult {
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

      // Validate storage_unit_id
      if (!data.storage_unit_id) {
        errors.push("Storage unit ID is required");
      } else if (
        typeof data.storage_unit_id !== "string" ||
        data.storage_unit_id.trim().length === 0
      ) {
        errors.push("Storage unit ID must be a valid string");
      } else if (data.storage_unit_id.length > 50) {
        errors.push("Storage unit ID must be 50 characters or less");
      }

      // Validate temperature
      if (data.temperature === undefined || data.temperature === null) {
        errors.push("Temperature is required");
      } else {
        const tempValidation = this.validateTemperature(data.temperature);
        if (!tempValidation.isValid) {
          errors.push(...tempValidation.errors);
        }
        if (tempValidation.warnings) {
          warnings.push(...tempValidation.warnings);
        }
      }

      // Validate notes if provided
      if (data.notes !== undefined) {
        if (typeof data.notes !== "string") {
          errors.push("Notes must be a string");
        } else if (data.notes.length > 1000) {
          errors.push("Notes must be 1000 characters or less");
        }
      }

      // Validate logged_by_id if provided
      if (data.logged_by_id !== undefined) {
        if (
          typeof data.logged_by_id !== "string" ||
          data.logged_by_id.trim().length === 0
        ) {
          errors.push("Logged by ID must be a valid string");
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logger.error(
        "Error validating cold chain log create data:",
        error as Error
      );
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate log update data
   */
  validateUpdate(data: ColdChainLogUpdateData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if at least one field is provided
      if (Object.keys(data).length === 0) {
        errors.push("At least one field must be provided for update");
        return { isValid: false, errors };
      }

      // Validate temperature if provided
      if (data.temperature !== undefined) {
        const tempValidation = this.validateTemperature(data.temperature);
        if (!tempValidation.isValid) {
          errors.push(...tempValidation.errors);
        }
        if (tempValidation.warnings) {
          warnings.push(...tempValidation.warnings);
        }
      }

      // Validate notes if provided
      if (data.notes !== undefined) {
        if (typeof data.notes !== "string") {
          errors.push("Notes must be a string");
        } else if (data.notes.length > 1000) {
          errors.push("Notes must be 1000 characters or less");
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      logger.error(
        "Error validating cold chain log update data:",
        error as Error
      );
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate temperature range data
   */
  validateTemperatureRange(data: TemperatureRangeData): ValidationResult {
    const errors: string[] = [];

    try {
      // Validate min_temp
      if (data.min_temp === undefined || data.min_temp === null) {
        errors.push("Minimum temperature is required");
      } else if (typeof data.min_temp !== "number" || isNaN(data.min_temp)) {
        errors.push("Minimum temperature must be a valid number");
      }

      // Validate max_temp
      if (data.max_temp === undefined || data.max_temp === null) {
        errors.push("Maximum temperature is required");
      } else if (typeof data.max_temp !== "number" || isNaN(data.max_temp)) {
        errors.push("Maximum temperature must be a valid number");
      }

      // Validate range logic
      if (data.min_temp !== undefined && data.max_temp !== undefined) {
        if (data.min_temp >= data.max_temp) {
          errors.push(
            "Minimum temperature must be less than maximum temperature"
          );
        }

        const range = data.max_temp - data.min_temp;
        if (range > 100) {
          errors.push("Temperature range cannot exceed 100°C");
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating temperature range data:", error as Error);
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate date range
   */
  validateDateRange(startDate: string, endDate: string): ValidationResult {
    const errors: string[] = [];

    try {
      // Validate date format and parse
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime())) {
        errors.push("Start date must be a valid date");
      }

      if (isNaN(end.getTime())) {
        errors.push("End date must be a valid date");
      }

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (start >= end) {
          errors.push("Start date must be before end date");
        }

        const diffDays =
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 365) {
          errors.push("Date range cannot exceed 365 days");
        }

        // Check if start date is in the future
        if (start > new Date()) {
          errors.push("Start date cannot be in the future");
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating date range:", error as Error);
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate storage unit ID
   */
  validateStorageUnitId(storageUnitId: string): ValidationResult {
    const errors: string[] = [];

    try {
      if (!storageUnitId) {
        errors.push("Storage unit ID is required");
      } else if (typeof storageUnitId !== "string") {
        errors.push("Storage unit ID must be a string");
      } else {
        if (storageUnitId.trim().length === 0) {
          errors.push("Storage unit ID cannot be empty");
        }

        if (storageUnitId.length > 50) {
          errors.push("Storage unit ID must be 50 characters or less");
        }

        // Check for valid characters (alphanumeric, hyphens, underscores)
        if (!/^[a-zA-Z0-9_-]+$/.test(storageUnitId)) {
          errors.push(
            "Storage unit ID can only contain letters, numbers, hyphens, and underscores"
          );
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating storage unit ID:", error as Error);
      return {
        isValid: false,
        errors: ["Validation error occurred"],
      };
    }
  }

  /**
   * Validate limit parameter
   */
  validateLimit(limit: number): ValidationResult {
    const errors: string[] = [];

    if (typeof limit !== "number" || isNaN(limit)) {
      errors.push("Limit must be a valid number");
    } else if (limit <= 0) {
      errors.push("Limit must be greater than 0");
    } else if (limit > 1000) {
      errors.push("Limit cannot exceed 1000");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate days parameter for data retention
   */
  validateDaysParameter(days: number): ValidationResult {
    const errors: string[] = [];

    if (typeof days !== "number" || isNaN(days)) {
      errors.push("Days must be a valid number");
    } else if (days <= 0) {
      errors.push("Days must be greater than 0");
    } else if (days > 3650) {
      // 10 years max
      errors.push("Days cannot exceed 3650 (10 years)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate temperature value
   */
  private validateTemperature(temperature: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof temperature !== "number" || isNaN(temperature)) {
      errors.push("Temperature must be a valid number");
    } else {
      // Reasonable temperature range for cold storage (-80°C to 50°C)
      if (temperature < -80) {
        errors.push("Temperature cannot be below -80°C");
      } else if (temperature > 50) {
        errors.push("Temperature cannot be above 50°C");
      }

      // Decimal places validation (max 2 decimal places)
      if (
        temperature % 1 !== 0 &&
        temperature.toString().split(".")[1]?.length > 2
      ) {
        errors.push("Temperature cannot have more than 2 decimal places");
      }

      // Business warnings for unusual temperatures
      if (temperature > 10) {
        warnings.push("Temperature above 10°C may indicate storage issue");
      } else if (temperature < -40) {
        warnings.push("Very low temperature detected - verify sensor accuracy");
      }

      // Critical temperature warnings
      if (temperature > 25) {
        warnings.push("CRITICAL: Temperature above safe cold storage range");
      } else if (temperature > 5) {
        warnings.push(
          "WARNING: Temperature approaching unsafe range for cold storage"
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
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
    if (error.includes("exceed") || error.includes("cannot")) {
      return ServiceErrorCode.VALIDATION_ERROR;
    }
    if (error.includes("range")) {
      return ServiceErrorCode.VALIDATION_ERROR;
    }
    return ServiceErrorCode.VALIDATION_ERROR;
  }
}
