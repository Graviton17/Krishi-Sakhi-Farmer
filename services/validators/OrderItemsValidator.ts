import { BUSINESS_RULES } from "../config";
import { OrderItem, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export class OrderItemsValidator extends BaseValidator<OrderItem> {
  private readonly REQUIRED_FIELDS = [
    "order_id",
    "listing_id",
    "quantity",
    "price_at_purchase",
  ];

  validate(data: Partial<OrderItem>): ValidationResult {
    const errors: ValidationError[] = [];

    // UUID validation for ID fields
    if (data.order_id && !this.isValidUUID(data.order_id)) {
      errors.push(
        this.createError(
          "order_id",
          "Invalid order ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    if (data.listing_id && !this.isValidUUID(data.listing_id)) {
      errors.push(
        this.createError(
          "listing_id",
          "Invalid listing ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    // Quantity validation using BaseValidator methods
    if (data.quantity !== undefined) {
      if (!this.isPositiveNumber(data.quantity)) {
        errors.push(
          this.createError(
            "quantity",
            "Quantity must be a positive number",
            "INVALID_QUANTITY"
          )
        );
      } else if (data.quantity > BUSINESS_RULES.ORDER.MAX_QUANTITY_PER_ITEM) {
        errors.push(
          this.createError(
            "quantity",
            `Quantity cannot exceed ${BUSINESS_RULES.ORDER.MAX_QUANTITY_PER_ITEM}`,
            "QUANTITY_TOO_HIGH"
          )
        );
      }
    }

    // Price validation using BaseValidator methods
    if (data.price_at_purchase !== undefined) {
      if (!this.isPositiveNumber(data.price_at_purchase)) {
        errors.push(
          this.createError(
            "price_at_purchase",
            "Price must be greater than 0",
            "INVALID_PRICE"
          )
        );
      }
      if (data.price_at_purchase > BUSINESS_RULES.ORDER.MAX_PRICE_PER_UNIT) {
        errors.push(
          this.createError(
            "price_at_purchase",
            `Price per unit cannot exceed ${BUSINESS_RULES.ORDER.MAX_PRICE_PER_UNIT}`,
            "PRICE_TOO_HIGH"
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateRequired(data: Partial<OrderItem>): ValidationResult {
    return super.validateRequired(data, this.REQUIRED_FIELDS);
  }
}
