-- ===============================================================
-- KRISHI SAKHI DATABASE SCHEMA
-- Complete schema for agricultural marketplace platform
-- ===============================================================

-- Create custom ENUM types to ensure data consistency for status fields.
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('farmer', 'distributor', 'retailer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_listing_status AS ENUM ('available', 'sold_out', 'delisted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'confirmed', 'shipping', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shipment_status AS ENUM ('in_transit', 'delivered', 'delayed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE negotiation_status AS ENUM ('pending', 'accepted', 'rejected', 'countered');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =================================================================
-- 1. USERS & PROFILES
-- Central table for all user profiles, linked to Supabase's auth.
-- =================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    company_name TEXT,
    full_name TEXT,
    contact_email TEXT UNIQUE,
    phone_number TEXT,
    address TEXT,
    location_gln TEXT UNIQUE, -- GS1 Global Location Number
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for profiles table
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_location_gln ON profiles(location_gln);

-- =================================================================
-- 2. PRODUCTS & LISTINGS
-- products is the master catalog, product_listings are items for sale.
-- =================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT,
    gtin TEXT UNIQUE, -- GS1 Global Trade Item Number
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for products table
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_gtin ON products(gtin);

CREATE TABLE product_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_available NUMERIC(10, 2) NOT NULL,
    unit_of_measure TEXT NOT NULL, -- e.g., 'kg', 'box', 'bunch'
    price_per_unit NUMERIC(10, 2) NOT NULL,
    status product_listing_status DEFAULT 'available',
    harvest_date DATE,
    quality_report_id UUID, -- Can be nullable, links to AI quality report
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for product_listings table
CREATE INDEX idx_product_listings_farmer_id ON product_listings(farmer_id);
CREATE INDEX idx_product_listings_product_id ON product_listings(product_id);
CREATE INDEX idx_product_listings_status ON product_listings(status);
CREATE INDEX idx_product_listings_price ON product_listings(price_per_unit);

-- =================================================================
-- 3. MARKETPLACE & ORDERS
-- Tables to manage the core marketplace functionality.
-- =================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Reference to the seller/farmer
    status order_status DEFAULT 'pending',
    total_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for orders table
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES product_listings(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL
);

-- Indexes for order_items table
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_listing_id ON order_items(listing_id);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Reference to the seller receiving payment
    stripe_charge_id TEXT UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    status payment_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for payments table
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_seller_id ON payments(seller_id);

-- =================================================================
-- 4. TRUST & TRANSPARENCY
-- Tables for reviews, certifications, and AI quality reports.
-- =================================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for reviews table
CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);

CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Farmer or Retailer
    name TEXT NOT NULL, -- e.g., 'USDA Organic'
    issuing_body TEXT,
    valid_until DATE,
    ipfs_hash TEXT UNIQUE, -- Hash of the certificate document on IPFS
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for certifications table
CREATE INDEX idx_certifications_owner_id ON certifications(owner_id);

CREATE TABLE quality_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
    ipfs_hash_images TEXT, -- Hash of the image(s) used for analysis
    ai_score NUMERIC(5, 2), -- e.g., 95.50
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Link the quality_report_id in product_listings to this table
ALTER TABLE product_listings
ADD CONSTRAINT fk_quality_report
FOREIGN KEY (quality_report_id)
REFERENCES quality_reports(id) ON DELETE SET NULL;

-- Indexes for quality_reports table
CREATE INDEX idx_quality_reports_listing_id ON quality_reports(listing_id);

-- =================================================================
-- 5. COMMUNICATION & LOGISTICS
-- =================================================================
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Optional: link message to an order
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- Indexes for messages table
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_order_id ON messages(order_id);

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number TEXT,
    carrier TEXT,
    status shipment_status DEFAULT 'in_transit',
    shipped_at TIMESTAMPTZ,
    estimated_delivery_date DATE,
    delivered_at TIMESTAMPTZ
);

-- Indexes for shipments table
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- =================================================================
-- 6. RETAILER PLATFORM SPECIFIC
-- Tables for inventory and cold chain monitoring.
-- =================================================================
CREATE TABLE retailer_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES product_listings(id) ON DELETE RESTRICT,
    quantity_on_hand NUMERIC(10, 2) NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- Indexes for retailer_inventory table
CREATE INDEX idx_retailer_inventory_retailer_id ON retailer_inventory(retailer_id);
CREATE INDEX idx_retailer_inventory_listing_id ON retailer_inventory(listing_id);

CREATE TABLE cold_chain_logs (
    id BIGSERIAL PRIMARY KEY,
    retailer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    storage_unit_id TEXT NOT NULL, -- e.g., 'Freezer-01', 'Cooler-A'
    temperature NUMERIC(5, 2) NOT NULL,
    notes TEXT,
    logged_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for cold_chain_logs table
CREATE INDEX idx_cold_chain_logs_retailer_id ON cold_chain_logs(retailer_id);
CREATE INDEX idx_cold_chain_logs_storage_unit_id ON cold_chain_logs(storage_unit_id);
CREATE INDEX idx_cold_chain_logs_timestamp ON cold_chain_logs(created_at DESC);

-- =================================================================
-- 7. ENHANCEMENTS & UTILITIES
-- New tables and functions to support additional features.
-- =================================================================

-- Table to link off-chain records with on-chain transactions
CREATE TABLE blockchain_tx_references (
    id BIGSERIAL PRIMARY KEY,
    related_table TEXT NOT NULL, -- e.g., 'orders', 'shipments'
    related_id UUID NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE, -- The transaction hash from Hyperledger Fabric
    tx_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for blockchain_tx_references table
CREATE INDEX idx_blockchain_tx_references_related_entity ON blockchain_tx_references(related_table, related_id);

-- Table for price negotiations
CREATE TABLE negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offered_price NUMERIC(10, 2) NOT NULL,
    status negotiation_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for negotiations table
CREATE INDEX idx_negotiations_listing_id ON negotiations(listing_id);
CREATE INDEX idx_negotiations_buyer_id ON negotiations(buyer_id);
CREATE INDEX idx_negotiations_status ON negotiations(status);

-- Table for dispute resolution
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status dispute_status DEFAULT 'open',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Indexes for disputes table
CREATE INDEX idx_disputes_order_id ON disputes(order_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Table for farmer tasks
CREATE TABLE farm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status task_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for farm_tasks table
CREATE INDEX idx_farm_tasks_farmer_id ON farm_tasks(farmer_id);
CREATE INDEX idx_farm_tasks_status ON farm_tasks(status);

-- =================================================================
-- 8. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =================================================================

-- Function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with an 'updated_at' column
CREATE TRIGGER on_profiles_update BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_product_listings_update BEFORE UPDATE ON product_listings FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_orders_update BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_negotiations_update BEFORE UPDATE ON negotiations FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_farm_tasks_update BEFORE UPDATE ON farm_tasks FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- =================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailer_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_chain_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_tx_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_tasks ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize as needed)

-- Profiles: Public read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Products: Public read, authenticated users can create
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Product listings: Public read, farmers can manage their own
CREATE POLICY "Product listings are viewable by everyone" ON product_listings
  FOR SELECT USING (true);

CREATE POLICY "Farmers can manage their listings" ON product_listings
  FOR ALL USING (auth.uid() = farmer_id);

-- Orders: Users can see orders they're involved in
CREATE POLICY "Users can view their orders" ON orders
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Farm tasks: Farmers can manage their own tasks
CREATE POLICY "Farmers can manage their tasks" ON farm_tasks
  FOR ALL USING (auth.uid() = farmer_id);

-- Messages: Users can see messages they sent or received
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reviews: Public read, authenticated users can create
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reviewer_id);

-- =================================================================
-- 10. INITIAL DATA (OPTIONAL)
-- =================================================================

-- Insert sample product categories
INSERT INTO products (name, description, category) VALUES
('Organic Tomatoes', 'Fresh organic tomatoes grown without pesticides', 'Vegetables'),
('Basmati Rice', 'Premium long-grain basmati rice', 'Grains'),
('Fresh Milk', 'Farm-fresh whole milk', 'Dairy'),
('Free-Range Eggs', 'Eggs from free-range chickens', 'Dairy'),
('Organic Spinach', 'Fresh organic spinach leaves', 'Vegetables'),
('Wheat Flour', 'Whole wheat flour', 'Grains')
ON CONFLICT DO NOTHING;

-- Schema setup complete!
-- Remember to:
-- 1. Configure authentication providers in Supabase Dashboard
-- 2. Set up storage buckets if using file uploads
-- 3. Configure custom SMTP for emails
-- 4. Add any additional RLS policies specific to your use case
