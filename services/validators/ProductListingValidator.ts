import { ProductListing } from "../../types/supabase";
import { ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

/**
 * Product Listing Validator
 * Validates product listing data
 */
export class ProductListingValidator extends BaseValidator<ProductListing> {
  /**
   * Validate product listing creation data
   */
  validateCreate(data: Partial<ProductListing>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!data.farmer_id || !this.isValidUUID(data.farmer_id)) {
      errors.push(
        this.createError(
          "farmer_id",
          "Valid farmer_id is required",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    if (!data.product_id || !this.isValidUUID(data.product_id)) {
      errors.push(
        this.createError(
          "product_id",
          "Valid product_id is required",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    if (
      data.price_per_unit === undefined ||
      data.price_per_unit === null ||
      data.price_per_unit <= 0
    ) {
      errors.push(
        this.createError(
          "price_per_unit",
          "Valid price per unit is required",
          VALIDATION_ERROR_CODES.INVALID_PRICE
        )
      );
    }

    if (
      data.quantity_available === undefined ||
      data.quantity_available === null ||
      data.quantity_available < 0
    ) {
      errors.push(
        this.createError(
          "quantity_available",
          "Valid quantity available is required",
          VALIDATION_ERROR_CODES.INVALID_QUANTITY
        )
      );
    }

    if (
      !data.unit_of_measure ||
      !this.isValidString(data.unit_of_measure, 1, 50)
    ) {
      errors.push(
        this.createError(
          "unit_of_measure",
          "Unit of measure must be 1-50 characters",
          VALIDATION_ERROR_CODES.INVALID_LENGTH
        )
      );
    }

    // Validate dates if provided
    if (data.harvest_date && !this.isValidDate(data.harvest_date)) {
      errors.push(
        this.createError(
          "harvest_date",
          "Invalid harvest date format",
          VALIDATION_ERROR_CODES.INVALID_DATE
        )
      );
    }

    // Validate status enum if provided
    if (
      data.status &&
      !this.isValidEnum(data.status, ["available", "sold_out", "delisted"])
    ) {
      errors.push(
        this.createError(
          "status",
          "Invalid status value",
          VALIDATION_ERROR_CODES.INVALID_STATUS
        )
      );
    }

    // Validate quality report ID if provided
    if (data.quality_report_id && !this.isValidUUID(data.quality_report_id)) {
      errors.push(
        this.createError(
          "quality_report_id",
          "Invalid quality report ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate product listing update data
   */
  validateUpdate(data: Partial<ProductListing>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate fields if provided
    if (data.price_per_unit !== undefined && data.price_per_unit <= 0) {
      errors.push(
        this.createError(
          "price_per_unit",
          "Price per unit must be greater than 0",
          VALIDATION_ERROR_CODES.INVALID_PRICE
        )
      );
    }

    if (data.quantity_available !== undefined && data.quantity_available < 0) {
      errors.push(
        this.createError(
          "quantity_available",
          "Quantity available cannot be negative",
          VALIDATION_ERROR_CODES.INVALID_QUANTITY
        )
      );
    }

    if (
      data.unit_of_measure &&
      !this.isValidString(data.unit_of_measure, 1, 50)
    ) {
      errors.push(
        this.createError(
          "unit_of_measure",
          "Unit of measure must be 1-50 characters",
          VALIDATION_ERROR_CODES.INVALID_LENGTH
        )
      );
    }

    // Validate dates if provided
    if (data.harvest_date && !this.isValidDate(data.harvest_date)) {
      errors.push(
        this.createError(
          "harvest_date",
          "Invalid harvest date format",
          VALIDATION_ERROR_CODES.INVALID_DATE
        )
      );
    }

    // Validate status enum if provided
    if (
      data.status &&
      !this.isValidEnum(data.status, ["available", "sold_out", "delisted"])
    ) {
      errors.push(
        this.createError(
          "status",
          "Invalid status value",
          VALIDATION_ERROR_CODES.INVALID_STATUS
        )
      );
    }

    // Validate quality report ID if provided
    if (data.quality_report_id && !this.isValidUUID(data.quality_report_id)) {
      errors.push(
        this.createError(
          "quality_report_id",
          "Invalid quality report ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
