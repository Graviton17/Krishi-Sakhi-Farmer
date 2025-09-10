import { BUSINESS_RULES } from "../config";
import { logger } from "../logger";
import { Certification, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export interface CertificationCreateData {
  farmer_id: string;
  certification_type: string;
  certificate_number: string;
  issuing_body: string;
  issue_date: string;
  expiry_date: string;
  document_urls?: string[];
  verification_notes?: string;
}

export interface CertificationUpdateData {
  certification_type?: string;
  certificate_number?: string;
  issuing_body?: string;
  issue_date?: string;
  expiry_date?: string;
  document_urls?: string[];
  verification_notes?: string;
}

export class CertificationsValidator extends BaseValidator<Certification> {
  /**
   * Validate certification creation data
   */
  validateCreate(data: CertificationCreateData): ValidationResult {
    try {
      const errors: ValidationError[] = [];

      // Use BaseValidator methods for common validations
      this.addUUIDValidation(errors, "farmer_id", data.farmer_id, true);

      this.addRequiredFieldValidation(
        errors,
        "certification_type",
        data.certification_type
      );
      if (
        data.certification_type &&
        !this.isValidEnum(data.certification_type, [
          ...BUSINESS_RULES.CERTIFICATION.ALLOWED_TYPES,
        ])
      ) {
        errors.push(
          this.createError(
            "certification_type",
            `Invalid certification type. Must be one of: ${BUSINESS_RULES.CERTIFICATION.ALLOWED_TYPES.join(
              ", "
            )}`,
            VALIDATION_ERROR_CODES.INVALID_TYPE
          )
        );
      }

      this.addRequiredFieldValidation(
        errors,
        "certificate_number",
        data.certificate_number
      );
      if (
        data.certificate_number &&
        !this.isValidString(data.certificate_number, 5, 50)
      ) {
        errors.push(
          this.createError(
            "certificate_number",
            "Certificate number must be between 5-50 characters",
            VALIDATION_ERROR_CODES.INVALID_LENGTH
          )
        );
      }

      this.addRequiredFieldValidation(
        errors,
        "issuing_body",
        data.issuing_body
      );
      if (data.issuing_body && !this.isValidString(data.issuing_body, 2, 100)) {
        errors.push(
          this.createError(
            "issuing_body",
            "Issuing body must be between 2-100 characters",
            VALIDATION_ERROR_CODES.INVALID_LENGTH
          )
        );
      }

      this.addDateValidation(errors, "issue_date", data.issue_date, true);
      this.addDateValidation(errors, "expiry_date", data.expiry_date, true);

      // Validate date logic using BaseValidator helper
      if (
        data.issue_date &&
        data.expiry_date &&
        this.isValidDate(data.issue_date) &&
        this.isValidDate(data.expiry_date)
      ) {
        if (!this.isDateAfter(data.expiry_date, data.issue_date)) {
          errors.push(
            this.createError(
              "expiry_date",
              "Expiry date must be after issue date",
              VALIDATION_ERROR_CODES.INVALID_DATE_RANGE
            )
          );
        }

        // Check validity period
        const validityMonths = this.getMonthsDifference(
          new Date(data.issue_date),
          new Date(data.expiry_date)
        );
        if (
          validityMonths >
          BUSINESS_RULES.CERTIFICATION.MAX_VALIDITY_YEARS * 12
        ) {
          errors.push(
            this.createError(
              "expiry_date",
              `Certificate validity cannot exceed ${BUSINESS_RULES.CERTIFICATION.MAX_VALIDITY_YEARS} years`,
              "VALIDITY_TOO_LONG"
            )
          );
        }

        if (validityMonths < BUSINESS_RULES.CERTIFICATION.MIN_VALIDITY_MONTHS) {
          errors.push(
            this.createError(
              "expiry_date",
              `Certificate validity must be at least ${BUSINESS_RULES.CERTIFICATION.MIN_VALIDITY_MONTHS} months`,
              VALIDATION_ERROR_CODES.VALIDITY_TOO_SHORT
            )
          );
        }
      }

      // Validate document URLs if provided
      // Validate optional fields using BaseValidator methods
      if (data.document_urls && data.document_urls.length > 0) {
        const maxDocuments = 10; // Reasonable limit for document uploads
        if (data.document_urls.length > maxDocuments) {
          errors.push(
            this.createError(
              "document_urls",
              `Maximum ${maxDocuments} documents allowed`,
              "TOO_MANY_DOCUMENTS"
            )
          );
        }

        data.document_urls.forEach((url, index) => {
          if (!this.isValidUrl(url)) {
            errors.push(
              this.createError(
                `document_urls[${index}]`,
                "Invalid document URL",
                "INVALID_URL"
              )
            );
          }
        });
      } else if (this.requiresDocuments(data.certification_type)) {
        errors.push(
          this.createError(
            "document_urls",
            "Document upload is required for this certification type",
            "DOCUMENTS_REQUIRED"
          )
        );
      }

      // Validate verification notes length
      if (
        data.verification_notes &&
        !this.isValidString(
          data.verification_notes,
          0,
          BUSINESS_RULES.CERTIFICATION.MAX_NOTES_LENGTH
        )
      ) {
        errors.push(
          this.createError(
            "verification_notes",
            `Verification notes cannot exceed ${BUSINESS_RULES.CERTIFICATION.MAX_NOTES_LENGTH} characters`,
            "NOTES_TOO_LONG"
          )
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating certification creation:", error as Error);
      return {
        isValid: false,
        errors: [
          this.createError(
            "general",
            "Validation error occurred",
            "VALIDATION_ERROR"
          ),
        ],
      };
    }
  }

  /**
   * Validate certification update data
   */
  validateCertificationUpdate(
    certificationId: string,
    data: CertificationUpdateData,
    currentStatus: string
  ): ValidationResult {
    try {
      const errors: ValidationError[] = [];

      // Check if certification can be updated in current status
      if (!this.canUpdateInStatus(currentStatus)) {
        errors.push(
          this.createError(
            "status",
            `Cannot update certification in ${currentStatus} status`,
            "UPDATE_NOT_ALLOWED"
          )
        );
        return { isValid: false, errors };
      }

      // Validate certification type if provided
      if (data.certification_type !== undefined) {
        if (!data.certification_type.trim()) {
          errors.push(
            this.createError(
              "certification_type",
              "Certification type cannot be empty",
              "REQUIRED"
            )
          );
        } else if (!this.isValidCertificationType(data.certification_type)) {
          errors.push(
            this.createError(
              "certification_type",
              `Invalid certification type. Must be one of: ${BUSINESS_RULES.CERTIFICATION.ALLOWED_TYPES.join(
                ", "
              )}`,
              "INVALID_TYPE"
            )
          );
        }
      }

      // Validate certificate number if provided
      if (data.certificate_number !== undefined) {
        if (!data.certificate_number.trim()) {
          errors.push(
            this.createError(
              "certificate_number",
              "Certificate number cannot be empty",
              "REQUIRED"
            )
          );
        } else if (!this.isValidCertificateNumber(data.certificate_number)) {
          errors.push(
            this.createError(
              "certificate_number",
              "Certificate number must be alphanumeric and between 5-50 characters",
              "INVALID_FORMAT"
            )
          );
        }
      }

      // Validate issuing body if provided
      if (data.issuing_body !== undefined) {
        if (!data.issuing_body.trim()) {
          errors.push(
            this.createError(
              "issuing_body",
              "Issuing body cannot be empty",
              "REQUIRED"
            )
          );
        } else if (
          data.issuing_body.length < 2 ||
          data.issuing_body.length > 100
        ) {
          errors.push(
            this.createError(
              "issuing_body",
              "Issuing body must be between 2-100 characters",
              "INVALID_LENGTH"
            )
          );
        }
      }

      // Validate dates if provided
      if (data.issue_date !== undefined && !this.isValidDate(data.issue_date)) {
        errors.push(
          this.createError(
            "issue_date",
            "Invalid issue date format",
            "INVALID_FORMAT"
          )
        );
      }

      if (
        data.expiry_date !== undefined &&
        !this.isValidDate(data.expiry_date)
      ) {
        errors.push(
          this.createError(
            "expiry_date",
            "Invalid expiry date format",
            "INVALID_FORMAT"
          )
        );
      }

      // Validate date logic if both dates are provided or updated
      if (data.issue_date && data.expiry_date) {
        const issueDate = new Date(data.issue_date);
        const expiryDate = new Date(data.expiry_date);

        if (expiryDate <= issueDate) {
          errors.push(
            this.createError(
              "expiry_date",
              "Expiry date must be after issue date",
              "INVALID_DATE_RANGE"
            )
          );
        }

        const validityMonths = this.getMonthsDifference(issueDate, expiryDate);
        if (
          validityMonths >
          BUSINESS_RULES.CERTIFICATION.MAX_VALIDITY_YEARS * 12
        ) {
          errors.push(
            this.createError(
              "expiry_date",
              `Certificate validity cannot exceed ${BUSINESS_RULES.CERTIFICATION.MAX_VALIDITY_YEARS} years`,
              "VALIDITY_TOO_LONG"
            )
          );
        }
      }

      // Validate document URLs if provided
      if (data.document_urls !== undefined) {
        const maxDocs = 10;
        if (data.document_urls.length > maxDocs) {
          errors.push(
            this.createError(
              "document_urls",
              `Maximum ${maxDocs} documents allowed`,
              "TOO_MANY_DOCUMENTS"
            )
          );
        }

        data.document_urls.forEach((url, index) => {
          if (!this.isValidUrl(url)) {
            errors.push(
              this.createError(
                `document_urls[${index}]`,
                "Invalid document URL",
                "INVALID_URL"
              )
            );
          }
        });
      }

      // Validate verification notes if provided
      if (
        data.verification_notes !== undefined &&
        data.verification_notes.length >
          BUSINESS_RULES.CERTIFICATION.MAX_NOTES_LENGTH
      ) {
        errors.push(
          this.createError(
            "verification_notes",
            `Verification notes cannot exceed ${BUSINESS_RULES.CERTIFICATION.MAX_NOTES_LENGTH} characters`,
            "NOTES_TOO_LONG"
          )
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating certification update:", error as Error);
      return {
        isValid: false,
        errors: [
          this.createError(
            "general",
            "Validation error occurred",
            "VALIDATION_ERROR"
          ),
        ],
      };
    }
  }

  /**
   * Validate status transition
   */
  validateStatusTransition(
    currentStatus: string,
    newStatus: string
  ): ValidationResult {
    try {
      const errors: ValidationError[] = [];

      if (
        !(
          BUSINESS_RULES.CERTIFICATION.ALLOWED_STATUSES as readonly string[]
        ).includes(newStatus)
      ) {
        errors.push(
          this.createError(
            "status",
            `Invalid status. Must be one of: ${BUSINESS_RULES.CERTIFICATION.ALLOWED_STATUSES.join(
              ", "
            )}`,
            "INVALID_STATUS"
          )
        );
      }

      // Check valid status transitions
      const validTransitions = this.getValidStatusTransitions(currentStatus);
      if (!validTransitions.includes(newStatus)) {
        errors.push(
          this.createError(
            "status",
            `Invalid status transition from ${currentStatus} to ${newStatus}`,
            "INVALID_TRANSITION"
          )
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating status transition:", error as Error);
      return {
        isValid: false,
        errors: [
          this.createError(
            "general",
            "Validation error occurred",
            "VALIDATION_ERROR"
          ),
        ],
      };
    }
  }

  /**
   * Validate verification data
   */
  validateVerification(
    verificationNotes?: string,
    verifiedBy?: string
  ): ValidationResult {
    try {
      const errors: ValidationError[] = [];

      if (verifiedBy && verifiedBy.trim().length < 2) {
        errors.push(
          this.createError(
            "verified_by",
            "Verified by must be at least 2 characters",
            "INVALID_LENGTH"
          )
        );
      }

      if (
        verificationNotes &&
        verificationNotes.length > BUSINESS_RULES.CERTIFICATION.MAX_NOTES_LENGTH
      ) {
        errors.push(
          this.createError(
            "verification_notes",
            `Verification notes cannot exceed ${BUSINESS_RULES.CERTIFICATION.MAX_NOTES_LENGTH} characters`,
            "NOTES_TOO_LONG"
          )
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating verification data:", error as Error);
      return {
        isValid: false,
        errors: [
          this.createError(
            "general",
            "Validation error occurred",
            "VALIDATION_ERROR"
          ),
        ],
      };
    }
  }

  // Helper methods

  private isValidCertificationType(type: string): boolean {
    return (
      BUSINESS_RULES.CERTIFICATION.ALLOWED_TYPES as readonly string[]
    ).includes(type);
  }

  private isValidCertificateNumber(certificateNumber: string): boolean {
    const regex = /^[A-Za-z0-9\-_]{5,50}$/;
    return regex.test(certificateNumber);
  }

  private requiresDocuments(certificationType: string): boolean {
    // All certification types require documents for verification
    return (
      BUSINESS_RULES.CERTIFICATION.ALLOWED_TYPES as readonly string[]
    ).includes(certificationType);
  }

  private canUpdateInStatus(status: string): boolean {
    // Can update in pending status, limited updates in other statuses
    return this.isValidEnum(status, ["pending", "under_review"]);
  }

  private getValidStatusTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      pending: ["verified", "rejected"],
      verified: ["expired", "suspended"],
      rejected: ["pending"],
      expired: ["pending"], // Can re-apply
      suspended: ["verified", "rejected"],
    };

    return transitions[currentStatus] || [];
  }
}
