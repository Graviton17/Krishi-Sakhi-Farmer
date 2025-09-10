import { VALIDATION_RULES } from "../config";
import { Profile, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";

export class ProfileValidator extends BaseValidator<Profile> {
  private readonly REQUIRED_FIELDS = ["role", "full_name", "contact_email"];
  private readonly VALID_ROLES = ["farmer", "distributor", "retailer"];

  validate(data: Partial<Profile>): ValidationResult {
    const errors: ValidationError[] = [];

    // Email validation using BaseValidator
    if (data.contact_email && !this.isValidEmail(data.contact_email)) {
      errors.push(
        this.createError(
          "contact_email",
          "Invalid email format",
          "INVALID_EMAIL"
        )
      );
    }

    // Phone validation using BaseValidator
    if (data.phone_number && !this.isValidPhone(data.phone_number)) {
      errors.push(
        this.createError(
          "phone_number",
          "Invalid phone number format",
          "INVALID_PHONE"
        )
      );
    }

    // Name validation using BaseValidator string validation
    if (
      data.full_name &&
      !this.isValidString(data.full_name, 1, VALIDATION_RULES.NAME_MAX_LENGTH)
    ) {
      errors.push(
        this.createError(
          "full_name",
          `Name must be between 1 and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
          "INVALID_LENGTH"
        )
      );
    }

    // Role validation using BaseValidator enum validation
    if (data.role && !this.isValidEnum(data.role, this.VALID_ROLES)) {
      errors.push(
        this.createError(
          "role",
          `Invalid role. Must be one of: ${this.VALID_ROLES.join(", ")}`,
          "INVALID_ROLE"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateRequired(data: Partial<Profile>): ValidationResult {
    return super.validateRequired(data, this.REQUIRED_FIELDS);
  }
}
