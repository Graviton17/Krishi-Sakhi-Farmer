import { BUSINESS_RULES, TABLE_NAMES } from "../config";
import { EnhancedBaseService } from "../database";
import { logger } from "../logger";
import { ShipmentsRepository } from "../repositories/ShipmentsRepository";
import { ServiceErrorCode, ServiceResponse, Shipment } from "../types";
import { ShipmentsValidator } from "../validators/ShipmentsValidator";

interface CreateShipmentData {
  order_id: string;
  carrier_name: string;
  tracking_number?: string;
  status?: string;
  estimated_delivery_date?: string;
  shipping_address: any;
  pickup_address?: any;
  weight_kg?: number;
  dimensions?: any;
  shipping_cost?: number;
  insurance_value?: number;
  special_instructions?: string;
}

interface UpdateShipmentData {
  carrier_name?: string;
  tracking_number?: string;
  status?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  shipping_address?: any;
  pickup_address?: any;
  weight_kg?: number;
  dimensions?: any;
  shipping_cost?: number;
  insurance_value?: number;
  special_instructions?: string;
}

export class ShipmentsService extends EnhancedBaseService<Shipment> {
  private shipmentsValidator: ShipmentsValidator;

  constructor() {
    const repository = new ShipmentsRepository("shipments");
    super(repository, "Shipment");
    this.shipmentsValidator = new ShipmentsValidator();
  }

  protected getTableName(): string {
    return TABLE_NAMES.SHIPMENTS;
  }

  /**
   * Create a new shipment
   */
  async createShipment(
    data: CreateShipmentData
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("createShipment", {
        orderId: data.order_id,
        carrier: data.carrier_name,
        hasTracking: !!data.tracking_number,
      });

      // Validate input data
      const validation = this.shipmentsValidator.validateCreate(data);
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid shipment data",
          validation.errors,
          "createShipment"
        );
        return this.createResponse(null, serviceError);
      }

      // Set default status if not provided
      const shipmentData = {
        ...data,
        status: data.status || "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const repository = this.repository as ShipmentsRepository;
      const result = await repository.create(shipmentData);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "createShipment"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(
        `Shipment created for order ${data.order_id} with carrier ${data.carrier_name}`
      );
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error("Error creating shipment:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "createShipment"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Update shipment information
   */
  async updateShipment(
    id: string,
    data: UpdateShipmentData
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("updateShipment", {
        id,
        updates: Object.keys(data),
      });

      // Validate update data
      const validation = this.shipmentsValidator.validateUpdate(data);
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid update data",
          validation.errors,
          "updateShipment"
        );
        return this.createResponse(null, serviceError);
      }

      // Check if shipment exists
      const existingResult = await this.repository.findById(id);
      if (existingResult.error || !existingResult.data) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Shipment not found",
          [],
          "updateShipment"
        );
        return this.createResponse(null, serviceError);
      }

      // Update shipment
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const result = await this.repository.update(id, updateData);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "updateShipment"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(`Shipment ${id} updated successfully`);
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error(`Error updating shipment ${id}:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "updateShipment"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(
    id: string,
    status: string,
    actualDeliveryDate?: string
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("updateShipmentStatus", {
        id,
        status,
        hasDeliveryDate: !!actualDeliveryDate,
      });

      // Validate status update
      const validation = this.shipmentsValidator.validateStatusUpdate({
        status,
        actualDeliveryDate,
      });
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid status update data",
          validation.errors,
          "updateShipmentStatus"
        );
        return this.createResponse(null, serviceError);
      }

      const repository = this.repository as ShipmentsRepository;
      const result = await repository.updateStatus(
        id,
        status,
        actualDeliveryDate
      );

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "updateShipmentStatus"
        );
        return this.createResponse(null, serviceError);
      }

      logger.info(`Shipment ${id} status updated to ${status}`);
      return this.createResponse(result.data, null);
    } catch (error) {
      logger.error(`Error updating shipment status for ${id}:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "updateShipmentStatus"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Get shipments for an order
   */
  async getOrderShipments(orderId: string): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getOrderShipments", { orderId });

      const repository = this.repository as ShipmentsRepository;
      const shipments = await repository.findByOrder(orderId);

      return this.createResponse(shipments, null);
    } catch (error) {
      logger.error(
        `Error getting shipments for order ${orderId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getOrderShipments"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get shipments by status
   */
  async getShipmentsByStatus(
    status: string,
    limit: number = 50
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getShipmentsByStatus", { status, limit });

      // Validate status
      const allowedStatuses = BUSINESS_RULES.SHIPMENT
        .ALLOWED_STATUSES as readonly string[];
      if (!allowedStatuses.includes(status)) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
          [],
          "getShipmentsByStatus"
        );
        return this.createResponse<any[]>([], serviceError);
      }

      const repository = this.repository as ShipmentsRepository;
      const shipments = await repository.findByStatus(status, limit);

      return this.createResponse(shipments, null);
    } catch (error) {
      logger.error(
        `Error getting shipments by status ${status}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getShipmentsByStatus"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Track shipment by tracking number
   */
  async trackShipment(trackingNumber: string): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("trackShipment", {
        trackingNumber: trackingNumber.substring(0, 6) + "...",
      });

      // Validate tracking number
      const validation = this.shipmentsValidator.validateTracking({
        trackingNumber,
      });
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid tracking number",
          validation.errors,
          "trackShipment"
        );
        return this.createResponse(null, serviceError);
      }

      const repository = this.repository as ShipmentsRepository;
      const shipment = await repository.findByTrackingNumber(trackingNumber);

      if (!shipment) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Shipment not found with this tracking number",
          [],
          "trackShipment"
        );
        return this.createResponse(null, serviceError);
      }

      return this.createResponse(shipment, null);
    } catch (error) {
      logger.error(
        `Error tracking shipment with number ${trackingNumber}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "trackShipment"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Get shipments for a farmer
   */
  async getFarmerShipments(
    farmerId: string,
    status?: string,
    limit: number = 50
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getFarmerShipments", { farmerId, status, limit });

      // Validate status if provided
      if (status) {
        const allowedStatuses = BUSINESS_RULES.SHIPMENT
          .ALLOWED_STATUSES as readonly string[];
        if (!allowedStatuses.includes(status)) {
          const serviceError = this.createError(
            ServiceErrorCode.VALIDATION_ERROR,
            `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
            [],
            "getFarmerShipments"
          );
          return this.createResponse<any[]>([], serviceError);
        }
      }

      const repository = this.repository as ShipmentsRepository;
      const shipments = await repository.findByFarmer(farmerId, status, limit);

      return this.createResponse(shipments, null);
    } catch (error) {
      logger.error(
        `Error getting shipments for farmer ${farmerId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getFarmerShipments"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get shipments for a buyer
   */
  async getBuyerShipments(
    buyerId: string,
    status?: string,
    limit: number = 50
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getBuyerShipments", { buyerId, status, limit });

      // Validate status if provided
      if (status) {
        const allowedStatuses = BUSINESS_RULES.SHIPMENT
          .ALLOWED_STATUSES as readonly string[];
        if (!allowedStatuses.includes(status)) {
          const serviceError = this.createError(
            ServiceErrorCode.VALIDATION_ERROR,
            `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
            [],
            "getBuyerShipments"
          );
          return this.createResponse<any[]>([], serviceError);
        }
      }

      const repository = this.repository as ShipmentsRepository;
      const shipments = await repository.findByBuyer(buyerId, status, limit);

      return this.createResponse(shipments, null);
    } catch (error) {
      logger.error(
        `Error getting shipments for buyer ${buyerId}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getBuyerShipments"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get shipments by carrier
   */
  async getCarrierShipments(
    carrierName: string,
    limit: number = 50
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getCarrierShipments", { carrierName, limit });

      const repository = this.repository as ShipmentsRepository;
      const shipments = await repository.findByCarrier(carrierName, limit);

      return this.createResponse(shipments, null);
    } catch (error) {
      logger.error(
        `Error getting shipments for carrier ${carrierName}:`,
        error as Error
      );
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getCarrierShipments"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get overdue shipments
   */
  async getOverdueShipments(): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getOverdueShipments", {});

      const repository = this.repository as ShipmentsRepository;
      const shipments = await repository.findOverdueShipments();

      return this.createResponse(shipments, null);
    } catch (error) {
      logger.error("Error getting overdue shipments:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getOverdueShipments"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get deliveries due today
   */
  async getTodayDeliveries(): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("getTodayDeliveries", {});

      const repository = this.repository as ShipmentsRepository;
      const shipments = await repository.findDeliveriesToday();

      return this.createResponse(shipments, null);
    } catch (error) {
      logger.error("Error getting today's deliveries:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getTodayDeliveries"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Get shipping statistics
   */
  async getShippingStats(
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<any>> {
    try {
      this.logBusinessEvent("getShippingStats", { startDate, endDate });

      // Validate dates
      if (!startDate || !endDate) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Start date and end date are required",
          [],
          "getShippingStats"
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
          "getShippingStats"
        );
        return this.createResponse(null, serviceError);
      }

      if (start > end) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Start date must be before end date",
          [],
          "getShippingStats"
        );
        return this.createResponse(null, serviceError);
      }

      const repository = this.repository as ShipmentsRepository;
      const stats = await repository.getShippingStats(startDate, endDate);

      return this.createResponse(stats, null);
    } catch (error) {
      logger.error("Error getting shipping statistics:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "getShippingStats"
      );
      return this.createResponse(null, serviceError);
    }
  }

  /**
   * Search shipments
   */
  async searchShipments(
    query: string,
    status?: string,
    limit: number = 20
  ): Promise<ServiceResponse<any[]>> {
    try {
      this.logBusinessEvent("searchShipments", {
        query: query.length,
        status,
        limit,
      });

      // Validate search parameters
      const validation = this.shipmentsValidator.validateSearch({
        query,
        status,
        limit,
      });
      if (!validation.isValid) {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Invalid search parameters",
          validation.errors,
          "searchShipments"
        );
        return this.createResponse<any[]>([], serviceError);
      }

      const repository = this.repository as ShipmentsRepository;
      const shipments = await repository.searchShipments(query, status, limit);

      return this.createResponse(shipments, null);
    } catch (error) {
      logger.error("Error searching shipments:", error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "searchShipments"
      );
      return this.createResponse<any[]>([], serviceError);
    }
  }

  /**
   * Delete a shipment
   */
  async deleteShipment(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logBusinessEvent("deleteShipment", { id });

      // Check if shipment exists
      const existingResult = await this.repository.findById(id);
      if (existingResult.error || !existingResult.data) {
        const serviceError = this.createError(
          ServiceErrorCode.NOT_FOUND,
          "Shipment not found",
          [],
          "deleteShipment"
        );
        return this.createResponse<boolean>(false, serviceError);
      }

      // Check if shipment can be deleted (only pending shipments can be deleted)
      if (existingResult.data.status !== "pending") {
        const serviceError = this.createError(
          ServiceErrorCode.VALIDATION_ERROR,
          "Only pending shipments can be deleted",
          [],
          "deleteShipment"
        );
        return this.createResponse<boolean>(false, serviceError);
      }

      const result = await this.repository.delete(id);

      if (result.error) {
        const serviceError = this.handleRepositoryError(
          result.error,
          "deleteShipment"
        );
        return this.createResponse<boolean>(false, serviceError);
      }

      logger.info(`Shipment ${id} deleted successfully`);
      return this.createResponse<boolean>(true, null);
    } catch (error) {
      logger.error(`Error deleting shipment ${id}:`, error as Error);
      const serviceError = this.handleRepositoryError(
        error as Error,
        "deleteShipment"
      );
      return this.createResponse<boolean>(false, serviceError);
    }
  }
}
