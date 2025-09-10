import { BUSINESS_RULES } from "../config";
import { Order, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export class OrderValidator extends BaseValidator<Order> {
  private readonly REQUIRED_FIELDS = ["buyer_id", "total_amount"];
  private readonly VALID_STATUSES = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  validate(data: Partial<Order>): ValidationResult {
    const errors: ValidationError[] = [];

    // Buyer ID validation using BaseValidator UUID validation
    if (data.buyer_id && !this.isValidUUID(data.buyer_id)) {
      errors.push(
        this.createError(
          "buyer_id",
          "Invalid buyer ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    // Amount validation using BaseValidator range validation
    if (data.total_amount !== undefined) {
      if (!this.isPositiveNumber(data.total_amount)) {
        errors.push(
          this.createError(
            "total_amount",
            "Order amount must be a positive number",
            "INVALID_NUMBER"
          )
        );
      } else if (
        !this.isWithinRange(
          data.total_amount,
          BUSINESS_RULES.ORDER.MIN_AMOUNT,
          BUSINESS_RULES.ORDER.MAX_AMOUNT
        )
      ) {
        if (data.total_amount < BUSINESS_RULES.ORDER.MIN_AMOUNT) {
          errors.push(
            this.createError(
              "total_amount",
              `Order amount must be at least ${BUSINESS_RULES.ORDER.MIN_AMOUNT}`,
              "AMOUNT_TOO_LOW"
            )
          );
        } else {
          errors.push(
            this.createError(
              "total_amount",
              `Order amount cannot exceed ${BUSINESS_RULES.ORDER.MAX_AMOUNT}`,
              "AMOUNT_TOO_HIGH"
            )
          );
        }
      }
    }

    // Status validation using BaseValidator enum validation
    if (data.status && !this.isValidEnum(data.status, this.VALID_STATUSES)) {
      errors.push(
        this.createError(
          "status",
          `Invalid order status. Must be one of: ${this.VALID_STATUSES.join(
            ", "
          )}`,
          "INVALID_STATUS"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateRequired(data: Partial<Order>): ValidationResult {
    return super.validateRequired(data, this.REQUIRED_FIELDS);
  }
}
