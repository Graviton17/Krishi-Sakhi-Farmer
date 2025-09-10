import { BUSINESS_RULES } from "../config";
import { Review, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export class ReviewsValidator extends BaseValidator<Review> {
  /**
   * Validate review creation data
   */
  validateCreate(data: {
    reviewer_id?: string;
    listing_id?: string;
    rating?: number;
    comment?: string;
    status?: string;
  }): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    // Required fields with UUID validation
    if (!data.reviewer_id) {
      errors.push(
        this.createError(
          "reviewer_id",
          "Reviewer ID is required",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    } else if (!this.isValidUUID(data.reviewer_id)) {
      errors.push(
        this.createError(
          "reviewer_id",
          "Invalid reviewer ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    if (!data.listing_id) {
      errors.push(
        this.createError(
          "listing_id",
          "Listing ID is required",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    } else if (!this.isValidUUID(data.listing_id)) {
      errors.push(
        this.createError(
          "listing_id",
          "Invalid listing ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    if (data.rating === undefined || data.rating === null) {
      errors.push(
        this.createError(
          "rating",
          "Rating is required",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    } else {
      // Rating validation
      if (
        data.rating < BUSINESS_RULES.REVIEW.MIN_RATING ||
        data.rating > BUSINESS_RULES.REVIEW.MAX_RATING
      ) {
        errors.push(
          this.createError(
            "rating",
            `Rating must be between ${BUSINESS_RULES.REVIEW.MIN_RATING} and ${BUSINESS_RULES.REVIEW.MAX_RATING}`,
            VALIDATION_ERROR_CODES.INVALID_VALUE
          )
        );
      }

      if (!Number.isInteger(data.rating)) {
        errors.push(
          this.createError(
            "rating",
            "Rating must be a whole number",
            VALIDATION_ERROR_CODES.INVALID_TYPE
          )
        );
      }
    }

    // Comment validation
    if (data.comment) {
      // Use BaseValidator methods for string validation with proper length checks
      if (
        !this.isValidString(
          data.comment,
          BUSINESS_RULES.REVIEW.MIN_COMMENT_LENGTH,
          BUSINESS_RULES.REVIEW.MAX_COMMENT_LENGTH
        )
      ) {
        if (data.comment.length < BUSINESS_RULES.REVIEW.MIN_COMMENT_LENGTH) {
          errors.push(
            this.createError(
              "comment",
              `Comment must be at least ${BUSINESS_RULES.REVIEW.MIN_COMMENT_LENGTH} characters long`,
              "MIN_LENGTH"
            )
          );
        } else {
          errors.push(
            this.createError(
              "comment",
              `Comment cannot exceed ${BUSINESS_RULES.REVIEW.MAX_COMMENT_LENGTH} characters`,
              "MAX_LENGTH"
            )
          );
        }
      }

      // Use BaseValidator's inappropriate content detection
      if (this.containsInappropriateContent(data.comment)) {
        errors.push(
          this.createError(
            "comment",
            "Comment contains inappropriate content",
            VALIDATION_ERROR_CODES.INAPPROPRIATE
          )
        );
      }
    }

    // Status validation using enum validation
    if (
      data.status &&
      !this.isValidEnum(data.status, [
        ...BUSINESS_RULES.REVIEW.ALLOWED_STATUSES,
      ])
    ) {
      errors.push(
        this.createError(
          "status",
          `Status must be one of: ${BUSINESS_RULES.REVIEW.ALLOWED_STATUSES.join(
            ", "
          )}`,
          VALIDATION_ERROR_CODES.INVALID_VALUE
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate review update data
   */
  validateUpdate(data: {
    rating?: number;
    comment?: string;
    status?: string;
  }): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    // Rating validation (if provided)
    if (data.rating !== undefined && data.rating !== null) {
      if (
        !this.isWithinRange(
          data.rating,
          BUSINESS_RULES.REVIEW.MIN_RATING,
          BUSINESS_RULES.REVIEW.MAX_RATING
        )
      ) {
        errors.push(
          this.createError(
            "rating",
            `Rating must be between ${BUSINESS_RULES.REVIEW.MIN_RATING} and ${BUSINESS_RULES.REVIEW.MAX_RATING}`,
            VALIDATION_ERROR_CODES.INVALID_VALUE
          )
        );
      }

      if (!Number.isInteger(data.rating)) {
        errors.push(
          this.createError(
            "rating",
            "Rating must be a whole number",
            VALIDATION_ERROR_CODES.INVALID_TYPE
          )
        );
      }
    }

    // Comment validation (if provided) - use BaseValidator methods
    if (data.comment !== undefined && data.comment !== null) {
      if (
        data.comment &&
        !this.isValidString(
          data.comment,
          BUSINESS_RULES.REVIEW.MIN_COMMENT_LENGTH,
          BUSINESS_RULES.REVIEW.MAX_COMMENT_LENGTH
        )
      ) {
        if (data.comment.length < BUSINESS_RULES.REVIEW.MIN_COMMENT_LENGTH) {
          errors.push(
            this.createError(
              "comment",
              `Comment must be at least ${BUSINESS_RULES.REVIEW.MIN_COMMENT_LENGTH} characters long`,
              "MIN_LENGTH"
            )
          );
        } else {
          errors.push(
            this.createError(
              "comment",
              `Comment cannot exceed ${BUSINESS_RULES.REVIEW.MAX_COMMENT_LENGTH} characters`,
              "MAX_LENGTH"
            )
          );
        }
      }

      // Use BaseValidator's inappropriate content detection
      if (data.comment && this.containsInappropriateContent(data.comment)) {
        errors.push(
          this.createError(
            "comment",
            "Comment contains inappropriate content",
            "INAPPROPRIATE"
          )
        );
      }
    }

    // Status validation (if provided)
    if (
      data.status &&
      !this.isValidEnum(data.status, [
        ...BUSINESS_RULES.REVIEW.ALLOWED_STATUSES,
      ])
    ) {
      errors.push(
        this.createError(
          "status",
          `Status must be one of: ${BUSINESS_RULES.REVIEW.ALLOWED_STATUSES.join(
            ", "
          )}`,
          VALIDATION_ERROR_CODES.INVALID_VALUE
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate review moderation data
   */
  validateModerationUpdate(data: {
    status?: string;
    admin_notes?: string;
  }): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    // Status validation
    if (!data.status) {
      errors.push(
        this.createError(
          "status",
          "Status is required for moderation",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    } else if (
      !this.isValidEnum(data.status, [
        ...BUSINESS_RULES.REVIEW.ALLOWED_STATUSES,
      ])
    ) {
      errors.push(
        this.createError(
          "status",
          `Status must be one of: ${BUSINESS_RULES.REVIEW.ALLOWED_STATUSES.join(
            ", "
          )}`,
          VALIDATION_ERROR_CODES.INVALID_VALUE
        )
      );
    }

    // Admin notes validation - use BaseValidator
    if (data.admin_notes && !this.isValidString(data.admin_notes, 1, 500)) {
      errors.push(
        this.createError(
          "admin_notes",
          "Admin notes cannot exceed 500 characters",
          "MAX_LENGTH"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate rating distribution for suspicious patterns
   */
  validateRatingPattern(ratings: number[]): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    if (ratings.length === 0) {
      return { isValid: true, errors: [] };
    }

    // Check for suspicious rating patterns
    const uniqueRatings = new Set(ratings);

    // Too many identical ratings might indicate fake reviews
    if (ratings.length >= 5 && uniqueRatings.size === 1) {
      errors.push(
        this.createError(
          "ratings",
          "Suspicious rating pattern detected: all identical ratings",
          "SUSPICIOUS"
        )
      );
    }

    // Sudden spike in very high or very low ratings
    const highRatings = ratings.filter((r) => r >= 4).length;
    const lowRatings = ratings.filter((r) => r <= 2).length;
    const highRatio = highRatings / ratings.length;
    const lowRatio = lowRatings / ratings.length;

    if (ratings.length >= 10 && (highRatio > 0.9 || lowRatio > 0.9)) {
      errors.push(
        this.createError(
          "ratings",
          "Suspicious rating pattern detected: unusual distribution",
          "SUSPICIOUS"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
