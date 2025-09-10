import { TABLE_NAMES } from "../config";
import { EnhancedBaseService } from "../database";
import { logger } from "../logger";
import {
  Certification,
  CertificationsRepository,
} from "../repositories/CertificationsRepository";
import { ServiceErrorCode, ServiceResponse } from "../types";
import {
  CertificationCreateData,
  CertificationsValidator,
} from "../validators/CertificationsValidator";

export class CertificationsService extends EnhancedBaseService<Certification> {
  private certificationsValidator: CertificationsValidator;

  constructor() {
    const repository = new CertificationsRepository("certifications");
    super(repository, "Certification");
    this.certificationsValidator = new CertificationsValidator();
  }

  protected getTableName(): string {
    return TABLE_NAMES.CERTIFICATIONS;
  }

  /**
   * Create a new certification
   */
  async createCertification(
    data: CertificationCreateData
  ): Promise<ServiceResponse<Certification>> {
    try {
      // Validate the data
      const validation = await this.certificationsValidator.validateCreate(
        data
      );
      if (!validation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid certification data",
          validation.errors
        );
        return this.createResponse<Certification>(null, error);
      }

      // Check for duplicate certificate number - cast repository to access custom methods
      const certRepo = this.repository as CertificationsRepository;
      const existingCert = await certRepo.findByCertificateNumber(
        data.certificate_number
      );
      if (existingCert) {
        const error = this.createError(
          ServiceErrorCode.DUPLICATE_ERROR,
          "Certificate number already exists",
          { certificate_number: data.certificate_number }
        );
        return this.createResponse<Certification>(null, error);
      }

      // Create the certification
      const createResult = await this.repository.create({
        ...data,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createResult.error) {
        logger.error("Error creating certification:", createResult.error);
        const error = this.handleRepositoryError(createResult.error, "create");
        return this.createResponse<Certification>(null, error);
      }

      return this.createResponse<Certification>(
        createResult.data,
        null,
        "Certification created successfully"
      );
    } catch (error) {
      logger.error("Error in createCertification:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
      return this.createResponse<Certification>(null, serviceError);
    }
  }

  /**
   * Verify a certification (admin/verifier action)
   */
  async verifyCertification(
    certificationId: string,
    verifierId: string,
    verificationNotes?: string
  ): Promise<ServiceResponse<Certification>> {
    try {
      // Validate verification data
      const validation =
        await this.certificationsValidator.validateVerification(
          verificationNotes,
          verifierId
        );
      if (!validation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid verification data",
          validation.errors
        );
        return this.createResponse<Certification>(null, error);
      }

      // Get current certification
      const currentCertResult = await this.repository.findById(certificationId);
      if (currentCertResult.error || !currentCertResult.data) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Certification not found"
        );
        return this.createResponse<Certification>(null, error);
      }

      const currentCert = currentCertResult.data;

      // Validate status transition
      const statusValidation =
        await this.certificationsValidator.validateStatusTransition(
          currentCert.status,
          "verified"
        );
      if (!statusValidation.isValid) {
        const error = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Cannot verify certification in current status",
          statusValidation.errors
        );
        return this.createResponse<Certification>(null, error);
      }

      // Update certification status
      const certRepo = this.repository as CertificationsRepository;
      const updateResult = await certRepo.updateStatus(
        certificationId,
        "verified",
        verifierId,
        verificationNotes
      );

      if (updateResult.error) {
        logger.error("Error verifying certification:", updateResult.error);
        const error = this.handleRepositoryError(updateResult.error, "verify");
        return this.createResponse<Certification>(null, error);
      }

      return this.createResponse<Certification>(
        updateResult.data,
        null,
        "Certification verified successfully"
      );
    } catch (error) {
      logger.error("Error in verifyCertification:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Internal server error"
      );
      return this.createResponse<Certification>(null, serviceError);
    }
  }

  /**
   * Get certifications by farmer
   */
  async getCertificationsByFarmer(
    farmerId: string,
    status?: string,
    certificationType?: string
  ): Promise<ServiceResponse<Certification[]>> {
    try {
      const certRepo = this.repository as CertificationsRepository;
      const certifications = await certRepo.findByFarmer(
        farmerId,
        status,
        certificationType
      );
      return this.createResponse<Certification[]>(
        certifications,
        null,
        "Certifications retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting certifications by farmer:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve certifications"
      );
      return this.createResponse<Certification[]>(null, serviceError);
    }
  }

  /**
   * Get expiring certifications
   */
  async getExpiringCertifications(
    daysAhead: number = 30
  ): Promise<ServiceResponse<Certification[]>> {
    try {
      const certRepo = this.repository as CertificationsRepository;
      const certifications = await certRepo.findExpiringCertifications(
        daysAhead
      );
      return this.createResponse<Certification[]>(
        certifications,
        null,
        "Expiring certifications retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting expiring certifications:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve expiring certifications"
      );
      return this.createResponse<Certification[]>(null, serviceError);
    }
  }

  /**
   * Get certification statistics
   */
  async getCertificationStats(): Promise<ServiceResponse<any>> {
    try {
      const certRepo = this.repository as CertificationsRepository;
      const stats = await certRepo.getCertificationStats();
      return this.createResponse<any>(
        stats,
        null,
        "Certification statistics retrieved successfully"
      );
    } catch (error) {
      logger.error("Error getting certification stats:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve certification statistics"
      );
      return this.createResponse<any>(null, serviceError);
    }
  }

  /**
   * Auto-expire certifications
   */
  async autoExpireCertifications(): Promise<
    ServiceResponse<{ expired_count: number }>
  > {
    try {
      const certRepo = this.repository as CertificationsRepository;
      const expiredCount = await certRepo.autoExpireCertifications();
      return this.createResponse<{ expired_count: number }>(
        { expired_count: expiredCount },
        null,
        `${expiredCount} certifications auto-expired`
      );
    } catch (error) {
      logger.error("Error auto-expiring certifications:", error as Error);
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to auto-expire certifications"
      );
      return this.createResponse<{ expired_count: number }>(null, serviceError);
    }
  }

  /**
   * Get certification by certificate number
   */
  async getCertificationByCertificateNumber(
    certificateNumber: string
  ): Promise<ServiceResponse<Certification>> {
    try {
      const certRepo = this.repository as CertificationsRepository;
      const certification = await certRepo.findByCertificateNumber(
        certificateNumber
      );

      if (!certification) {
        const error = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Certification not found"
        );
        return this.createResponse<Certification>(null, error);
      }

      return this.createResponse<Certification>(
        certification,
        null,
        "Certification retrieved successfully"
      );
    } catch (error) {
      logger.error(
        "Error getting certification by certificate number:",
        error as Error
      );
      const serviceError = this.createError(
        ServiceErrorCode.INTERNAL_ERROR,
        "Failed to retrieve certification"
      );
      return this.createResponse<Certification>(null, serviceError);
    }
  }
}
