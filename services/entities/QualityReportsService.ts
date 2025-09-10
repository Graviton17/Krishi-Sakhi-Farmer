import { TABLE_NAMES } from "../config";
import { EnhancedBaseService } from "../database";
import { logger } from "../logger";
import {
  QualityReport,
  QualityReportsRepository,
} from "../repositories/QualityReportsRepository";
import { ServiceErrorCode, ServiceResponse } from "../types";
import {
  QualityReportCreateData,
  QualityReportsValidator,
  QualityReportUpdateData,
} from "../validators/QualityReportsValidator";

export class QualityReportsService extends EnhancedBaseService<QualityReport> {
  private qualityReportsValidator: QualityReportsValidator;

  constructor() {
    const repository = new QualityReportsRepository("quality_reports");
    super(repository, "QualityReport");
    this.qualityReportsValidator = new QualityReportsValidator();
  }

  protected getTableName(): string {
    return TABLE_NAMES.QUALITY_REPORTS;
  }

  /**
   * Create a new quality report
   */
  async createQualityReport(
    data: QualityReportCreateData
  ): Promise<ServiceResponse<QualityReport>> {
    try {
      // Validate the data
      const validation = await this.qualityReportsValidator.validateCreate(
        data
      );
      if (!validation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid quality report data",
          validation.errors
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Create the quality report
      const createResult = await this.repository.create({
        ...data,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createResult.error) {
        logger.error("Error creating quality report:", createResult.error);
        const error = this.handleRepositoryError(createResult.error, "create");
        return this.createResponse<QualityReport>(null, error);
      }

      return this.createResponse<QualityReport>(
        createResult.data,
        null,
        "Quality report created successfully"
      );
    } catch (error) {
      logger.error("Error in createQualityReport:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
      return this.createResponse<QualityReport>(null, serviceError);
    }
  }

  /**
   * Update a quality report
   */
  async updateQualityReport(
    reportId: string,
    data: QualityReportUpdateData,
    userId: string
  ): Promise<ServiceResponse<QualityReport>> {
    try {
      // Get current report
      const currentReportResult = await this.repository.findById(reportId);
      if (currentReportResult.error || !currentReportResult.data) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Quality report not found"
        );
        return this.createResponse<QualityReport>(null, error);
      }

      const currentReport = currentReportResult.data;

      // Check authorization - only inspector can update their own report
      if (currentReport.inspector_id !== userId) {
        const error = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "Not authorized to update this quality report"
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Validate the update
      const validation =
        await this.qualityReportsValidator.validateReportUpdate(
          reportId,
          data,
          currentReport.status
        );
      if (!validation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid update data",
          validation.errors
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Update the report
      const updateResult = await this.repository.update(reportId, {
        ...data,
        updated_at: new Date().toISOString(),
      });

      if (updateResult.error) {
        logger.error("Error updating quality report:", updateResult.error);
        const error = this.handleRepositoryError(updateResult.error, "update");
        return this.createResponse<QualityReport>(null, error);
      }

      return this.createResponse<QualityReport>(
        updateResult.data,
        null,
        "Quality report updated successfully"
      );
    } catch (error) {
      logger.error("Error in updateQualityReport:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
      return this.createResponse<QualityReport>(null, serviceError);
    }
  }

  /**
   * Approve a quality report (admin/supervisor action)
   */
  async approveQualityReport(
    reportId: string,
    approvedBy: string
  ): Promise<ServiceResponse<QualityReport>> {
    try {
      // Validate approval data
      const validation = await this.qualityReportsValidator.validateApproval(
        approvedBy
      );
      if (!validation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid approval data",
          validation.errors
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Get current report
      const currentReportResult = await this.repository.findById(reportId);
      if (currentReportResult.error || !currentReportResult.data) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Quality report not found"
        );
        return this.createResponse<QualityReport>(null, error);
      }

      const currentReport = currentReportResult.data;

      // Validate status transition
      const statusValidation =
        await this.qualityReportsValidator.validateStatusTransition(
          currentReport.status,
          "approved"
        );
      if (!statusValidation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Cannot approve report in current status",
          statusValidation.errors
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Update report status
      const qualityRepo = this.repository as QualityReportsRepository;
      const updateResult = await qualityRepo.updateStatus(
        reportId,
        "approved",
        approvedBy
      );

      if (updateResult.error) {
        logger.error("Error approving quality report:", updateResult.error);
        const error = this.handleRepositoryError(updateResult.error, "approve");
        return this.createResponse<QualityReport>(null, error);
      }

      return this.createResponse<QualityReport>(
        updateResult.data,
        null,
        "Quality report approved successfully"
      );
    } catch (error) {
      logger.error("Error in approveQualityReport:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
      return this.createResponse<QualityReport>(null, serviceError);
    }
  }

  /**
   * Reject a quality report
   */
  async rejectQualityReport(
    reportId: string,
    rejectionReason: string,
    rejectedBy: string
  ): Promise<ServiceResponse<QualityReport>> {
    try {
      if (!rejectionReason?.trim()) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Rejection reason is required"
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Get current report
      const currentReportResult = await this.repository.findById(reportId);
      if (currentReportResult.error || !currentReportResult.data) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Quality report not found"
        );
        return this.createResponse<QualityReport>(null, error);
      }

      const currentReport = currentReportResult.data;

      // Validate status transition
      const statusValidation =
        await this.qualityReportsValidator.validateStatusTransition(
          currentReport.status,
          "rejected"
        );
      if (!statusValidation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Cannot reject report in current status",
          statusValidation.errors
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Update report with rejection
      const updateResult = await this.repository.update(reportId, {
        status: "rejected",
        quality_notes: `${currentReport.quality_notes}\n\nREJECTION REASON: ${rejectionReason}`,
        updated_at: new Date().toISOString(),
      });

      if (updateResult.error) {
        logger.error("Error rejecting quality report:", updateResult.error);
        const error = this.handleRepositoryError(updateResult.error, "reject");
        return this.createResponse<QualityReport>(null, error);
      }

      return this.createResponse<QualityReport>(
        updateResult.data,
        null,
        "Quality report rejected"
      );
    } catch (error) {
      logger.error("Error in rejectQualityReport:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
      return this.createResponse<QualityReport>(null, serviceError);
    }
  }

  /**
   * Get quality reports by product
   */
  async getQualityReportsByProduct(
    productId: string,
    status?: string,
    limit: number = 50
  ): Promise<ServiceResponse<QualityReport[]>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const reports = await qualityRepo.findByProduct(productId, status, limit);
      return this.createResponse<QualityReport[]>(
        reports,
        null,
        "Quality reports retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting quality reports by product:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve quality reports"
      );
      return this.createResponse<QualityReport[]>(null, serviceError);
    }
  }

  /**
   * Get quality reports by farmer
   */
  async getQualityReportsByFarmer(
    farmerId: string,
    status?: string,
    limit: number = 50
  ): Promise<ServiceResponse<QualityReport[]>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const reports = await qualityRepo.findByFarmer(farmerId, status, limit);
      return this.createResponse<QualityReport[]>(
        reports,
        null,
        "Quality reports retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting quality reports by farmer:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve quality reports"
      );
      return this.createResponse<QualityReport[]>(null, serviceError);
    }
  }

  /**
   * Get quality reports by inspector
   */
  async getQualityReportsByInspector(
    inspectorId: string,
    status?: string,
    limit: number = 50
  ): Promise<ServiceResponse<QualityReport[]>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const reports = await qualityRepo.findByInspector(
        inspectorId,
        status,
        limit
      );
      return this.createResponse<QualityReport[]>(
        reports,
        null,
        "Quality reports retrieved successfully"
      );
    } catch (error) {
      logger.error(
        "Error getting quality reports by inspector:",
        error as Error
      );
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve quality reports"
      );
      return this.createResponse<QualityReport[]>(null, serviceError);
    }
  }

  /**
   * Get quality reports by grade
   */
  async getQualityReportsByGrade(
    grade: string,
    limit: number = 50
  ): Promise<ServiceResponse<QualityReport[]>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const reports = await qualityRepo.findByGrade(grade, limit);
      return this.createResponse<QualityReport[]>(
        reports,
        null,
        "Quality reports retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting quality reports by grade:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve quality reports"
      );
      return this.createResponse<QualityReport[]>(null, serviceError);
    }
  }

  /**
   * Get quality reports by score range
   */
  async getQualityReportsByScoreRange(
    minScore: number,
    maxScore: number,
    limit: number = 50
  ): Promise<ServiceResponse<QualityReport[]>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const reports = await qualityRepo.findByScoreRange(
        minScore,
        maxScore,
        limit
      );
      return this.createResponse<QualityReport[]>(
        reports,
        null,
        "Quality reports retrieved successfully"
      );
    } catch (error) {
      logger.error(
        "Error getting quality reports by score range:",
        error as Error
      );
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve quality reports"
      );
      return this.createResponse<QualityReport[]>(null, serviceError);
    }
  }

  /**
   * Get recent quality reports
   */
  async getRecentQualityReports(
    days: number = 30,
    limit: number = 50
  ): Promise<ServiceResponse<QualityReport[]>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const reports = await qualityRepo.findRecent(days, limit);
      return this.createResponse<QualityReport[]>(
        reports,
        null,
        "Recent quality reports retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting recent quality reports:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve recent quality reports"
      );
      return this.createResponse<QualityReport[]>(null, serviceError);
    }
  }

  /**
   * Search quality reports
   */
  async searchQualityReports(
    searchTerm: string,
    status?: string,
    grade?: string,
    limit: number = 20
  ): Promise<ServiceResponse<QualityReport[]>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const reports = await qualityRepo.searchReports(
        searchTerm,
        status,
        grade,
        limit
      );
      return this.createResponse<QualityReport[]>(
        reports,
        null,
        "Quality reports search completed"
      );
    } catch (error) {
      logger.error("Error searching quality reports:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to search quality reports"
      );
      return this.createResponse<QualityReport[]>(null, serviceError);
    }
  }

  /**
   * Get quality report statistics
   */
  async getQualityStats(): Promise<ServiceResponse<any>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const stats = await qualityRepo.getQualityStats();
      return this.createResponse<any>(
        stats,
        null,
        "Quality statistics retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting quality stats:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve quality statistics"
      );
      return this.createResponse<any>(null, serviceError);
    }
  }

  /**
   * Get product quality summary
   */
  async getProductQualitySummary(
    productId: string
  ): Promise<ServiceResponse<any>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const summary = await qualityRepo.getProductQualitySummary(productId);
      return this.createResponse<any>(
        summary,
        null,
        "Product quality summary retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting product quality summary:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve product quality summary"
      );
      return this.createResponse<any>(null, serviceError);
    }
  }

  /**
   * Get farmer quality statistics
   */
  async getFarmerQualityStats(farmerId: string): Promise<ServiceResponse<any>> {
    try {
      const qualityRepo = this.repository as QualityReportsRepository;
      const stats = await qualityRepo.getFarmerQualityStats(farmerId);
      return this.createResponse<any>(
        stats,
        null,
        "Farmer quality statistics retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting farmer quality stats:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve farmer quality statistics"
      );
      return this.createResponse<any>(null, serviceError);
    }
  }

  /**
   * Get quality report by ID
   */
  async getQualityReportById(
    reportId: string
  ): Promise<ServiceResponse<QualityReport>> {
    try {
      const result = await this.repository.findById(reportId);

      if (result.error) {
        logger.error("Error getting quality report by ID:", result.error);
        const error = this.handleRepositoryError(result.error, "getById");
        return this.createResponse<QualityReport>(null, error);
      }

      if (!result.data) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Quality report not found"
        );
        return this.createResponse<QualityReport>(null, error);
      }

      return this.createResponse<QualityReport>(
        result.data,
        null,
        "Quality report retrieved successfully"
      );
    } catch (error) {
      logger.error("Error in getQualityReportById:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
      return this.createResponse<QualityReport>(null, serviceError);
    }
  }

  /**
   * Submit quality report for review
   */
  async submitForReview(
    reportId: string,
    submittedBy: string
  ): Promise<ServiceResponse<QualityReport>> {
    try {
      // Get current report
      const currentReportResult = await this.repository.findById(reportId);
      if (currentReportResult.error || !currentReportResult.data) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Quality report not found"
        );
        return this.createResponse<QualityReport>(null, error);
      }

      const currentReport = currentReportResult.data;

      // Check authorization
      if (currentReport.inspector_id !== submittedBy) {
        const error = this.createError(
          ServiceErrorCode.PERMISSION_DENIED,
          "Not authorized to submit this quality report"
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Validate status transition
      const statusValidation =
        await this.qualityReportsValidator.validateStatusTransition(
          currentReport.status,
          "under_review"
        );
      if (!statusValidation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Cannot submit report in current status",
          statusValidation.errors
        );
        return this.createResponse<QualityReport>(null, error);
      }

      // Update report status
      const updateResult = await this.repository.update(reportId, {
        status: "under_review",
        updated_at: new Date().toISOString(),
      });

      if (updateResult.error) {
        logger.error(
          "Error submitting quality report for review:",
          updateResult.error
        );
        const error = this.handleRepositoryError(updateResult.error, "submit");
        return this.createResponse<QualityReport>(null, error);
      }

      return this.createResponse<QualityReport>(
        updateResult.data,
        null,
        "Quality report submitted for review"
      );
    } catch (error) {
      logger.error("Error in submitForReview:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
      return this.createResponse<QualityReport>(null, serviceError);
    }
  }
}
