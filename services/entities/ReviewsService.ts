import { TABLE_NAMES } from "../config";
import { EnhancedBaseService } from "../database";
import { ReviewsRepository } from "../repositories/ReviewsRepository";
import {
  IReviewService,
  Review,
  ServiceErrorCode,
  ServiceResponse,
} from "../types";

/**
 * Enhanced Reviews Service following standard patterns
 * Implements business logic with proper error handling and validation
 */
export class ReviewsService
  extends EnhancedBaseService<Review>
  implements IReviewService
{
  constructor() {
    super(new ReviewsRepository(), "Review");
  }

  protected getTableName(): string {
    return TABLE_NAMES.REVIEWS;
  }

  async getByListing(listingId: string): Promise<ServiceResponse<Review[]>> {
    try {
      this.logBusinessEvent("getByListing", { listingId });

      if (!listingId) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Listing ID is required",
          { listingId },
          "getByListing"
        );
        return this.createResponse<Review[]>(null, error);
      }

      const repository = this.repository as ReviewsRepository;
      const reviews = await repository.findByListing(listingId);

      return this.createResponse<Review[]>(reviews, null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getByListing");
      return this.createResponse<Review[]>(null, serviceError);
    }
  }

  async getByReviewer(reviewerId: string): Promise<ServiceResponse<Review[]>> {
    try {
      this.logBusinessEvent("getByReviewer", { reviewerId });

      if (!reviewerId) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Reviewer ID is required",
          { reviewerId },
          "getByReviewer"
        );
        return this.createResponse<Review[]>(null, error);
      }

      const repository = this.repository as ReviewsRepository;
      const reviews = await repository.findByReviewer(reviewerId);

      return this.createResponse<Review[]>(reviews, null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getByReviewer");
      return this.createResponse<Review[]>(null, serviceError);
    }
  }

  async getAverageRating(listingId: string): Promise<ServiceResponse<number>> {
    try {
      this.logBusinessEvent("getAverageRating", { listingId });

      if (!listingId) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Listing ID is required",
          { listingId },
          "getAverageRating"
        );
        return this.createResponse<number>(null, error);
      }

      const repository = this.repository as ReviewsRepository;
      const result = await repository.getAverageRating(listingId);

      return this.createResponse<number>(result.average, null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(
        error,
        "getAverageRating"
      );
      return this.createResponse<number>(null, serviceError);
    }
  }

  async hasUserReviewed(
    listingId: string,
    reviewerId: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      this.logBusinessEvent("hasUserReviewed", { listingId, reviewerId });

      if (!listingId || !reviewerId) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Listing ID and Reviewer ID are required",
          { listingId, reviewerId },
          "hasUserReviewed"
        );
        return this.createResponse<boolean>(null, error);
      }

      const repository = this.repository as ReviewsRepository;
      const hasReviewed = await repository.hasUserReviewed(
        reviewerId,
        listingId
      );

      return this.createResponse<boolean>(hasReviewed, null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "hasUserReviewed");
      return this.createResponse<boolean>(null, serviceError);
    }
  }

  /**
   * Get reviews by farmer (through product listings)
   */
  async getByFarmer(farmerId: string): Promise<ServiceResponse<Review[]>> {
    try {
      this.logBusinessEvent("getByFarmer", { farmerId });

      if (!farmerId) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Farmer ID is required",
          { farmerId },
          "getByFarmer"
        );
        return this.createResponse<Review[]>(null, error);
      }

      const repository = this.repository as ReviewsRepository;
      const reviews = await repository.findByFarmer(farmerId);

      return this.createResponse<Review[]>(reviews, null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(error, "getByFarmer");
      return this.createResponse<Review[]>(null, serviceError);
    }
  }

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews(): Promise<ServiceResponse<Review[]>> {
    try {
      this.logBusinessEvent("getPendingReviews", {});

      const repository = this.repository as ReviewsRepository;
      const reviews = await repository.findPendingReviews();

      return this.createResponse<Review[]>(reviews, null);
    } catch (error) {
      const serviceError = this.handleRepositoryError(
        error,
        "getPendingReviews"
      );
      return this.createResponse<Review[]>(null, serviceError);
    }
  }
}

// Export singleton instance
export const reviewsService = new ReviewsService();
