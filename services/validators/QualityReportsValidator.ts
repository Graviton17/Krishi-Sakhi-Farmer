import { BUSINESS_RULES } from "../config";
import { logger } from "../logger";
import { QualityReport, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export interface QualityReportCreateData {
  product_id: string;
  inspector_id: string;
  farmer_id: string;
  report_date: string;
  overall_grade: string;
  overall_score: number;
  parameters: Record<string, any>;
  defects_found?: string[];
  defect_percentage: number;
  quality_notes: string;
  recommendations?: string;
}

export interface QualityReportUpdateData {
  overall_grade?: string;
  overall_score?: number;
  parameters?: Record<string, any>;
  defects_found?: string[];
  defect_percentage?: number;
  quality_notes?: string;
  recommendations?: string;
}

export class QualityReportsValidator extends BaseValidator<QualityReport> {
  /**
   * Validate quality report creation data
   */
  validateCreate(data: QualityReportCreateData): ValidationResult {
    try {
      const errors: ValidationError[] = [];

      // Validate required fields
      if (!data.product_id?.trim()) {
        errors.push(
          this.createError(
            "product_id",
            "Product ID is required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      }

      if (!data.inspector_id?.trim()) {
        errors.push(
          this.createError(
            "inspector_id",
            "Inspector ID is required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      }

      if (!data.farmer_id?.trim()) {
        errors.push(
          this.createError(
            "farmer_id",
            "Farmer ID is required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      }

      if (!data.report_date) {
        errors.push(
          this.createError(
            "report_date",
            "Report date is required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      } else if (!this.isValidDate(data.report_date)) {
        errors.push(
          this.createError(
            "report_date",
            "Invalid report date format",
            "INVALID_FORMAT"
          )
        );
      } else if (this.isFutureDate(data.report_date)) {
        errors.push(
          this.createError(
            "report_date",
            "Report date cannot be in the future",
            "INVALID_DATE"
          )
        );
      }

      // Validate grade
      if (!data.overall_grade?.trim()) {
        errors.push(
          this.createError(
            "overall_grade",
            "Overall grade is required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      } else if (!this.isValidGrade(data.overall_grade)) {
        errors.push(
          this.createError(
            "overall_grade",
            `Invalid grade. Must be one of: ${BUSINESS_RULES.QUALITY_REPORT.ALLOWED_GRADES.join(
              ", "
            )}`,
            "INVALID_GRADE"
          )
        );
      }

      // Validate score
      if (data.overall_score === undefined || data.overall_score === null) {
        errors.push(
          this.createError(
            "overall_score",
            "Overall score is required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      } else if (!this.isValidScore(data.overall_score)) {
        errors.push(
          this.createError(
            "overall_score",
            `Score must be between ${BUSINESS_RULES.QUALITY_REPORT.MIN_SCORE} and ${BUSINESS_RULES.QUALITY_REPORT.MAX_SCORE}`,
            "INVALID_SCORE"
          )
        );
      }

      // Validate grade-score consistency
      if (data.overall_grade && data.overall_score !== undefined) {
        if (
          !this.isGradeScoreConsistent(data.overall_grade, data.overall_score)
        ) {
          errors.push(
            this.createError(
              "overall_score",
              "Score is not consistent with the assigned grade",
              "INCONSISTENT_GRADE_SCORE"
            )
          );
        }
      }

      // Validate parameters
      if (!data.parameters || typeof data.parameters !== "object") {
        errors.push(
          this.createError(
            "parameters",
            "Parameters object is required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      } else {
        const paramValidation = this.validateParameters(data.parameters);
        if (!paramValidation.isValid) {
          errors.push(...paramValidation.errors);
        }
      }

      // Validate defect percentage
      if (
        data.defect_percentage === undefined ||
        data.defect_percentage === null
      ) {
        errors.push(
          this.createError(
            "defect_percentage",
            "Defect percentage is required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      } else if (data.defect_percentage < 0 || data.defect_percentage > 100) {
        errors.push(
          this.createError(
            "defect_percentage",
            "Defect percentage must be between 0 and 100",
            "INVALID_PERCENTAGE"
          )
        );
      } else if (
        data.defect_percentage >
        BUSINESS_RULES.QUALITY_REPORT.MAX_DEFECT_PERCENTAGE
      ) {
        errors.push(
          this.createError(
            "defect_percentage",
            `Defect percentage cannot exceed ${BUSINESS_RULES.QUALITY_REPORT.MAX_DEFECT_PERCENTAGE}%`,
            "EXCESSIVE_DEFECTS"
          )
        );
      }

      // Validate defects found array if provided
      if (data.defects_found && Array.isArray(data.defects_found)) {
        if (data.defects_found.length > 20) {
          errors.push(
            this.createError(
              "defects_found",
              "Maximum 20 defect types allowed",
              "TOO_MANY_DEFECTS"
            )
          );
        }

        data.defects_found.forEach((defect, index) => {
          if (
            !defect ||
            typeof defect !== "string" ||
            defect.trim().length === 0
          ) {
            errors.push(
              this.createError(
                `defects_found[${index}]`,
                "Defect description cannot be empty",
                "EMPTY_DEFECT"
              )
            );
          } else if (defect.length > 100) {
            errors.push(
              this.createError(
                `defects_found[${index}]`,
                "Defect description cannot exceed 100 characters",
                "DEFECT_TOO_LONG"
              )
            );
          }
        });
      }

      // Validate quality notes
      if (!data.quality_notes?.trim()) {
        errors.push(
          this.createError(
            "quality_notes",
            "Quality notes are required",
            VALIDATION_ERROR_CODES.REQUIRED
          )
        );
      } else if (
        data.quality_notes.length >
        BUSINESS_RULES.QUALITY_REPORT.MAX_NOTES_LENGTH
      ) {
        errors.push(
          this.createError(
            "quality_notes",
            `Quality notes cannot exceed ${BUSINESS_RULES.QUALITY_REPORT.MAX_NOTES_LENGTH} characters`,
            "NOTES_TOO_LONG"
          )
        );
      }

      // Validate recommendations if provided
      if (
        data.recommendations &&
        data.recommendations.length >
          BUSINESS_RULES.QUALITY_REPORT.MAX_NOTES_LENGTH
      ) {
        errors.push(
          this.createError(
            "recommendations",
            `Recommendations cannot exceed ${BUSINESS_RULES.QUALITY_REPORT.MAX_NOTES_LENGTH} characters`,
            "RECOMMENDATIONS_TOO_LONG"
          )
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating quality report creation:", error as Error);
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
   * Standard update validation (BaseValidator interface)
   */
  validateUpdate(data: Partial<QualityReport>): ValidationResult {
    const errors: ValidationError[] = [];

    // Basic validation for partial updates
    if (data.listing_id !== undefined && !data.listing_id?.trim()) {
      errors.push(
        this.createError(
          "listing_id",
          "Listing ID cannot be empty",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    }

    if (
      data.ai_score !== undefined &&
      data.ai_score !== null &&
      (data.ai_score < 0 || data.ai_score > 100)
    ) {
      errors.push(
        this.createError(
          "ai_score",
          "AI score must be between 0 and 100",
          "INVALID_SCORE"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate quality report update data with business logic
   */
  async validateReportUpdate(
    reportId: string,
    data: QualityReportUpdateData,
    currentStatus: string
  ): Promise<ValidationResult> {
    try {
      const errors: ValidationError[] = [];

      // Check if report can be updated in current status
      if (!this.canUpdateInStatus(currentStatus)) {
        errors.push(
          this.createError(
            "status",
            `Cannot update report in ${currentStatus} status`,
            "UPDATE_NOT_ALLOWED"
          )
        );
        return { isValid: false, errors };
      }

      // Validate grade if provided
      if (data.overall_grade !== undefined) {
        if (!data.overall_grade.trim()) {
          errors.push(
            this.createError(
              "overall_grade",
              "Overall grade cannot be empty",
              VALIDATION_ERROR_CODES.REQUIRED
            )
          );
        } else if (!this.isValidGrade(data.overall_grade)) {
          errors.push(
            this.createError(
              "overall_grade",
              `Invalid grade. Must be one of: ${BUSINESS_RULES.QUALITY_REPORT.ALLOWED_GRADES.join(
                ", "
              )}`,
              "INVALID_GRADE"
            )
          );
        }
      }

      // Validate score if provided
      if (data.overall_score !== undefined) {
        if (!this.isValidScore(data.overall_score)) {
          errors.push(
            this.createError(
              "overall_score",
              `Score must be between ${BUSINESS_RULES.QUALITY_REPORT.MIN_SCORE} and ${BUSINESS_RULES.QUALITY_REPORT.MAX_SCORE}`,
              "INVALID_SCORE"
            )
          );
        }
      }

      // Validate grade-score consistency if both provided
      if (data.overall_grade && data.overall_score !== undefined) {
        if (
          !this.isGradeScoreConsistent(data.overall_grade, data.overall_score)
        ) {
          errors.push(
            this.createError(
              "overall_score",
              "Score is not consistent with the assigned grade",
              "INCONSISTENT_GRADE_SCORE"
            )
          );
        }
      }

      // Validate parameters if provided
      if (data.parameters !== undefined) {
        if (!data.parameters || typeof data.parameters !== "object") {
          errors.push(
            this.createError(
              "parameters",
              "Parameters must be a valid object",
              "INVALID_PARAMETERS"
            )
          );
        } else {
          const paramValidation = this.validateParameters(data.parameters);
          if (!paramValidation.isValid) {
            errors.push(...paramValidation.errors);
          }
        }
      }

      // Validate defect percentage if provided
      if (data.defect_percentage !== undefined) {
        if (data.defect_percentage < 0 || data.defect_percentage > 100) {
          errors.push(
            this.createError(
              "defect_percentage",
              "Defect percentage must be between 0 and 100",
              "INVALID_PERCENTAGE"
            )
          );
        }
      }

      // Validate defects found if provided
      if (
        data.defects_found !== undefined &&
        Array.isArray(data.defects_found)
      ) {
        if (data.defects_found.length > 20) {
          errors.push(
            this.createError(
              "defects_found",
              "Maximum 20 defect types allowed",
              "TOO_MANY_DEFECTS"
            )
          );
        }

        data.defects_found.forEach((defect, index) => {
          if (
            !defect ||
            typeof defect !== "string" ||
            defect.trim().length === 0
          ) {
            errors.push(
              this.createError(
                `defects_found[${index}]`,
                "Defect description cannot be empty",
                "EMPTY_DEFECT"
              )
            );
          }
        });
      }

      // Validate quality notes if provided
      if (data.quality_notes !== undefined) {
        if (!data.quality_notes.trim()) {
          errors.push(
            this.createError(
              "quality_notes",
              "Quality notes cannot be empty",
              "REQUIRED"
            )
          );
        } else if (
          data.quality_notes.length >
          BUSINESS_RULES.QUALITY_REPORT.MAX_NOTES_LENGTH
        ) {
          errors.push(
            this.createError(
              "quality_notes",
              `Quality notes cannot exceed ${BUSINESS_RULES.QUALITY_REPORT.MAX_NOTES_LENGTH} characters`,
              "NOTES_TOO_LONG"
            )
          );
        }
      }

      // Validate recommendations if provided
      if (
        data.recommendations !== undefined &&
        data.recommendations.length >
          BUSINESS_RULES.QUALITY_REPORT.MAX_NOTES_LENGTH
      ) {
        errors.push(
          this.createError(
            "recommendations",
            `Recommendations cannot exceed ${BUSINESS_RULES.QUALITY_REPORT.MAX_NOTES_LENGTH} characters`,
            "RECOMMENDATIONS_TOO_LONG"
          )
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating quality report update:", error as Error);
      return {
        isValid: false,
        errors: [
          {
            field: "general",
            message: "Validation error occurred",
            code: "VALIDATION_ERROR",
          },
        ],
      };
    }
  }

  /**
   * Validate status transition
   */
  async validateStatusTransition(
    currentStatus: string,
    newStatus: string
  ): Promise<ValidationResult> {
    try {
      const errors: ValidationError[] = [];

      if (
        !(
          BUSINESS_RULES.QUALITY_REPORT.ALLOWED_STATUSES as readonly string[]
        ).includes(newStatus)
      ) {
        errors.push(
          this.createError(
            "status",
            `Invalid status. Must be one of: ${BUSINESS_RULES.QUALITY_REPORT.ALLOWED_STATUSES.join(
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
   * Validate approval data
   */
  async validateApproval(approvedBy?: string): Promise<ValidationResult> {
    try {
      const errors: ValidationError[] = [];

      if (approvedBy && approvedBy.trim().length < 2) {
        errors.push(
          this.createError(
            "approved_by",
            "Approved by must be at least 2 characters",
            "INVALID_LENGTH"
          )
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error("Error validating approval data:", error as Error);
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

  private isValidGrade(grade: string): boolean {
    return (
      BUSINESS_RULES.QUALITY_REPORT.ALLOWED_GRADES as readonly string[]
    ).includes(grade);
  }

  private isValidScore(score: number): boolean {
    return (
      score >= BUSINESS_RULES.QUALITY_REPORT.MIN_SCORE &&
      score <= BUSINESS_RULES.QUALITY_REPORT.MAX_SCORE
    );
  }

  private isGradeScoreConsistent(grade: string, score: number): boolean {
    // Define score ranges for each grade
    const gradeRanges: Record<string, { min: number; max: number }> = {
      "A+": { min: 95, max: 100 },
      A: { min: 85, max: 94 },
      "B+": { min: 75, max: 84 },
      B: { min: 65, max: 74 },
      C: { min: 50, max: 64 },
      D: { min: 0, max: 49 },
    };

    const range = gradeRanges[grade];
    if (!range) return false;

    return score >= range.min && score <= range.max;
  }

  private validateParameters(
    parameters: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const requiredParams = BUSINESS_RULES.QUALITY_REPORT.REQUIRED_PARAMETERS;

    // Check if all required parameters are present
    requiredParams.forEach((param) => {
      if (!(param in parameters)) {
        errors.push(
          this.createError(
            `parameters.${param}`,
            `Required parameter '${param}' is missing`,
            "MISSING_PARAMETER"
          )
        );
      } else if (
        parameters[param] === null ||
        parameters[param] === undefined ||
        parameters[param] === ""
      ) {
        errors.push(
          this.createError(
            `parameters.${param}`,
            `Parameter '${param}' cannot be empty`,
            "EMPTY_PARAMETER"
          )
        );
      }
    });

    // Validate parameter values (assuming they should be numbers between 0-100)
    Object.keys(parameters).forEach((key) => {
      const value = parameters[key];
      if (typeof value === "number") {
        if (value < 0 || value > 100) {
          errors.push(
            this.createError(
              `parameters.${key}`,
              `Parameter '${key}' must be between 0 and 100`,
              "INVALID_PARAMETER_VALUE"
            )
          );
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private canUpdateInStatus(status: string): boolean {
    // Can update in pending and under_review statuses
    return ["pending", "under_review"].includes(status);
  }

  private getValidStatusTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      pending: ["under_review", "rejected"],
      under_review: ["approved", "rejected", "pending"],
      approved: [], // Final status, no transitions
      rejected: ["pending"], // Can re-submit
    };

    return transitions[currentStatus] || [];
  }
}
