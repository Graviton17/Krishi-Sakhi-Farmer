import { VALIDATION_RULES } from "../config";
import { FarmTask, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export class FarmTaskValidator extends BaseValidator<FarmTask> {
  private readonly REQUIRED_FIELDS = ["farmer_id", "title"];
  private readonly VALID_STATUSES = ["pending", "in_progress", "completed"];

  validate(data: Partial<FarmTask>): ValidationResult {
    const errors: ValidationError[] = [];

    // Farmer ID validation using BaseValidator UUID validation
    if (data.farmer_id && !this.isValidUUID(data.farmer_id)) {
      errors.push(
        this.createError(
          "farmer_id",
          "Invalid farmer ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    // Title validation using BaseValidator string validation
    if (
      data.title &&
      !this.isValidString(data.title, 1, VALIDATION_RULES.NAME_MAX_LENGTH)
    ) {
      errors.push(
        this.createError(
          "title",
          `Task title must be between 1 and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
          "INVALID_LENGTH"
        )
      );
    }

    // Description validation using BaseValidator string validation
    if (
      data.description &&
      !this.isValidString(
        data.description,
        1,
        VALIDATION_RULES.DESCRIPTION_MAX_LENGTH
      )
    ) {
      errors.push(
        this.createError(
          "description",
          `Description must be less than ${VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} characters`,
          "INVALID_LENGTH"
        )
      );
    }

    // Status validation using BaseValidator enum validation
    if (data.status && !this.isValidEnum(data.status, this.VALID_STATUSES)) {
      errors.push(
        this.createError(
          "status",
          `Invalid task status. Must be one of: ${this.VALID_STATUSES.join(
            ", "
          )}`,
          "INVALID_STATUS"
        )
      );
    }

    // Due date validation using BaseValidator date methods
    if (data.due_date) {
      if (!this.isValidDate(data.due_date)) {
        errors.push(
          this.createError("due_date", "Invalid date format", "INVALID_DATE")
        );
      } else if (!this.isFutureDate(data.due_date)) {
        errors.push(
          this.createError(
            "due_date",
            "Due date cannot be in the past",
            "INVALID_DATE"
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateRequired(data: Partial<FarmTask>): ValidationResult {
    return super.validateRequired(data, this.REQUIRED_FIELDS);
  }
}
