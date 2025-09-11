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
      // Try to parse various date formats
      const dateStr = data.due_date.toString().trim();
      let parsedDate: Date | null = null;

      // Try different date formats
      const formats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
        /^\d{2},\d{2},\d{4}$/, // MM,DD,YYYY
        /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      ];

      // Check if format matches any expected pattern
      const isValidFormat = formats.some((format) => format.test(dateStr));

      if (!isValidFormat) {
        errors.push(
          this.createError(
            "due_date",
            "Invalid date format. Please use YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY format",
            VALIDATION_ERROR_CODES.INVALID_DATE
          )
        );
      } else {
        // Try to parse the date
        if (dateStr.includes(",")) {
          // Handle MM,DD,YYYY format
          const parts = dateStr.split(",");
          if (parts.length === 3) {
            const [month, day, year] = parts;
            parsedDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
          }
        } else if (dateStr.includes("/")) {
          // Handle MM/DD/YYYY format
          const parts = dateStr.split("/");
          if (parts.length === 3) {
            const [month, day, year] = parts;
            parsedDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
          }
        } else if (dateStr.includes("-")) {
          // Handle YYYY-MM-DD or MM-DD-YYYY format
          const parts = dateStr.split("-");
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              // YYYY-MM-DD
              parsedDate = new Date(dateStr);
            } else {
              // MM-DD-YYYY
              const [month, day, year] = parts;
              parsedDate = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
            }
          }
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) {
          errors.push(
            this.createError(
              "due_date",
              "Invalid date format",
              VALIDATION_ERROR_CODES.INVALID_DATE
            )
          );
        } else {
          // Check if date is in the future (optional - remove this check if past dates should be allowed)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          parsedDate.setHours(0, 0, 0, 0);

          if (parsedDate < today) {
            errors.push(
              this.createError(
                "due_date",
                "Due date cannot be in the past",
                VALIDATION_ERROR_CODES.INVALID_DATE
              )
            );
          }
        }
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
