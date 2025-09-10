import { VALIDATION_RULES } from "../config";
import { Product, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export class ProductValidator extends BaseValidator<Product> {
  private readonly REQUIRED_FIELDS = ["name"];
  private readonly VALID_CATEGORIES = [
    "grains",
    "vegetables",
    "fruits",
    "dairy",
    "poultry",
    "livestock",
    "spices",
    "other",
  ];

  validate(data: Partial<Product>): ValidationResult {
    const errors: ValidationError[] = [];

    // Name validation using BaseValidator
    if (
      data.name &&
      !this.isValidString(data.name, 1, VALIDATION_RULES.NAME_MAX_LENGTH)
    ) {
      errors.push(
        this.createError(
          "name",
          `Product name must be between 1 and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
          "INVALID_LENGTH"
        )
      );
    }

    // Description validation using BaseValidator
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

    // Image URL validation using BaseValidator
    if (data.image_url && !this.isValidUrl(data.image_url)) {
      errors.push(
        this.createError(
          "image_url",
          "Invalid image URL format",
          VALIDATION_ERROR_CODES.INVALID_URL
        )
      );
    }

    // Category validation using BaseValidator enum validation
    if (
      data.category &&
      !this.isValidEnum(data.category, this.VALID_CATEGORIES)
    ) {
      errors.push(
        this.createError(
          "category",
          `Invalid product category. Must be one of: ${this.VALID_CATEGORIES.join(
            ", "
          )}`,
          "INVALID_CATEGORY"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateRequired(data: Partial<Product>): ValidationResult {
    return super.validateRequired(data, this.REQUIRED_FIELDS);
  }
}
