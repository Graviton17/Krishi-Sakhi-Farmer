# Krishi Sakhi Backend Integration Guide

This guide provides comprehensive documentation for integrating the Supabase backend services into your frontend application. The backend is built with TypeScript and follows industrial-standard patterns including Repository, Service Layer, and Validation patterns.

## Table of Contents

1. [Setup and Configuration](#setup-and-configuration)
2. [Authentication Service](#authentication-service)
3. [Core Services Overview](#core-services-overview)
4. [Data Models and Types](#data-models-and-types)
5. [Common Patterns](#common-patterns)
6. [Service Usage Examples](#service-usage-examples)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Setup and Configuration

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
```

### 2. Environment Configuration

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Import Services

```typescript
// Import specific services
import {
  AuthService,
  profileService,
  productService,
  orderService,
  // ... other services
} from "./services";

// Or import all services
import * as Services from "./services";
```

## Authentication Service

### Interface

```typescript
interface IAuthService {
  signUp(credentials: AuthCredentials): Promise<ServiceResponse<AuthResult>>;
  signIn(credentials: AuthCredentials): Promise<ServiceResponse<AuthResult>>;
  signOut(): Promise<ServiceResponse<void>>;
  getCurrentSession(): Promise<ServiceResponse<Session>>;
  getCurrentUser(): Promise<ServiceResponse<User>>;
  resetPassword(request: ResetPasswordRequest): Promise<ServiceResponse<void>>;
  updatePassword(
    request: UpdatePasswordRequest
  ): Promise<ServiceResponse<void>>;
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void;
}
```

### Usage Examples

```typescript
import { AuthService } from "./services";

const authService = new AuthService();

// Sign Up
const signUpResult = await authService.signUp({
  email: "user@example.com",
  password: "securePassword123",
});

if (signUpResult.success) {
  console.log("User created:", signUpResult.data?.user);
} else {
  console.error("Sign up failed:", signUpResult.error?.message);
}

// Sign In
const signInResult = await authService.signIn({
  email: "user@example.com",
  password: "securePassword123",
});

// Listen to auth state changes
const unsubscribe = authService.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    console.log("User signed in");
  } else if (event === "SIGNED_OUT") {
    console.log("User signed out");
  }
});

// Clean up listener
unsubscribe();
```

## Core Services Overview

All services follow the same pattern and extend `EnhancedBaseService<T>` which provides standard CRUD operations:

### Available Services

1. **ProfileService** - User profile management
2. **ProductService** - Product catalog management
3. **ProductListingService** - Marketplace listings
4. **OrderService** - Order management
5. **OrderItemsService** - Order item details
6. **PaymentService** - Payment processing
7. **ReviewsService** - Reviews and ratings
8. **FarmTaskService** - Farm task management
9. **MessagesService** - Messaging system
10. **NegotiationsService** - Price negotiations
11. **ShipmentsService** - Shipment tracking
12. **DisputesService** - Dispute resolution
13. **QualityReportsService** - AI quality reports
14. **CertificationsService** - Certification management
15. **RetailerInventoryService** - Inventory management
16. **ColdChainLogsService** - Cold chain monitoring
17. **BlockchainTxReferencesService** - Blockchain transaction references

### Base Service Interface

Every service implements these core methods:

```typescript
interface IBaseService<T> {
  getAll(options?: QueryOptions): Promise<ServiceResponse<T[]>>;
  getById(id: string): Promise<ServiceResponse<T>>;
  create(data: Partial<T>): Promise<ServiceResponse<T>>;
  update(id: string, data: Partial<T>): Promise<ServiceResponse<T>>;
  delete(id: string): Promise<ServiceResponse<boolean>>;
  count(filters?: FilterOptions[]): Promise<ServiceResponse<number>>;
}
```

## Data Models and Types

### Common Type Definitions

```typescript
// Service Response Structure
interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
  success: boolean;
  message?: string;
  metadata?: ResponseMetadata;
}

// Query Options
interface QueryOptions {
  pagination?: PaginationOptions;
  filters?: FilterOptions[];
  sorts?: SortOptions[];
  select?: string;
}

// Filter Options
interface FilterOptions {
  column: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "ilike"
    | "in"
    | "is";
  value: any;
}

// Pagination
interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

// Sorting
interface SortOptions {
  column: string;
  ascending: boolean;
}
```

### Key Data Models

#### Profile

```typescript
interface Profile {
  id: string;
  role: "farmer" | "distributor" | "retailer";
  company_name?: string;
  full_name?: string;
  contact_email?: string;
  phone_number?: string;
  address?: string;
  location_gln?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Product

```typescript
interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  image_url?: string;
  gtin?: string;
  created_at: string;
}
```

#### ProductListing

```typescript
interface ProductListing {
  id: string;
  farmer_id: string;
  product_id: string;
  quantity_available: number;
  unit_of_measure: string;
  price_per_unit: number;
  status: "available" | "sold_out" | "delisted";
  harvest_date?: string;
  quality_report_id?: string;
  created_at: string;
  updated_at: string;
}
```

#### Order

```typescript
interface Order {
  id: string;
  buyer_id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  created_at: string;
  updated_at: string;
}
```

## Common Patterns

### 1. Basic CRUD Operations

```typescript
import { productService } from "./services";

// Create a new product
const newProduct = await productService.create({
  name: "Organic Tomatoes",
  description: "Fresh organic tomatoes",
  category: "vegetables",
});

// Get all products
const products = await productService.getAll();

// Get product by ID
const product = await productService.getById("product-uuid");

// Update product
const updatedProduct = await productService.update("product-uuid", {
  name: "Premium Organic Tomatoes",
});

// Delete product
const deleteResult = await productService.delete("product-uuid");
```

### 2. Filtering and Pagination

```typescript
import { productListingService } from "./services";

// Get listings with filters
const farmerListings = await productListingService.getAll({
  filters: [
    { column: "farmer_id", operator: "eq", value: "farmer-uuid" },
    { column: "status", operator: "eq", value: "available" },
  ],
  pagination: {
    page: 1,
    limit: 10,
  },
  sorts: [{ column: "created_at", ascending: false }],
});

// Get count with filters
const activeListingsCount = await productListingService.count([
  { column: "status", operator: "eq", value: "available" },
]);
```

### 3. Service-Specific Methods

```typescript
import { profileService, orderService } from "./services";

// Get profiles by role
const farmers = await profileService.getByRole("farmer");

// Get verified farmers
const verifiedFarmers = await profileService.getVerifiedFarmers();

// Update verification status
const verifiedProfile = await profileService.updateVerificationStatus(
  "profile-uuid",
  true
);

// Get orders by buyer
const buyerOrders = await orderService.getByBuyer("buyer-uuid");

// Update order status
const updatedOrder = await orderService.updateStatus("order-uuid", "confirmed");
```

## Service Usage Examples

### 1. ProfileService

```typescript
import { profileService } from "./services";

// Get user profile
const getUserProfile = async (userId: string) => {
  const result = await profileService.getById(userId);
  if (result.success) {
    return result.data;
  } else {
    console.error("Failed to get profile:", result.error?.message);
    return null;
  }
};

// Update profile
const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const result = await profileService.update(userId, updates);
  return result.success ? result.data : null;
};

// Get all farmers
const getAllFarmers = async () => {
  const result = await profileService.getByRole("farmer");
  return result.success ? result.data : [];
};
```

### 2. ProductListingService

```typescript
import { productListingService } from "./services";

// Create product listing
const createListing = async (listingData: Partial<ProductListing>) => {
  const result = await productListingService.create(listingData);
  if (result.success) {
    console.log("Listing created:", result.data);
    return result.data;
  } else {
    console.error("Failed to create listing:", result.error?.message);
    return null;
  }
};

// Get available listings
const getAvailableListings = async () => {
  const result = await productListingService.getAll({
    filters: [{ column: "status", operator: "eq", value: "available" }],
    sorts: [{ column: "created_at", ascending: false }],
  });
  return result.success ? result.data : [];
};

// Search listings by price range
const searchListingsByPrice = async (minPrice: number, maxPrice: number) => {
  const result = await productListingService.getAll({
    filters: [
      { column: "price_per_unit", operator: "gte", value: minPrice },
      { column: "price_per_unit", operator: "lte", value: maxPrice },
      { column: "status", operator: "eq", value: "available" },
    ],
  });
  return result.success ? result.data : [];
};
```

### 3. OrderService

```typescript
import { orderService, orderItemsService } from "./services";

// Create new order
const createOrder = async (buyerId: string, totalAmount: number) => {
  const orderData = {
    buyer_id: buyerId,
    total_amount: totalAmount,
    status: "pending" as const,
  };

  const result = await orderService.create(orderData);
  return result.success ? result.data : null;
};

// Add items to order
const addOrderItem = async (
  orderId: string,
  listingId: string,
  quantity: number,
  price: number
) => {
  const itemData = {
    order_id: orderId,
    listing_id: listingId,
    quantity,
    price_at_purchase: price,
  };

  const result = await orderItemsService.create(itemData);
  return result.success ? result.data : null;
};

// Get order history for buyer
const getBuyerOrderHistory = async (buyerId: string) => {
  const result = await orderService.getByBuyer(buyerId);
  return result.success ? result.data : [];
};

// Update order status
const updateOrderStatus = async (orderId: string, status: string) => {
  const result = await orderService.updateStatus(orderId, status);
  return result.success ? result.data : null;
};
```

### 4. MessagesService

```typescript
import { messagesService } from "./services";

// Send message
const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string
) => {
  const messageData = {
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    status: "sent" as const,
  };

  const result = await messagesService.create(messageData);
  return result.success ? result.data : null;
};

// Get conversation between two users
const getConversation = async (userId1: string, userId2: string) => {
  const result = await messagesService.getAll({
    filters: [
      // Messages from user1 to user2 OR from user2 to user1
      // Note: This might need a custom service method for complex OR queries
    ],
  });
  return result.success ? result.data : [];
};
```

### 5. FarmTaskService

```typescript
import { farmTaskService } from "./services";

// Create farm task
const createFarmTask = async (
  farmerId: string,
  title: string,
  description?: string
) => {
  const taskData = {
    farmer_id: farmerId,
    title,
    description,
    status: "pending" as const,
  };

  const result = await farmTaskService.create(taskData);
  return result.success ? result.data : null;
};

// Get farmer's tasks
const getFarmerTasks = async (farmerId: string) => {
  const result = await farmTaskService.getAll({
    filters: [{ column: "farmer_id", operator: "eq", value: farmerId }],
    sorts: [{ column: "created_at", ascending: false }],
  });
  return result.success ? result.data : [];
};

// Update task status
const updateTaskStatus = async (taskId: string, status: string) => {
  const result = await farmTaskService.update(taskId, { status });
  return result.success ? result.data : null;
};
```

## Error Handling

### Error Structure

```typescript
interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  context?: string;
}
```

### Common Error Handling Pattern

```typescript
const handleServiceResponse = async <T>(
  serviceCall: Promise<ServiceResponse<T>>,
  onSuccess: (data: T) => void,
  onError?: (error: ServiceError) => void
) => {
  try {
    const result = await serviceCall;

    if (result.success && result.data) {
      onSuccess(result.data);
    } else if (result.error) {
      console.error("Service Error:", result.error);
      onError?.(result.error);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    onError?.({
      code: "UNEXPECTED_ERROR",
      message: "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    });
  }
};

// Usage
await handleServiceResponse(
  productService.getAll(),
  (products) => {
    console.log("Products loaded:", products);
    setProducts(products);
  },
  (error) => {
    console.error("Failed to load products:", error.message);
    setError(error.message);
  }
);
```

## Best Practices

### 1. Always Check Response Success

```typescript
// Good
const result = await productService.getById(id);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}

// Bad
const result = await productService.getById(id);
const product = result.data; // Could be null if error occurred
```

### 2. Use TypeScript Types

```typescript
// Good - Use proper types
const createProduct = async (productData: Partial<Product>) => {
  return await productService.create(productData);
};

// Bad - No type safety
const createProduct = async (productData: any) => {
  return await productService.create(productData);
};
```

### 3. Handle Loading States

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const loadProducts = async () => {
  setLoading(true);
  setError(null);

  try {
    const result = await productService.getAll();

    if (result.success) {
      setProducts(result.data || []);
    } else {
      setError(result.error?.message || "Failed to load products");
    }
  } catch (err) {
    setError("An unexpected error occurred");
  } finally {
    setLoading(false);
  }
};
```

### 4. Use Proper Filtering

```typescript
// Good - Use proper filter operators
const getExpensiveProducts = async () => {
  return await productListingService.getAll({
    filters: [{ column: "price_per_unit", operator: "gt", value: 100 }],
  });
};

// Good - Multiple filters
const getAvailableFarmProducts = async (farmerId: string) => {
  return await productListingService.getAll({
    filters: [
      { column: "farmer_id", operator: "eq", value: farmerId },
      { column: "status", operator: "eq", value: "available" },
    ],
  });
};
```

### 5. Implement Proper Pagination

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [totalCount, setTotalCount] = useState(0);
const pageSize = 10;

const loadProductsPage = async (page: number) => {
  const [dataResult, countResult] = await Promise.all([
    productService.getAll({
      pagination: {
        page,
        limit: pageSize,
      },
    }),
    productService.count(),
  ]);

  if (dataResult.success) {
    setProducts(dataResult.data || []);
  }

  if (countResult.success) {
    setTotalCount(countResult.data || 0);
  }
};
```

### 6. Cache Service Instances

```typescript
// Good - Import service instances
import { productService, orderService } from "./services";

// Bad - Create new instances repeatedly
const productService = new ProductService();
const orderService = new OrderService();
```

This guide covers the essential patterns and usage examples for integrating with the Krishi Sakhi backend. The services provide a clean, type-safe interface for all backend operations while handling validation, error management, and logging automatically.
