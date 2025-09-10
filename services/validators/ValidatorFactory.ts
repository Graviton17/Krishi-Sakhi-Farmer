import { BaseValidator } from "./BaseValidator";
import { BlockchainTxReferencesValidator } from "./BlockchainTxReferencesValidator";
import { CertificationsValidator } from "./CertificationsValidator";
import { ColdChainLogsValidator } from "./ColdChainLogsValidator";
import { DisputesValidator } from "./DisputesValidator";
import { FarmTaskValidator } from "./FarmTaskValidator";
import { MessagesValidator } from "./MessagesValidator";
import { NegotiationsValidator } from "./NegotiationsValidator";
import { OrderItemsValidator } from "./OrderItemsValidator";
import { OrderValidator } from "./OrderValidator";
import { PaymentValidator } from "./PaymentValidator";
import { ProductListingValidator } from "./ProductListingValidator";
import { ProductValidator } from "./ProductValidator";
import { ProfileValidator } from "./ProfileValidator";
import { QualityReportsValidator } from "./QualityReportsValidator";
import { RetailerInventoryValidator } from "./RetailerInventoryValidator";
import { ReviewsValidator } from "./ReviewsValidator";
import { ShipmentsValidator } from "./ShipmentsValidator";

// Union type for all validator types
export type ValidatorInstance =
  | BaseValidator<any>
  | DisputesValidator
  | RetailerInventoryValidator
  | ColdChainLogsValidator
  | BlockchainTxReferencesValidator;

/**
 * Enhanced Validator Factory - supports all entity types
 * Eliminates redundancy by centralizing validator creation
 */
export class ValidatorFactory {
  private static validatorCache = new Map<string, ValidatorInstance>();

  /**
   * Get BaseValidator instance for entity type (with caching)
   * Only returns validators that extend BaseValidator
   */
  static getBaseValidator<T>(entityType: string): BaseValidator<T> | null {
    // Check cache first
    if (this.validatorCache.has(entityType)) {
      const cached = this.validatorCache.get(entityType);
      return cached instanceof BaseValidator
        ? (cached as BaseValidator<T>)
        : null;
    }

    let validator: BaseValidator<T> | null = null;

    switch (entityType) {
      case "profiles":
        validator = new ProfileValidator() as unknown as BaseValidator<T>;
        break;
      case "products":
        validator = new ProductValidator() as unknown as BaseValidator<T>;
        break;
      case "orders":
        validator = new OrderValidator() as unknown as BaseValidator<T>;
        break;
      case "order_items":
        validator = new OrderItemsValidator() as unknown as BaseValidator<T>;
        break;
      case "payments":
        validator = new PaymentValidator() as unknown as BaseValidator<T>;
        break;
      case "reviews":
        validator = new ReviewsValidator() as unknown as BaseValidator<T>;
        break;
      case "certifications":
        validator =
          new CertificationsValidator() as unknown as BaseValidator<T>;
        break;
      case "quality_reports":
        validator =
          new QualityReportsValidator() as unknown as BaseValidator<T>;
        break;
      case "messages":
        validator = new MessagesValidator() as unknown as BaseValidator<T>;
        break;
      case "shipments":
        validator = new ShipmentsValidator() as unknown as BaseValidator<T>;
        break;
      case "negotiations":
        validator = new NegotiationsValidator() as unknown as BaseValidator<T>;
        break;
      case "farm_tasks":
        validator = new FarmTaskValidator() as unknown as BaseValidator<T>;
        break;
      // For product listings
      case "product_listings":
        validator =
          new ProductListingValidator() as unknown as BaseValidator<T>;
        break;
      default:
        // Return null for unsupported types or standalone validators
        return null;
    }

    // Cache the validator if valid
    if (validator) {
      this.validatorCache.set(entityType, validator);
    }
    return validator;
  }

  /**
   * Get any validator instance (BaseValidator or standalone) for entity type
   */
  static getValidator(entityType: string): ValidatorInstance | null {
    // Check cache first
    if (this.validatorCache.has(entityType)) {
      return this.validatorCache.get(entityType)!;
    }

    let validator: ValidatorInstance | null = null;

    // First try BaseValidator types
    const baseValidator = this.getBaseValidator(entityType);
    if (baseValidator) {
      return baseValidator;
    }

    // Handle standalone validators
    switch (entityType) {
      case "retailer_inventory":
        validator = new RetailerInventoryValidator();
        break;
      case "cold_chain_logs":
        validator = new ColdChainLogsValidator();
        break;
      case "blockchain_tx_references":
        validator = new BlockchainTxReferencesValidator();
        break;
      case "disputes":
        validator = new DisputesValidator();
        break;
      default:
        // Fallback to generic BaseValidator
        validator = new BaseValidator();
        break;
    }

    // Cache the validator if valid
    if (validator) {
      this.validatorCache.set(entityType, validator);
    }
    return validator;
  }

  /**
   * Get specific standalone validator instances with proper typing
   */
  static getRetailerInventoryValidator(): RetailerInventoryValidator {
    const cached = this.validatorCache.get("retailer_inventory");
    if (cached instanceof RetailerInventoryValidator) {
      return cached;
    }
    const validator = new RetailerInventoryValidator();
    this.validatorCache.set("retailer_inventory", validator);
    return validator;
  }

  static getColdChainLogsValidator(): ColdChainLogsValidator {
    const cached = this.validatorCache.get("cold_chain_logs");
    if (cached instanceof ColdChainLogsValidator) {
      return cached;
    }
    const validator = new ColdChainLogsValidator();
    this.validatorCache.set("cold_chain_logs", validator);
    return validator;
  }

  static getBlockchainTxReferencesValidator(): BlockchainTxReferencesValidator {
    const cached = this.validatorCache.get("blockchain_tx_references");
    if (cached instanceof BlockchainTxReferencesValidator) {
      return cached;
    }
    const validator = new BlockchainTxReferencesValidator();
    this.validatorCache.set("blockchain_tx_references", validator);
    return validator;
  }

  static getDisputesValidator(): DisputesValidator {
    const cached = this.validatorCache.get("disputes");
    if (cached instanceof DisputesValidator) {
      return cached;
    }
    const validator = new DisputesValidator();
    this.validatorCache.set("disputes", validator);
    return validator;
  }

  /**
   * Clear validator cache (useful for testing)
   */
  static clearCache(): void {
    this.validatorCache.clear();
  }

  /**
   * Get all supported entity types
   */
  static getSupportedEntityTypes(): string[] {
    return [
      "profiles",
      "products",
      "product_listings",
      "orders",
      "order_items",
      "payments",
      "reviews",
      "certifications",
      "quality_reports",
      "messages",
      "shipments",
      "retailer_inventory",
      "cold_chain_logs",
      "blockchain_tx_references",
      "negotiations",
      "disputes",
      "farm_tasks",
    ];
  }

  /**
   * Get entity types that use BaseValidator architecture
   */
  static getBaseValidatorEntityTypes(): string[] {
    return [
      "profiles",
      "products",
      "product_listings",
      "orders",
      "order_items",
      "payments",
      "reviews",
      "certifications",
      "quality_reports",
      "messages",
      "shipments",
      "negotiations",
      "farm_tasks",
    ];
  }

  /**
   * Get entity types that use standalone validator architecture
   */
  static getStandaloneValidatorEntityTypes(): string[] {
    return [
      "retailer_inventory",
      "cold_chain_logs",
      "blockchain_tx_references",
      "disputes",
    ];
  }
}
