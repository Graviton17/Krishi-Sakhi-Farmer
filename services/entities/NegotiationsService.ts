import { BUSINESS_RULES, TABLE_NAMES } from "../config";
import { EnhancedBaseService } from "../database";
import { logger } from "../logger";
import { NegotiationsRepository } from "../repositories/NegotiationsRepository";
import { Negotiation, ServiceErrorCode, ServiceResponse } from "../types";
import { NegotiationsValidator } from "../validators/NegotiationsValidator";

interface CreateNegotiationData {
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

interface UpdateNegotiationData {
  proposed_price?: number;
  final_price?: number;
  status?: string;
  farmer_notes?: string;
  buyer_notes?: string;
  expires_at?: string;
}

interface CounterOfferData {
  proposed_price: number;
  notes?: string;
  expires_at?: string;
}

export class NegotiationsService extends EnhancedBaseService<Negotiation> {
  private negotiationsValidator: NegotiationsValidator;

  constructor() {
    const repository = new NegotiationsRepository("negotiations");
    super(repository, "Negotiation");
    this.negotiationsValidator = new NegotiationsValidator();
  }

  protected getTableName(): string {
    return TABLE_NAMES.NEGOTIATIONS;
  }

  /**
   * Create a new negotiation
   */
  async createNegotiation(
    data: CreateNegotiationData
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("createNegotiation", {
        orderId: data.order_id,
        farmerId: data.farmer_id,
        buyerId: data.buyer_id,
        originalPrice: data.original_price,
        proposedPrice: data.proposed_price,
      });

      // Validate input data
      const validation = this.negotiationsValidator.validateCreate(data);
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid negotiation data",
          validation.errors,
          "createNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      // Set default expiry if not provided
      let expiresAt = data.expires_at;
      if (!expiresAt) {
        const now = new Date();
        const defaultExpiry = new Date(
          now.getTime() +
            BUSINESS_RULES.NEGOTIATION.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000
        );
        expiresAt = defaultExpiry.toISOString();
      }

      // Create negotiation data
      const negotiationData = {
        ...data,
        status: "pending",
        counter_offer_count: 0,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const repository = this.repository as NegotiationsRepository;
      const result = await repository.create(negotiationData);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "createNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(
        `Negotiation created for order ${data.order_id} between farmer ${data.farmer_id} and buyer ${data.buyer_id}`
      );
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error("Error creating negotiation:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "createNegotiation"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Update negotiation
   */
  async updateNegotiation(
    id: string,
    data: UpdateNegotiationData
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("updateNegotiation", {
        id,
        updates: Object.keys(data),
      });

      // Validate update data
      const validation = this.negotiationsValidator.validateUpdate(data);
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid update data",
          validation.errors,
          "updateNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if negotiation exists
      const existingResult = await this.repository.findById(id);
      if (existingResult.error || !existingResult.data) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Negotiation not found",
          [],
          "updateNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      const currentNegotiation = existingResult.data;

      // Validate status transition if status is being updated
      if (data.status && data.status !== currentNegotiation.status) {
        const statusValidation =
          this.negotiationsValidator.validateStatusTransition(
            currentNegotiation.status,
            data.status
          );
        if (!statusValidation.isValid) {
          const serviceError = this.createError(
            ServiceErrorCode.VALIDATION_ERROR,
            "Invalid status transition",
            statusValidation.errors,
            "updateNegotiation"
          );
          return this.createResponse(null, serviceError);
        }
      }

      // Update negotiation
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const result = await this.repository.update(id, updateData);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "updateNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(`Negotiation ${id} updated successfully`);
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error(`Error updating negotiation ${id}:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "updateNegotiation"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Create counter offer
   */
  async createCounterOffer(
    id: string,
    data: CounterOfferData,
    userId: string
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("createCounterOffer", {
        id,
        userId,
        proposedPrice: data.proposed_price,
      });

      // Check if negotiation exists
      const existingResult = await this.repository.findById(id);
      if (existingResult.error || !existingResult.data) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Negotiation not found",
          [],
          "createCounterOffer"
        );
        return this.createResponse(null, serviceError);
      }

      const currentNegotiation = existingResult.data;

      // Check if user is authorized (farmer or buyer)
      if (
        currentNegotiation.farmer_id !== userId &&
        currentNegotiation.buyer_id !== userId
      ) {
        const serviceError = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You are not authorized to make counter offers for this negotiation",
          [],
          "createCounterOffer"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if negotiation is in a state that allows counter offers
      if (!["pending", "counter_offered"].includes(currentNegotiation.status)) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Counter offers can only be made on pending or counter-offered negotiations",
          [],
          "createCounterOffer"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if negotiation has expired
      if (
        currentNegotiation.expires_at &&
        new Date(currentNegotiation.expires_at) < new Date()
      ) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Cannot make counter offer on expired negotiation",
          [],
          "createCounterOffer"
        );
        return this.createResponse(null, serviceError);
      }

      // Validate counter offer
      const validation = this.negotiationsValidator.validateCounterOffer(
        data,
        currentNegotiation.counter_offer_count,
        currentNegotiation.original_price
      );
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid counter offer data",
          validation.errors,
          "createCounterOffer"
        );
        return this.createResponse(null, serviceError);
      }

      // Set default expiry if not provided
      let expiresAt = data.expires_at;
      if (!expiresAt) {
        const now = new Date();
        const defaultExpiry = new Date(
          now.getTime() +
            BUSINESS_RULES.NEGOTIATION.DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000
        );
        expiresAt = defaultExpiry.toISOString();
      }

      const repository = this.repository as NegotiationsRepository;
      const result = await repository.createCounterOffer(
        id,
        data.proposed_price,
        data.notes,
        expiresAt
      );

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "createCounterOffer"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(
        `Counter offer created for negotiation ${id} by user ${userId}`
      );
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error(
        `Error creating counter offer for negotiation ${id}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "createCounterOffer"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Accept negotiation
   */
  async acceptNegotiation(
    id: string,
    userId: string
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("acceptNegotiation", { id, userId });

      // Check if negotiation exists
      const existingResult = await this.repository.findById(id);
      if (existingResult.error || !existingResult.data) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Negotiation not found",
          [],
          "acceptNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      const currentNegotiation = existingResult.data;

      // Check if user is authorized (farmer or buyer)
      if (
        currentNegotiation.farmer_id !== userId &&
        currentNegotiation.buyer_id !== userId
      ) {
        const serviceError = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You are not authorized to accept this negotiation",
          [],
          "acceptNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if negotiation can be accepted
      if (!["pending", "counter_offered"].includes(currentNegotiation.status)) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Only pending or counter-offered negotiations can be accepted",
          [],
          "acceptNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if negotiation has expired
      if (
        currentNegotiation.expires_at &&
        new Date(currentNegotiation.expires_at) < new Date()
      ) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Cannot accept expired negotiation",
          [],
          "acceptNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      const repository = this.repository as NegotiationsRepository;
      const result = await repository.updateStatus(
        id,
        "accepted",
        currentNegotiation.proposed_price
      );

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "acceptNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(`Negotiation ${id} accepted by user ${userId}`);
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error(`Error accepting negotiation ${id}:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "acceptNegotiation"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Reject negotiation
   */
  async rejectNegotiation(
    id: string,
    userId: string
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("rejectNegotiation", { id, userId });

      // Check if negotiation exists
      const existingResult = await this.repository.findById(id);
      if (existingResult.error || !existingResult.data) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Negotiation not found",
          [],
          "rejectNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      const currentNegotiation = existingResult.data;

      // Check if user is authorized (farmer or buyer)
      if (
        currentNegotiation.farmer_id !== userId &&
        currentNegotiation.buyer_id !== userId
      ) {
        const serviceError = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You are not authorized to reject this negotiation",
          [],
          "rejectNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if negotiation can be rejected
      if (!["pending", "counter_offered"].includes(currentNegotiation.status)) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Only pending or counter-offered negotiations can be rejected",
          [],
          "rejectNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      const repository = this.repository as NegotiationsRepository;
      const result = await repository.updateStatus(id, "rejected");

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "rejectNegotiation"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(`Negotiation ${id} rejected by user ${userId}`);
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error(`Error rejecting negotiation ${id}:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "rejectNegotiation"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Get negotiations for an order
   */
  async getOrderNegotiations(orderId: string): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getOrderNegotiations", { orderId });

      const repository = this.repository as NegotiationsRepository;
      const negotiations = await repository.findByOrder(orderId);

      return this.createResponse(negotiations, null);
    } catch (error) {
      logger.error(
        `Error getting negotiations for order ${orderId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getOrderNegotiations"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get negotiations for a farmer
   */
  async getFarmerNegotiations(
    farmerId: string,
    status?: string,
    limit: number = 50
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getFarmerNegotiations", {
        farmerId,
        status,
        limit,
      });

      // Validate status if provided
      if (status) {
        const allowedStatuses = BUSINESS_RULES.NEGOTIATION
          .ALLOWED_STATUSES as readonly string[];
        if (!allowedStatuses.includes(status)) {
          const serviceError = this.createError(
            ServiceErrorCode.VALIDATION_ERROR,
            `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
            [],
            "getFarmerNegotiations"
          );
          return this.createResponse<any[]>([], serviceError);
        }
      }

      const repository = this.repository as NegotiationsRepository;
      const negotiations = await repository.findByFarmer(
        farmerId,
        status,
        limit
      );

      return this.createResponse(negotiations, null);
    } catch (error) {
      logger.error(
        `Error getting negotiations for farmer ${farmerId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getFarmerNegotiations"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get negotiations for a buyer
   */
  async getBuyerNegotiations(
    buyerId: string,
    status?: string,
    limit: number = 50
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getBuyerNegotiations", { buyerId, status, limit });

      // Validate status if provided
      if (status) {
        const allowedStatuses = BUSINESS_RULES.NEGOTIATION
          .ALLOWED_STATUSES as readonly string[];
        if (!allowedStatuses.includes(status)) {
          const serviceError = this.createError(
            ServiceErrorCode.VALIDATION_ERROR,
            `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
            [],
            "getBuyerNegotiations"
          );
          return this.createResponse<any[]>([], serviceError);
        }
      }

      const repository = this.repository as NegotiationsRepository;
      const negotiations = await repository.findByBuyer(buyerId, status, limit);

      return this.createResponse(negotiations, null);
    } catch (error) {
      logger.error(
        `Error getting negotiations for buyer ${buyerId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getBuyerNegotiations"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get active negotiations
   */
  async getActiveNegotiations(
    limit: number = 100
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getActiveNegotiations", { limit });

      const repository = this.repository as NegotiationsRepository;
      const negotiations = await repository.findActiveNegotiations(limit);

      return this.createResponse(negotiations, null);
    } catch (error) {
      logger.error("Error getting active negotiations:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getActiveNegotiations"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get expired negotiations
   */
  async getExpiredNegotiations(): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getExpiredNegotiations", {});

      const repository = this.repository as NegotiationsRepository;
      const negotiations = await repository.findExpiredNegotiations();

      return this.createResponse(negotiations, null);
    } catch (error) {
      logger.error("Error getting expired negotiations:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getExpiredNegotiations"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get negotiations expiring soon
   */
  async getNegotiationsExpiringSoon(): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getNegotiationsExpiringSoon", {});

      const repository = this.repository as NegotiationsRepository;
      const negotiations = await repository.findNegotiationsExpiringSoon();

      return this.createResponse(negotiations, null);
    } catch (error) {
      logger.error("Error getting negotiations expiring soon:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getNegotiationsExpiringSoon"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get negotiation statistics
   */
  async getNegotiationStats(
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("getNegotiationStats", { startDate, endDate });

      // Validate dates
      if (!startDate || !endDate) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Start date and end date are required",
          [],
          "getNegotiationStats"
        );
        return this.createResponse(null, serviceError);
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid date format",
          [],
          "getNegotiationStats"
        );
        return this.createResponse(null, serviceError);
      }

      if (start > end) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Start date must be before end date",
          [],
          "getNegotiationStats"
        );
        return this.createResponse(null, serviceError);
      }

      const repository = this.repository as NegotiationsRepository;
      const stats = await repository.getNegotiationStats(startDate, endDate);

      return this.createResponse(stats, null);
    } catch (error) {
      logger.error("Error getting negotiation statistics:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getNegotiationStats"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Search negotiations
   */
  async searchNegotiations(
    query: string,
    status?: string,
    farmerId?: string,
    buyerId?: string,
    limit: number = 20
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("searchNegotiations", {
        query: query.length,
        status,
        farmerId,
        buyerId,
        limit,
      });

      // Validate search parameters
      const validation = this.negotiationsValidator.validateSearch({
        query,
        status,
        farmerId,
        buyerId,
        limit,
      });
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid search parameters",
          validation.errors,
          "searchNegotiations"
        );
        return this.createResponse<any[]>([], serviceError);
      }

      const repository = this.repository as NegotiationsRepository;
      const negotiations = await repository.searchNegotiations(
        query,
        status,
        farmerId,
        buyerId,
        limit
      );

      return this.createResponse(negotiations, null);
    } catch (error) {
      logger.error("Error searching negotiations:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "searchNegotiations"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Auto-expire negotiations
   */
  async autoExpireNegotiations(): Promise<
    ServiceResponse<{ expired_count: number }>
  > {
    try {
      this.logBusinessEvent("autoExpireNegotiations", {});

      const repository = this.repository as NegotiationsRepository;
      const expiredNegotiations = await repository.findExpiredNegotiations();

      let expiredCount = 0;

      for (const negotiation of expiredNegotiations) {
        try {
          await repository.updateStatus(negotiation.id, "expired");
          expiredCount++;
        } catch (error) {
          logger.error(
            `Error expiring negotiation ${negotiation.id}:`,
            error as Error
          );
        }
      }

      logger.info(`Auto-expired ${expiredCount} negotiations`);
      return this.createResponse({ expired_count: expiredCount }, null);
    } catch (error) {
      logger.error("Error in auto-expire negotiations:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "autoExpireNegotiations"
      );
      return this.createResponse<{ expired_count: number }>(
        { expired_count: 0 },
        serviceError
      );
    }
  }
}
