import { supabase } from "../../lib/supabase/client";
import { TABLE_NAMES } from "../config";
import { logger } from "../logger";
import { Review } from "../types";
import { BaseRepository } from "./BaseRepository";

export class ReviewsRepository extends BaseRepository<Review> {
  constructor() {
    super(TABLE_NAMES.REVIEWS);
  }

  /**
   * Find reviews by product listing
   */
  async findByListing(listingId: string) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("listing_id", listingId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(
        `Error finding reviews for listing ${listingId}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Find reviews by reviewer
   */
  async findByReviewer(reviewerId: string) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          listing:product_listings!reviews_listing_id_fkey(
            id,
            title,
            price
          )
        `
        )
        .eq("reviewer_id", reviewerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(
        `Error finding reviews by reviewer ${reviewerId}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Find reviews by farmer (all reviews for farmer's listings)
   */
  async findByFarmer(farmerId: string) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          listing:product_listings!reviews_listing_id_fkey(
            id,
            title,
            farmer_id
          )
        `
        )
        .eq("product_listings.farmer_id", farmerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(
        `Error finding reviews for farmer ${farmerId}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Get pending reviews for moderation
   */
  async findPendingReviews() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(
          `
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(
            id,
            full_name,
            avatar_url
          ),
          listing:product_listings!reviews_listing_id_fkey(
            id,
            title,
            farmer_id
          )
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error finding pending reviews:", error as Error);
      throw error;
    }
  }

  /**
   * Calculate average rating for a listing
   */
  async getAverageRating(
    listingId: string
  ): Promise<{ average: number; count: number }> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("rating")
        .eq("listing_id", listingId)
        .eq("status", "approved");

      if (error) throw error;

      if (!data || data.length === 0) {
        return { average: 0, count: 0 };
      }

      const total = data.reduce(
        (sum: number, review: any) => sum + review.rating,
        0
      );
      const average = total / data.length;

      return {
        average: Math.round(average * 10) / 10, // Round to 1 decimal place
        count: data.length,
      };
    } catch (error) {
      logger.error(
        `Error calculating average rating for listing ${listingId}:`,
        error as Error
      );
      throw error;
    }
  }

  /**
   * Check if user has already reviewed a listing
   */
  async hasUserReviewed(
    reviewerId: string,
    listingId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("id")
        .eq("reviewer_id", reviewerId)
        .eq("listing_id", listingId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch (error) {
      logger.error(`Error checking if user reviewed listing:`, error as Error);
      throw error;
    }
  }
}
