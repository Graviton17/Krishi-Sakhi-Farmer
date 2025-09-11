// Supabase client
export { supabase } from "./supabase/client";

// Types
export type {
  BlockchainTxReference,
  Certification,
  ColdChainLog,
  Database,
  Dispute,
  DisputeStatus,
  FarmTask,
  Message,
  Negotiation,
  NegotiationStatus,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentStatus,
  Product,
  ProductListing,
  ProductListingStatus,
  Profile,
  QualityReport,
  RetailerInventory,
  Review,
  Shipment,
  ShipmentStatus,
  TaskStatus,
  UserRole,
} from "../types/supabase";

// Services
export { AuthService } from "../services/auth";
export { EnhancedBaseService } from "../services/database";

// Import and export all services and service instances
export {
  // Service Classes
  BlockchainTxReferencesService,
  // Service Instances
  blockchainTxReferencesService,
  CertificationsService,
  certificationsService,
  ColdChainLogsService,
  coldChainLogsService,
  DisputesService,
  disputesService,
  FarmTaskService,
  farmTaskService,
  MessagesService,
  messagesService,
  NegotiationsService,
  negotiationsService,
  OrderItemsService,
  orderItemsService,
  OrderService,
  orderService,
  PaymentService,
  paymentService,
  ProductListingService,
  productListingService,
  ProductService,
  productService,
  ProfileService,
  profileService,
  QualityReportsService,
  qualityReportsService,
  RetailerInventoryService,
  retailerInventoryService,
  ReviewsService,
  reviewsService,
  ShipmentsService,
  shipmentsService,
} from "../services/entities";

// Contexts
export { AuthProvider, useAuth } from "../contexts/AuthContext";

// Hooks
export {
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "../hooks/database/useQuery";

// Utils
export {
  formatAuthError,
  formatDatabaseError,
  logError,
} from "../utils/errors";
