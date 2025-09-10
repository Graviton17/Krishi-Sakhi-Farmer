/**
 * DisputesService
 * Service layer for dispute management with business logic orchestration
 * Handles order disputes, status management, and resolution tracking
 */

import { EnhancedBaseService } from "../database";
import { logger } from "../logger";
import {
  Dispute,
  DisputesRepository,
} from "../repositories/DisputesRepository";
import { ServiceErrorCode, ServiceResponse } from "../types";
import {
  CreateDisputeData,
  DisputesValidator,
  UpdateDisputeData,
} from "../validators/DisputesValidator";

export class DisputesService extends EnhancedBaseService<Dispute> {
  private disputesValidator: DisputesValidator;

  constructor() {
    const repository = new DisputesRepository();
    super(repository, "Dispute");
    this.disputesValidator = new DisputesValidator();
  }

  protected getTableName(): string {
    return "disputes";
  }

  /**
   * Create a new dispute
   */
  async createDispute(
    data: CreateDisputeData,
    userId?: string
  ): Promise<ServiceResponse<Dispute>> {
    try {
      logger.info(`Creating dispute for order: ${data.order_id}`, {
        data,
        userId,
      });

      // Validate input data
      this.disputesValidator.validateCreate(data);

      // Business rule: Check if dispute already exists for this order
      const repository = this.repository as DisputesRepository;
      const existingDisputes = await repository.findByOrderId(data.order_id);
      const activeDispute = existingDisputes.find(
        (d: Dispute) => d.status === "open" || d.status === "under_review"
      );

      if (activeDispute) {
        const error = this.createError(
          ServiceErrorCode.DUPLICATE_ERROR,
          "An active dispute already exists for this order"
        );
        return this.createResponse<Dispute>(null, error);
      }

      // Verify claimant authorization
      if (userId && data.claimant_id !== userId) {
        const error = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You can only create disputes as the claimant"
        );
        return this.createResponse<Dispute>(null, error);
      }

      // Create the dispute with default status
      const disputeData = {
        ...data,
        status: "open" as const,
      };

      const dispute = await repository.create(disputeData);

      logger.info(`Dispute created successfully: ${dispute.id}`);

      return this.createResponse<Dispute>(
        dispute,
        null,
        "Dispute created successfully"
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "createDispute");
      return this.createResponse<Dispute>(null, serviceError);
    }
  }

  /**
   * Get dispute by ID with authorization check
   */
  async getDisputeById(
    disputeId: string,
    userId?: string
  ): Promise<ServiceResponse<Dispute>> {
    try {
      logger.info(`Retrieving dispute: ${disputeId}`, { disputeId, userId });

      const repository = this.repository as DisputesRepository;
      const dispute = await repository.findById(disputeId);

      if (!dispute) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Dispute not found"
        );
        return this.createResponse<Dispute>(null, error);
      }

      // Authorization: Only dispute participants can view
      if (
        userId &&
        dispute.claimant_id !== userId &&
        dispute.respondent_id !== userId
      ) {
        const error = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You don't have access to this dispute"
        );
        return this.createResponse<Dispute>(null, error);
      }

      logger.info(`Dispute retrieved successfully: ${disputeId}`);

      return this.createResponse<Dispute>(
        dispute,
        null,
        "Dispute retrieved successfully"
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getDisputeById");
      return this.createResponse<Dispute>(null, serviceError);
    }
  }

  /**
   * Update dispute status and resolution
   */
  async updateDispute(
    disputeId: string,
    data: UpdateDisputeData,
    userId?: string
  ): Promise<ServiceResponse<Dispute>> {
    try {
      logger.info(`Updating dispute: ${disputeId}`, {
        disputeId,
        data,
        userId,
      });

      // Validate input data
      this.disputesValidator.validateUpdate(data);

      const repository = this.repository as DisputesRepository;
      const existingDispute = await repository.findById(disputeId);

      if (!existingDispute) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Dispute not found"
        );
        return this.createResponse<Dispute>(null, error);
      }

      // Authorization check
      if (
        userId &&
        existingDispute.claimant_id !== userId &&
        existingDispute.respondent_id !== userId
      ) {
        const error = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You don't have permission to update this dispute"
        );
        return this.createResponse<Dispute>(null, error);
      }

      // Validate status transition if status is being updated
      if (data.status) {
        this.disputesValidator.validateStatusTransition(
          existingDispute.status,
          data.status
        );
      }

      // Business rules for status updates
      const updateData: any = { ...data };

      // Set resolved_at when dispute is resolved
      if (data.status === "resolved" && existingDispute.status !== "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }

      // Resolution notes required when resolving
      if (
        data.status === "resolved" &&
        !data.resolution_notes &&
        !existingDispute.resolution_notes
      ) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Resolution notes are required when resolving a dispute"
        );
        return this.createResponse<Dispute>(null, error);
      }

      const updatedDispute = await repository.update(disputeId, updateData);

      logger.info(`Dispute updated successfully: ${disputeId}`);

      return this.createResponse<Dispute>(
        updatedDispute,
        null,
        "Dispute updated successfully"
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "updateDispute");
      return this.createResponse<Dispute>(null, serviceError);
    }
  }

  /**
   * Get disputes by order ID
   */
  async getDisputesByOrderId(
    orderId: string,
    userId?: string
  ): Promise<ServiceResponse<Dispute[]>> {
    try {
      logger.info(`Retrieving disputes for order: ${orderId}`, {
        orderId,
        userId,
      });

      this.disputesValidator.validateOrderId(orderId);

      const repository = this.repository as DisputesRepository;
      const disputes = await repository.findByOrderId(orderId);

      // Filter disputes based on user access
      let filteredDisputes = disputes;
      if (userId) {
        filteredDisputes = disputes.filter(
          (dispute: Dispute) =>
            dispute.claimant_id === userId || dispute.respondent_id === userId
        );
      }

      logger.info(
        `Retrieved ${filteredDisputes.length} disputes for order: ${orderId}`
      );

      return this.createResponse<Dispute[]>(
        filteredDisputes,
        null,
        `Retrieved ${filteredDisputes.length} disputes`
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(
        error,
        "getDisputesByOrderId"
      );
      return this.createResponse<Dispute[]>(null, serviceError);
    }
  }

  /**
   * Get disputes by user (as claimant or respondent)
   */
  async getUserDisputes(
    userId: string,
    status?: string
  ): Promise<ServiceResponse<Dispute[]>> {
    try {
      logger.info(`Retrieving disputes for user: ${userId}`, {
        userId,
        status,
      });

      this.disputesValidator.validateUserId(userId);

      const repository = this.repository as DisputesRepository;

      // Get disputes where user is claimant
      const claimantDisputes = await repository.findByClaimant(userId);

      // Get disputes where user is respondent
      const respondentDisputes = await repository.findByRespondent(userId);

      // Combine and deduplicate
      const allDisputes = [...claimantDisputes, ...respondentDisputes];
      const uniqueDisputes = allDisputes.filter(
        (dispute, index, self) =>
          index === self.findIndex((d: Dispute) => d.id === dispute.id)
      );

      // Filter by status if provided
      let filteredDisputes = uniqueDisputes;
      if (status) {
        filteredDisputes = uniqueDisputes.filter(
          (dispute: Dispute) => dispute.status === status
        );
      }

      // Sort by creation date (newest first)
      filteredDisputes.sort(
        (a: Dispute, b: Dispute) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      logger.info(
        `Retrieved ${filteredDisputes.length} disputes for user: ${userId}`
      );

      return this.createResponse<Dispute[]>(
        filteredDisputes,
        null,
        `Retrieved ${filteredDisputes.length} user disputes`
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getUserDisputes");
      return this.createResponse<Dispute[]>(null, serviceError);
    }
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(
    startDate?: string,
    endDate?: string
  ): Promise<ServiceResponse<any>> {
    try {
      logger.info("Retrieving dispute statistics", { startDate, endDate });

      // Validate date range if provided
      if (startDate && endDate) {
        this.disputesValidator.validateDateRangeQuery({
          start_date: startDate,
          end_date: endDate,
        });
      }

      const repository = this.repository as DisputesRepository;
      const stats = await repository.getDisputeStats();

      logger.info("Dispute statistics retrieved successfully");

      return this.createResponse(
        stats,
        null,
        "Dispute statistics retrieved successfully"
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getDisputeStats");
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Close a dispute (mark as closed)
   */
  async closeDispute(
    disputeId: string,
    resolutionNotes: string,
    userId?: string
  ): Promise<ServiceResponse<Dispute>> {
    try {
      logger.info(`Closing dispute: ${disputeId}`, { disputeId, userId });

      const repository = this.repository as DisputesRepository;
      const existingDispute = await repository.findById(disputeId);

      if (!existingDispute) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Dispute not found"
        );
        return this.createResponse<Dispute>(null, error);
      }

      // Authorization check
      if (
        userId &&
        existingDispute.claimant_id !== userId &&
        existingDispute.respondent_id !== userId
      ) {
        const error = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "You don't have permission to close this dispute"
        );
        return this.createResponse<Dispute>(null, error);
      }

      // Validate current status allows closing
      if (existingDispute.status === "closed") {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Dispute is already closed"
        );
        return this.createResponse<Dispute>(null, error);
      }

      // Close the dispute
      return this.updateDispute(
        disputeId,
        {
          status: "closed",
          resolution_notes: resolutionNotes,
        },
        userId
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "closeDispute");
      return this.createResponse<Dispute>(null, serviceError);
    }
  }

  /**
   * Get disputes by status
   */
  async getDisputesByStatus(
    status: string,
    limit?: number,
    offset?: number
  ): Promise<ServiceResponse<Dispute[]>> {
    try {
      logger.info(`Retrieving disputes by status: ${status}`, {
        status,
        limit,
        offset,
      });

      // Validate pagination params
      if (limit !== undefined || offset !== undefined) {
        this.disputesValidator.validatePaginationParams(limit, offset);
      }

      const repository = this.repository as DisputesRepository;
      const disputes = await repository.findByStatus(
        status as "open" | "under_review" | "resolved" | "closed"
      );

      // Apply pagination
      const finalLimit = limit || 50;
      const finalOffset = offset || 0;
      const paginatedDisputes = disputes.slice(
        finalOffset,
        finalOffset + finalLimit
      );

      logger.info(
        `Retrieved ${paginatedDisputes.length} disputes with status: ${status}`
      );

      return this.createResponse<Dispute[]>(
        paginatedDisputes,
        null,
        `Retrieved ${paginatedDisputes.length} disputes`
      );
    } catch (error) {
      const serviceError = this.handleRepositoryError(
        error,
        "getDisputesByStatus"
      );
      return this.createResponse<Dispute[]>(null, serviceError);
    }
  }
}
