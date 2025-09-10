/**
 * Enhanced Base Validator class following industrial standards
 * Provides comprehensive data validation with proper error reporting
 * Eliminates redundancy with common validation methods
 */

import { VALIDATION_RULES } from "../config";
import { IValidator, ValidationError, ValidationResult } from "../types";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export class BaseValidator<T = any> implements IValidator<T> {
  protected createError(
    field: string,
    message: string,
    code: string
  ): ValidationError {
    return { field, message, code };
  }

  protected isValidEmail(email: string): boolean {
    return VALIDATION_RULES.EMAIL.test(email);
  }

  protected isValidPhone(phone: string): boolean {
    return VALIDATION_RULES.PHONE.test(phone);
  }

  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  protected isWithinRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  protected isValidLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength;
  }

  protected isRequired(value: any): boolean {
    return value !== null && value !== undefined && value !== "";
  }

  /**
   * Common validation for UUIDs
   */
  protected isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Common validation for dates
   */
  protected isValidDate(value: string | Date): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Common validation for future dates
   */
  protected isFutureDate(value: string | Date): boolean {
    const date = new Date(value);
    return this.isValidDate(value) && date > new Date();
  }

  /**
   * Common validation for past dates
   */
  protected isPastDate(value: string | Date): boolean {
    const date = new Date(value);
    return this.isValidDate(value) && date < new Date();
  }

  /**
   * Common validation for positive numbers
   */
  protected isPositiveNumber(value: number): boolean {
    return typeof value === "number" && value > 0;
  }

  /**
   * Common validation for non-negative numbers
   */
  protected isNonNegativeNumber(value: number): boolean {
    return typeof value === "number" && value >= 0;
  }

  /**
   * Common validation for arrays
   */
  protected isValidArray(
    value: any,
    minLength?: number,
    maxLength?: number
  ): boolean {
    if (!Array.isArray(value)) return false;
    if (minLength !== undefined && value.length < minLength) return false;
    if (maxLength !== undefined && value.length > maxLength) return false;
    return true;
  }

  /**
   * Common validation for enumerated values
   */
  protected isValidEnum(value: string, allowedValues: string[]): boolean {
    return allowedValues.includes(value);
  }

  /**
   * Common validation for string patterns
   */
  protected matchesPattern(value: string, pattern: RegExp): boolean {
    return pattern.test(value);
  }

  /**
   * Common validation for trimmed non-empty strings
   */
  protected isValidString(
    value: string,
    minLength = 1,
    maxLength?: number
  ): boolean {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (trimmed.length < minLength) return false;
    if (maxLength && trimmed.length > maxLength) return false;
    return true;
  }

  /**
   * Common validation for inappropriate content
   */
  protected containsInappropriateContent(content: string): boolean {
    const inappropriatePatterns = [
      /\b(spam|scam|fraud|fake)\b/i,
      /\b(fuck|shit|damn|bitch)\b/i,
      /(.)\1{4,}/, // Repeated characters (like "aaaaa")
      /[^\w\s.,!?-]/g, // Special characters that might be suspicious
    ];

    return inappropriatePatterns.some((pattern) => pattern.test(content));
  }

  /**
   * Validate multiple fields at once
   */
  protected validateFields(
    data: Partial<T>,
    fieldValidations: {
      field: string;
      validator: (value: any) => boolean;
      message: string;
      code?: string;
    }[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    fieldValidations.forEach(({ field, validator, message, code }) => {
      const value = (data as any)[field];
      if (!validator(value)) {
        errors.push(
          this.createError(
            field,
            message,
            code || VALIDATION_ERROR_CODES.INVALID_VALUE
          )
        );
      }
    });

    return errors;
  }

  /**
   * Validate required fields with custom messages
   */
  protected validateRequiredFields(
    data: Partial<T>,
    requiredFields: { field: string; message?: string }[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    requiredFields.forEach(({ field, message }) => {
      const value = (data as any)[field];
      if (!this.isRequired(value)) {
        errors.push(
          this.createError(
            field,
            message || `${field} is required`,
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      }
    });

    return errors;
  }

  validate(data: Partial<T>): ValidationResult {
    // Base implementation - override in specific validators
    return { isValid: true, errors: [] };
  }

  /**
   * Helper method to add UUID validation errors
   */
  protected addUUIDValidation(
    errors: ValidationError[],
    field: string,
    value: string | undefined,
    required: boolean = false
  ): void {
    if (required && !value?.trim()) {
      errors.push(
        this.createError(
          field,
          `${field} is required`,
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    } else if (value && !this.isValidUUID(value)) {
      errors.push(
        this.createError(
          field,
          `Invalid ${field} format`,
          VALIDATION_ERROR_CODES.INVALID_FORMAT
        )
      );
    }
  }

  /**
   * Helper method to add required field validation errors
   */
  protected addRequiredFieldValidation(
    errors: ValidationError[],
    field: string,
    value: string | undefined
  ): void {
    if (!value?.trim()) {
      errors.push(
        this.createError(
          field,
          `${field} is required`,
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    }
  }

  /**
   * Helper method to add date validation errors
   */
  protected addDateValidation(
    errors: ValidationError[],
    field: string,
    value: string | undefined,
    required: boolean = false
  ): void {
    if (required && !value) {
      errors.push(
        this.createError(
          field,
          `${field} is required`,
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    } else if (value && !this.isValidDate(value)) {
      errors.push(
        this.createError(
          field,
          `Invalid ${field} format`,
          VALIDATION_ERROR_CODES.INVALID_FORMAT
        )
      );
    }
  }

  /**
   * Check if one date is after another
   */
  protected isDateAfter(laterDate: string, earlierDate: string): boolean {
    return new Date(laterDate) > new Date(earlierDate);
  }

  /**
   * Get difference in months between two dates
   */
  protected getMonthsDifference(startDate: Date, endDate: Date): number {
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    return (endYear - startYear) * 12 + (endMonth - startMonth);
  }

  validateRequired(
    data: Partial<T>,
    requiredFields: string[]
  ): ValidationResult {
    const errors: ValidationError[] = [];

    requiredFields.forEach((field) => {
      const value = (data as any)[field];
      if (!this.isRequired(value)) {
        errors.push(
          this.createError(
            field,
            `${field} is required`,
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateUpdate(data: Partial<T>): ValidationResult {
    // For updates, we don't require all fields, just validate what's provided
    return this.validate(data);
  }
}
