import { BUSINESS_RULES } from "../config";
import { Message, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export class MessagesValidator extends BaseValidator<Message> {
  private readonly VALID_STATUSES = ["sent", "delivered", "read", "deleted"];

  /**
   * Validate message creation data
   */
  validateCreate(data: {
    sender_id?: string;
    receiver_id?: string;
    content?: string;
    order_id?: string;
    attachment_urls?: string[];
    status?: string;
  }): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    // Required fields with UUID validation
    if (!data.sender_id) {
      errors.push(
        this.createError("sender_id", "Sender ID is required", "REQUIRED")
      );
    } else if (!this.isValidUUID(data.sender_id)) {
      errors.push(
        this.createError(
          "sender_id",
          "Invalid sender ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    if (!data.receiver_id) {
      errors.push(
        this.createError("receiver_id", "Receiver ID is required", "REQUIRED")
      );
    } else if (!this.isValidUUID(data.receiver_id)) {
      errors.push(
        this.createError(
          "receiver_id",
          "Invalid receiver ID format",
          VALIDATION_ERROR_CODES.INVALID_UUID
        )
      );
    }

    if (!data.content || data.content.trim().length === 0) {
      errors.push(
        this.createError("content", "Message content is required", "REQUIRED")
      );
    }

    // Content validation using BaseValidator string validation
    if (data.content) {
      if (
        !this.isValidString(
          data.content,
          BUSINESS_RULES.MESSAGE.MIN_CONTENT_LENGTH,
          BUSINESS_RULES.MESSAGE.MAX_CONTENT_LENGTH
        )
      ) {
        if (data.content.length < BUSINESS_RULES.MESSAGE.MIN_CONTENT_LENGTH) {
          errors.push(
            this.createError(
              "content",
              `Message must be at least ${BUSINESS_RULES.MESSAGE.MIN_CONTENT_LENGTH} character long`,
              "MIN_LENGTH"
            )
          );
        } else {
          errors.push(
            this.createError(
              "content",
              `Message cannot exceed ${BUSINESS_RULES.MESSAGE.MAX_CONTENT_LENGTH} characters`,
              "MAX_LENGTH"
            )
          );
        }
      }

      // Use BaseValidator's inappropriate content detection
      if (this.containsInappropriateContent(data.content)) {
        errors.push(
          this.createError(
            "content",
            "Message contains spam or inappropriate content",
            "SPAM"
          )
        );
      }
    }

    // Self-messaging validation
    if (
      data.sender_id &&
      data.receiver_id &&
      data.sender_id === data.receiver_id
    ) {
      errors.push(
        this.createError(
          "receiver_id",
          "Cannot send message to yourself",
          "INVALID"
        )
      );
    }

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

    // Status validation using BaseValidator enum validation
    if (data.status && !this.isValidEnum(data.status, this.VALID_STATUSES)) {
      errors.push(
        this.createError(
          "status",
          `Invalid message status. Must be one of: ${this.VALID_STATUSES.join(
            ", "
          )}`,
          "INVALID_STATUS"
        )
      );
    }

    // Attachment validation using BaseValidator array validation
    if (data.attachment_urls && data.attachment_urls.length > 0) {
      if (
        !this.isValidArray(
          data.attachment_urls,
          0,
          BUSINESS_RULES.MESSAGE.MAX_ATTACHMENTS
        )
      ) {
        errors.push(
          this.createError(
            "attachment_urls",
            `Cannot exceed ${BUSINESS_RULES.MESSAGE.MAX_ATTACHMENTS} attachments`,
            "MAX_COUNT"
          )
        );
      }

      // Validate attachment URLs using BaseValidator URL validation
      data.attachment_urls.forEach((url, index) => {
        if (!this.isValidUrl(url)) {
          errors.push(
            this.createError(
              `attachment_urls[${index}]`,
              "Invalid attachment URL",
              "INVALID_URL"
            )
          );
        }
      });
    }

    // Status validation (already handled above with BaseValidator - remove duplicate)

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate message update data
   */
  validateUpdate(data: {
    content?: string;
    status?: string;
    attachment_urls?: string[];
  }): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    // Content validation using BaseValidator methods (if provided)
    if (data.content !== undefined) {
      if (
        !this.isValidString(
          data.content,
          BUSINESS_RULES.MESSAGE.MIN_CONTENT_LENGTH,
          BUSINESS_RULES.MESSAGE.MAX_CONTENT_LENGTH
        )
      ) {
        if (data.content.length < BUSINESS_RULES.MESSAGE.MIN_CONTENT_LENGTH) {
          errors.push(
            this.createError(
              "content",
              `Message must be at least ${BUSINESS_RULES.MESSAGE.MIN_CONTENT_LENGTH} character long`,
              "MIN_LENGTH"
            )
          );
        } else {
          errors.push(
            this.createError(
              "content",
              `Message cannot exceed ${BUSINESS_RULES.MESSAGE.MAX_CONTENT_LENGTH} characters`,
              "MAX_LENGTH"
            )
          );
        }
      }

      // Use BaseValidator's inappropriate content detection
      if (this.containsInappropriateContent(data.content)) {
        errors.push(
          this.createError(
            "content",
            "Message contains spam or inappropriate content",
            "SPAM"
          )
        );
      }
    }

    // Status validation using BaseValidator enum validation (if provided)
    if (data.status && !this.isValidEnum(data.status, this.VALID_STATUSES)) {
      errors.push(
        this.createError(
          "status",
          `Invalid message status. Must be one of: ${this.VALID_STATUSES.join(
            ", "
          )}`,
          "INVALID_STATUS"
        )
      );
    }

    // Attachment validation (if provided)
    if (data.attachment_urls && data.attachment_urls.length > 0) {
      if (
        data.attachment_urls.length > BUSINESS_RULES.MESSAGE.MAX_ATTACHMENTS
      ) {
        errors.push(
          this.createError(
            "attachment_urls",
            `Cannot exceed ${BUSINESS_RULES.MESSAGE.MAX_ATTACHMENTS} attachments`,
            "MAX_COUNT"
          )
        );
      }

      // Validate attachment URLs using BaseValidator URL validation
      data.attachment_urls.forEach((url, index) => {
        if (!this.isValidUrl(url)) {
          errors.push(
            this.createError(
              `attachment_urls[${index}]`,
              "Invalid attachment URL",
              "INVALID_URL"
            )
          );
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate message search parameters
   */
  validateSearch(data: {
    query?: string;
    limit?: number;
    offset?: number;
  }): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    // Query validation
    if (data.query !== undefined) {
      if (data.query.length < 2) {
        errors.push(
          this.createError(
            "query",
            "Search query must be at least 2 characters long",
            "MIN_LENGTH"
          )
        );
      }

      if (data.query.length > 100) {
        errors.push(
          this.createError(
            "query",
            "Search query cannot exceed 100 characters",
            "MAX_LENGTH"
          )
        );
      }
    }

    // Limit validation
    if (data.limit !== undefined) {
      if (data.limit < 1 || data.limit > 100) {
        errors.push(
          this.createError("limit", "Limit must be between 1 and 100", "RANGE")
        );
      }
    }

    // Offset validation
    if (data.offset !== undefined && data.offset < 0) {
      errors.push(
        this.createError("offset", "Offset cannot be negative", "INVALID")
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate conversation parameters
   */
  validateConversation(data: {
    userId1?: string;
    userId2?: string;
    limit?: number;
    offset?: number;
  }): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    // Required user IDs
    if (!data.userId1) {
      errors.push(
        this.createError("userId1", "First user ID is required", "REQUIRED")
      );
    }

    if (!data.userId2) {
      errors.push(
        this.createError("userId2", "Second user ID is required", "REQUIRED")
      );
    }

    // Same user validation
    if (data.userId1 && data.userId2 && data.userId1 === data.userId2) {
      errors.push(
        this.createError(
          "userId2",
          "Cannot get conversation with yourself",
          "INVALID"
        )
      );
    }

    // Limit validation
    if (data.limit !== undefined) {
      if (data.limit < 1 || data.limit > 100) {
        errors.push(
          this.createError("limit", "Limit must be between 1 and 100", "RANGE")
        );
      }
    }

    // Offset validation
    if (data.offset !== undefined && data.offset < 0) {
      errors.push(
        this.createError("offset", "Offset cannot be negative", "INVALID")
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for spam patterns in message content
   */

  /**
   * Validate bulk message operations
   */
  validateBulkOperation(data: {
    messageIds?: string[];
    operation?: string;
  }): ValidationResult {
    const errors: ValidationResult["errors"] = [];

    if (!data.messageIds || data.messageIds.length === 0) {
      errors.push(
        this.createError("messageIds", "Message IDs are required", "REQUIRED")
      );
    }

    if (data.messageIds && data.messageIds.length > 50) {
      errors.push(
        this.createError(
          "messageIds",
          "Cannot process more than 50 messages at once",
          "MAX_COUNT"
        )
      );
    }

    if (!data.operation) {
      errors.push(
        this.createError("operation", "Operation type is required", "REQUIRED")
      );
    }

    if (
      data.operation &&
      !this.isValidEnum(data.operation, ["read", "delete", "archive"])
    ) {
      errors.push(
        this.createError(
          "operation",
          "Operation must be one of: read, delete, archive",
          "INVALID"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
