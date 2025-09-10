/**
 * DisputesValidator
 * Validation for dispute operations
 * Implements comprehensive validation rules for dispute management
 */

import { ServiceErrorCode } from "../types";

export interface CreateDisputeData {
  order_id: string;
  claimant_id: string;
  respondent_id: string;
  reason: string;
}

export interface UpdateDisputeData {
  status?: "open" | "under_review" | "resolved" | "closed";
  resolution_notes?: string;
}

export interface DateRangeQuery {
  start_date: string;
  end_date: string;
  status?: string;
}

export class DisputesValidator {
  private errors: {
    code: ServiceErrorCode;
    message: string;
    field?: string;
  }[] = [];
  private warnings: { message: string; field?: string }[] = [];

  private clearErrors(): void {
    this.errors = [];
    this.warnings = [];
  }

  private addError(
    code: ServiceErrorCode,
    message: string,
    field?: string
  ): void {
    this.errors.push({ code, message, field });
  }

  private addWarning(message: string, field?: string): void {
    this.warnings.push({ message, field });
  }

  private throwIfErrors(): void {
    if (this.errors.length > 0) {
      const primaryError = this.errors[0];
      const error = new Error(primaryError.message) as any;
      error.code = primaryError.code;
      error.field = primaryError.field;
      error.validationErrors = this.errors;
      error.validationWarnings = this.warnings;
      throw error;
    }
  }

  /**
   * Validate data for creating dispute
   */
  validateCreate(data: CreateDisputeData): void {
    this.clearErrors();

    // Validate required fields
    if (!data.order_id?.trim()) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Order ID is required",
        "order_id"
      );
    }

    if (!data.claimant_id?.trim()) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Claimant ID is required",
        "claimant_id"
      );
    }

    if (!data.respondent_id?.trim()) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Respondent ID is required",
        "respondent_id"
      );
    }

    if (!data.reason?.trim()) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Dispute reason is required",
        "reason"
      );
    }

    // Validate field formats and constraints
    if (data.order_id) {
      this.validateUUID(data.order_id, "order_id");
    }

    if (data.claimant_id) {
      this.validateUUID(data.claimant_id, "claimant_id");
    }

    if (data.respondent_id) {
      this.validateUUID(data.respondent_id, "respondent_id");
    }

    if (data.reason) {
      this.validateReason(data.reason);
    }

    // Business logic validation
    if (
      data.claimant_id &&
      data.respondent_id &&
      data.claimant_id === data.respondent_id
    ) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Claimant and respondent cannot be the same user",
        "respondent_id"
      );
    }

    this.throwIfErrors();
  }

  /**
   * Validate data for updating dispute
   */
  validateUpdate(data: UpdateDisputeData): void {
    this.clearErrors();

    // At least one field must be provided for update
    if (!data.status && !data.resolution_notes) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "At least one field must be provided for update"
      );
    }

    // Validate provided fields
    if (data.status) {
      this.validateStatus(data.status);
    }

    if (data.resolution_notes) {
      this.validateResolutionNotes(data.resolution_notes);
    }

    this.throwIfErrors();
  }

  /**
   * Validate UUID format
   */
  private validateUUID(uuid: string, fieldName: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        `${fieldName} must be a valid UUID`,
        fieldName
      );
    }
  }

  /**
   * Validate dispute reason
   */
  private validateReason(reason: string): void {
    // Check length
    if (reason.length < 10) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Dispute reason must be at least 10 characters long",
        "reason"
      );
      return;
    }

    if (reason.length > 1000) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Dispute reason cannot exceed 1000 characters",
        "reason"
      );
      return;
    }

    // Check for appropriate content
    const inappropriateWords = ["test", "fake", "dummy"];
    const lowerReason = reason.toLowerCase();

    inappropriateWords.forEach((word) => {
      if (lowerReason.includes(word)) {
        this.addWarning(
          `Dispute reason contains '${word}' which may not be appropriate for a real dispute`,
          "reason"
        );
      }
    });

    // Check for sufficient detail
    if (reason.split(" ").length < 5) {
      this.addWarning(
        "Dispute reason should provide more detailed explanation",
        "reason"
      );
    }
  }

  /**
   * Validate dispute status
   */
  private validateStatus(status: string): void {
    const validStatuses = ["open", "under_review", "resolved", "closed"];

    if (!validStatuses.includes(status)) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        `Status must be one of: ${validStatuses.join(", ")}`,
        "status"
      );
    }
  }

  /**
   * Validate resolution notes
   */
  private validateResolutionNotes(notes: string): void {
    if (notes.length < 5) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Resolution notes must be at least 5 characters long",
        "resolution_notes"
      );
      return;
    }

    if (notes.length > 2000) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Resolution notes cannot exceed 2000 characters",
        "resolution_notes"
      );
      return;
    }
  }

  /**
   * Validate date range query
   */
  validateDateRangeQuery(query: DateRangeQuery): void {
    this.clearErrors();

    // Validate required fields
    if (!query.start_date) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Start date is required",
        "start_date"
      );
    }

    if (!query.end_date) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "End date is required",
        "end_date"
      );
    }

    // Validate date formats
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (query.start_date) {
      try {
        startDate = new Date(query.start_date);
        if (isNaN(startDate.getTime())) {
          this.addError(
            ServiceErrorCode.VALIDATION_ERROR,
            "Start date must be a valid ISO 8601 date string",
            "start_date"
          );
        }
      } catch {
        this.addError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Start date must be a valid date string",
          "start_date"
        );
      }
    }

    if (query.end_date) {
      try {
        endDate = new Date(query.end_date);
        if (isNaN(endDate.getTime())) {
          this.addError(
            ServiceErrorCode.VALIDATION_ERROR,
            "End date must be a valid ISO 8601 date string",
            "end_date"
          );
        }
      } catch {
        this.addError(
          ServiceErrorCode.VALIDATION_ERROR,
          "End date must be a valid date string",
          "end_date"
        );
      }
    }

    // Validate date range logic
    if (startDate && endDate && startDate > endDate) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Start date cannot be after end date",
        "date_range"
      );
    }

    // Validate status if provided
    if (query.status) {
      this.validateStatus(query.status);
    }

    this.throwIfErrors();
  }

  /**
   * Validate status transition
   */
  validateStatusTransition(currentStatus: string, newStatus: string): void {
    this.clearErrors();

    // Define valid status transitions
    const validTransitions: { [key: string]: string[] } = {
      open: ["under_review", "closed"],
      under_review: ["resolved", "closed", "open"],
      resolved: ["closed"],
      closed: [], // Closed disputes cannot be reopened
    };

    if (!validTransitions[currentStatus]) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        `Invalid current status: ${currentStatus}`,
        "current_status"
      );
    } else if (!validTransitions[currentStatus].includes(newStatus)) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        `Cannot transition from '${currentStatus}' to '${newStatus}'. Valid transitions: ${validTransitions[
          currentStatus
        ].join(", ")}`,
        "status"
      );
    }

    // Business rules for status transitions
    if (newStatus === "resolved" && currentStatus !== "under_review") {
      this.addWarning(
        "Disputes should typically be 'under_review' before being resolved",
        "status"
      );
    }

    this.throwIfErrors();
  }

  /**
   * Validate pagination parameters
   */
  validatePaginationParams(limit?: number, offset?: number): void {
    this.clearErrors();

    if (limit !== undefined) {
      if (!Number.isInteger(limit) || limit < 1) {
        this.addError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Limit must be a positive integer",
          "limit"
        );
      } else if (limit > 1000) {
        this.addError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Limit cannot exceed 1000 records",
          "limit"
        );
      }
    }

    if (offset !== undefined) {
      if (!Number.isInteger(offset) || offset < 0) {
        this.addError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Offset must be a non-negative integer",
          "offset"
        );
      }
    }

    this.throwIfErrors();
  }

  /**
   * Validate user ID format
   */
  validateUserId(userId: string, fieldName: string = "user_id"): void {
    this.clearErrors();

    if (!userId?.trim()) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        `${fieldName} is required`,
        fieldName
      );
    } else {
      this.validateUUID(userId, fieldName);
    }

    this.throwIfErrors();
  }

  /**
   * Validate order ID format
   */
  validateOrderId(orderId: string): void {
    this.clearErrors();

    if (!orderId?.trim()) {
      this.addError(
        ServiceErrorCode.VALIDATION_ERROR,
        "Order ID is required",
        "order_id"
      );
    } else {
      this.validateUUID(orderId, "order_id");
    }

    this.throwIfErrors();
  }
}
