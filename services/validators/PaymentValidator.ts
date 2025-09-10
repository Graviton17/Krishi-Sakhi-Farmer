import { BUSINESS_RULES } from "../config";
import { Payment, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export class PaymentValidator extends BaseValidator<Payment> {
  private readonly REQUIRED_FIELDS = ["order_id", "amount"];
  private readonly VALID_STATUSES = ["pending", "succeeded", "failed"];

  validate(data: Partial<Payment>): ValidationResult {
    const errors: ValidationError[] = [];

    // Order ID validation using BaseValidator UUID validation
    if (data.order_id && !this.isValidUUID(data.order_id)) {
      errors.push(
        this.createError(
          "order_id",
          "Invalid order ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    // Amount validation using BaseValidator methods
    if (data.amount !== undefined) {
      if (!this.isPositiveNumber(data.amount)) {
        errors.push(
          this.createError(
            "amount",
            "Payment amount must be a positive number",
            "INVALID_NUMBER"
          )
        );
      } else if (
        !this.isWithinRange(
          data.amount,
          BUSINESS_RULES.PAYMENT.MIN_AMOUNT,
          BUSINESS_RULES.PAYMENT.MAX_AMOUNT
        )
      ) {
        if (data.amount < BUSINESS_RULES.PAYMENT.MIN_AMOUNT) {
          errors.push(
            this.createError(
              "amount",
              `Payment amount must be at least ${BUSINESS_RULES.PAYMENT.MIN_AMOUNT}`,
              "AMOUNT_TOO_LOW"
            )
          );
        } else {
          errors.push(
            this.createError(
              "amount",
              `Payment amount cannot exceed ${BUSINESS_RULES.PAYMENT.MAX_AMOUNT}`,
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
          `Invalid payment status. Must be one of: ${this.VALID_STATUSES.join(
            ", "
          )}`,
          "INVALID_STATUS"
        )
      );
    }

    // Stripe charge ID validation using BaseValidator pattern matching
    if (data.stripe_charge_id) {
      const stripeIdPattern = /^(ch_|pi_)[a-zA-Z0-9_]+$/;
      if (!this.matchesPattern(data.stripe_charge_id, stripeIdPattern)) {
        errors.push(
          this.createError(
            "stripe_charge_id",
            "Invalid Stripe charge ID format",
            "INVALID_STRIPE_ID"
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateRequired(data: Partial<Payment>): ValidationResult {
    return super.validateRequired(data, this.REQUIRED_FIELDS);
  }
}
