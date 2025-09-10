import { BUSINESS_RULES } from "../config";
import { Negotiation, ValidationError, ValidationResult } from "../types";
import { BaseValidator } from "./BaseValidator";
import { VALIDATION_ERROR_CODES } from "./ValidationErrorCodes";

export interface CreateNegotiationData {
  order_id: string;
  farmer_id: string;
  buyer_id: string;
  product_id: string;
  original_price: number;
  proposed_price: number;
  farmer_notes?: string;
  buyer_notes?: string;
  expires_at?: string;
}

export interface UpdateNegotiationData {
  proposed_price?: number;
  final_price?: number;
  status?: string;
  farmer_notes?: string;
  buyer_notes?: string;
  expires_at?: string;
}

export interface CounterOfferData {
  proposed_price: number;
  notes?: string;
  expires_at?: string;
}

export interface SearchNegotiationData {
  query: string;
  status?: string;
  farmerId?: string;
  buyerId?: string;
  limit?: number;
}

export interface AcceptNegotiationData {
  final_price: number;
}

export class NegotiationsValidator extends BaseValidator<Negotiation> {
  private readonly validStatuses = BUSINESS_RULES.NEGOTIATION.ALLOWED_STATUSES;
  private readonly maxCounterOffers =
    BUSINESS_RULES.NEGOTIATION.MAX_COUNTER_OFFERS;
  private readonly maxDiscountPercent =
    BUSINESS_RULES.NEGOTIATION.MAX_DISCOUNT_PERCENT;
  private readonly minPriceDifferencePercent =
    BUSINESS_RULES.NEGOTIATION.MIN_PRICE_DIFFERENCE_PERCENT;

  /**
   * Validate negotiation creation data
   */
  validateCreate(data: CreateNegotiationData): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!data.order_id) {
      errors.push(
        this.createError(
          "order_id",
          "Order ID is required",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    }

    if (!data.farmer_id) {
      errors.push(
        this.createError(
          "farmer_id",
          "Farmer ID is required",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    }

    if (!data.buyer_id) {
      errors.push(
        this.createError(
          "buyer_id",
          "Buyer ID is required",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    }

    if (!data.product_id) {
      errors.push(
        this.createError(
          "product_id",
          "Product ID is required",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    }

    // Price validation
    if (typeof data.original_price !== "number" || data.original_price <= 0) {
      errors.push(
        this.createError(
          "original_price",
          "Original price must be a positive number",
          "INVALID_NUMBER"
        )
      );
    }

    if (typeof data.proposed_price !== "number" || data.proposed_price <= 0) {
      errors.push(
        this.createError(
          "proposed_price",
          "Proposed price must be a positive number",
          "INVALID_NUMBER"
        )
      );
    }

    // Validate price difference
    if (data.original_price > 0 && data.proposed_price > 0) {
      const discountPercent =
        ((data.original_price - data.proposed_price) / data.original_price) *
        100;

      if (discountPercent > this.maxDiscountPercent) {
        errors.push(
          this.createError(
            "proposed_price",
            `Discount cannot exceed ${this.maxDiscountPercent}%`,
            "MAX_DISCOUNT_EXCEEDED"
          )
        );
      }

      if (
        Math.abs(discountPercent) < this.minPriceDifferencePercent &&
        data.proposed_price !== data.original_price
      ) {
        errors.push(
          this.createError(
            "proposed_price",
            `Price difference must be at least ${this.minPriceDifferencePercent}%`,
            "MIN_PRICE_DIFFERENCE"
          )
        );
      }
    }

    // Validate notes length
    if (
      data.farmer_notes &&
      data.farmer_notes.length > BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH
    ) {
      errors.push(
        this.createError(
          "farmer_notes",
          `Farmer notes must not exceed ${BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH} characters`,
          "MAX_LENGTH"
        )
      );
    }

    if (
      data.buyer_notes &&
      data.buyer_notes.length > BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH
    ) {
      errors.push(
        this.createError(
          "buyer_notes",
          `Buyer notes must not exceed ${BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH} characters`,
          "MAX_LENGTH"
        )
      );
    }

    // Validate expiry date
    if (data.expires_at && !this.isValidDateString(data.expires_at)) {
      errors.push(
        this.createError(
          "expires_at",
          "Invalid expiry date format",
          "INVALID_DATE"
        )
      );
    }

    // Validate expiry date is in the future
    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      const now = new Date();

      if (expiryDate <= now) {
        errors.push(
          this.createError(
            "expires_at",
            "Expiry date must be in the future",
            "INVALID_DATE_RANGE"
          )
        );
      }

      // Check if expiry is too far in the future (more than 30 days)
      const maxExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (expiryDate > maxExpiryDate) {
        errors.push(
          this.createError(
            "expires_at",
            "Expiry date cannot be more than 30 days in the future",
            "INVALID_DATE_RANGE"
          )
        );
      }
    }

    // Validate that farmer and buyer are different
    if (data.farmer_id === data.buyer_id) {
      errors.push(
        this.createError(
          "buyer_id",
          "Farmer and buyer cannot be the same person",
          "INVALID_RELATIONSHIP"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate negotiation update data
   */
  validateUpdate(data: UpdateNegotiationData): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate proposed price if provided
    if (data.proposed_price !== undefined) {
      if (typeof data.proposed_price !== "number" || data.proposed_price <= 0) {
        errors.push(
          this.createError(
            "proposed_price",
            "Proposed price must be a positive number",
            "INVALID_NUMBER"
          )
        );
      }
    }

    // Validate final price if provided
    if (data.final_price !== undefined) {
      if (typeof data.final_price !== "number" || data.final_price <= 0) {
        errors.push(
          this.createError(
            "final_price",
            "Final price must be a positive number",
            "INVALID_NUMBER"
          )
        );
      }
    }

    // Validate status if provided
    if (
      data.status &&
      !(this.validStatuses as readonly string[]).includes(data.status)
    ) {
      errors.push(
        this.createError(
          "status",
          `Status must be one of: ${this.validStatuses.join(", ")}`,
          "INVALID_VALUE"
        )
      );
    }

    // Validate notes length
    if (
      data.farmer_notes !== undefined &&
      data.farmer_notes &&
      data.farmer_notes.length > BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH
    ) {
      errors.push(
        this.createError(
          "farmer_notes",
          `Farmer notes must not exceed ${BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH} characters`,
          "MAX_LENGTH"
        )
      );
    }

    if (
      data.buyer_notes !== undefined &&
      data.buyer_notes &&
      data.buyer_notes.length > BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH
    ) {
      errors.push(
        this.createError(
          "buyer_notes",
          `Buyer notes must not exceed ${BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH} characters`,
          "MAX_LENGTH"
        )
      );
    }

    // Validate expiry date if provided
    if (data.expires_at && !this.isValidDateString(data.expires_at)) {
      errors.push(
        this.createError(
          "expires_at",
          "Invalid expiry date format",
          "INVALID_DATE"
        )
      );
    }

    // Validate expiry date is in the future
    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      const now = new Date();

      if (expiryDate <= now) {
        errors.push(
          this.createError(
            "expires_at",
            "Expiry date must be in the future",
            "INVALID_DATE_RANGE"
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate counter offer data
   */
  validateCounterOffer(
    data: CounterOfferData,
    currentCounterOffers: number,
    originalPrice: number
  ): ValidationResult {
    const errors: ValidationError[] = [];

    // Check counter offer limit
    if (currentCounterOffers >= this.maxCounterOffers) {
      errors.push(
        this.createError(
          "counter_offers",
          `Maximum ${this.maxCounterOffers} counter offers allowed`,
          "MAX_COUNTER_OFFERS_EXCEEDED"
        )
      );
    }

    // Validate proposed price
    if (typeof data.proposed_price !== "number" || data.proposed_price <= 0) {
      errors.push(
        this.createError(
          "proposed_price",
          "Proposed price must be a positive number",
          "INVALID_NUMBER"
        )
      );
    }

    // Validate price against original price
    if (originalPrice > 0 && data.proposed_price > 0) {
      const discountPercent =
        ((originalPrice - data.proposed_price) / originalPrice) * 100;

      if (discountPercent > this.maxDiscountPercent) {
        errors.push(
          this.createError(
            "proposed_price",
            `Discount cannot exceed ${this.maxDiscountPercent}%`,
            "MAX_DISCOUNT_EXCEEDED"
          )
        );
      }
    }

    // Validate notes length
    if (
      data.notes &&
      data.notes.length > BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH
    ) {
      errors.push(
        this.createError(
          "notes",
          `Notes must not exceed ${BUSINESS_RULES.NEGOTIATION.MAX_NOTES_LENGTH} characters`,
          "MAX_LENGTH"
        )
      );
    }

    // Validate expiry date
    if (data.expires_at && !this.isValidDateString(data.expires_at)) {
      errors.push(
        this.createError(
          "expires_at",
          "Invalid expiry date format",
          "INVALID_DATE"
        )
      );
    }

    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      const now = new Date();

      if (expiryDate <= now) {
        errors.push(
          this.createError(
            "expires_at",
            "Expiry date must be in the future",
            "INVALID_DATE_RANGE"
          )
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate search parameters
   */
  validateSearch(data: SearchNegotiationData): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.query?.trim()) {
      errors.push(
        this.createError(
          "query",
          "Search query is required",
          VALIDATION_ERROR_CODES.REQUIRED
        )
      );
    }

    if (data.query && data.query.trim().length < 2) {
      errors.push(
        this.createError(
          "query",
          "Search query must be at least 2 characters long",
          "MIN_LENGTH"
        )
      );
    }

    if (data.limit !== undefined) {
      if (typeof data.limit !== "number" || data.limit <= 0) {
        errors.push(
          this.createError(
            "limit",
            "Limit must be a positive number",
            "INVALID_NUMBER"
          )
        );
      }

      if (data.limit > 100) {
        errors.push(
          this.createError(
            "limit",
            "Limit cannot exceed 100",
            "MAX_VALUE_EXCEEDED"
          )
        );
      }
    }

    if (
      data.status &&
      !(this.validStatuses as readonly string[]).includes(data.status)
    ) {
      errors.push(
        this.createError(
          "status",
          `Status must be one of: ${this.validStatuses.join(", ")}`,
          "INVALID_VALUE"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate negotiation acceptance
   */
  validateAcceptance(data: AcceptNegotiationData): ValidationResult {
    const errors: ValidationError[] = [];

    if (typeof data.final_price !== "number" || data.final_price <= 0) {
      errors.push(
        this.createError(
          "final_price",
          "Final price must be a positive number",
          "INVALID_NUMBER"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate price change parameters
   */
  validatePriceChange(
    originalPrice: number,
    newPrice: number
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (originalPrice <= 0 || newPrice <= 0) {
      errors.push(
        this.createError(
          "price",
          "Prices must be positive numbers",
          "INVALID_NUMBER"
        )
      );
      return { isValid: false, errors };
    }

    const changePercent =
      Math.abs((originalPrice - newPrice) / originalPrice) * 100;

    if (
      changePercent < this.minPriceDifferencePercent &&
      originalPrice !== newPrice
    ) {
      errors.push(
        this.createError(
          "price",
          `Price change must be at least ${this.minPriceDifferencePercent}%`,
          "MIN_PRICE_DIFFERENCE"
        )
      );
    }

    const discountPercent = ((originalPrice - newPrice) / originalPrice) * 100;
    if (discountPercent > this.maxDiscountPercent) {
      errors.push(
        this.createError(
          "price",
          `Discount cannot exceed ${this.maxDiscountPercent}%`,
          "MAX_DISCOUNT_EXCEEDED"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate negotiation status transition
   */
  validateStatusTransition(
    currentStatus: string,
    newStatus: string
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const validTransitions: Record<string, string[]> = {
      pending: ["accepted", "rejected", "counter_offered", "expired"],
      counter_offered: ["accepted", "rejected", "counter_offered", "expired"],
      accepted: [], // Final state
      rejected: [], // Final state
      expired: ["pending"], // Can be reopened
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      errors.push(
        this.createError(
          "status",
          `Invalid status transition from ${currentStatus} to ${newStatus}`,
          "INVALID_STATUS_TRANSITION"
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if date string is valid
   */
  private isValidDateString(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}
