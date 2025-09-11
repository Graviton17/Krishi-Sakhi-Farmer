import { productListingService } from "@/services/entities";
import type { ProductListing } from "@/types/supabase";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProductListingWithDetails extends ProductListing {
  products?: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    image_url: string | null;
  };
  profiles?: {
    full_name: string | null;
    location_gln: string | null;
    is_verified: boolean;
  };
}

export default function FarmerMarketplace() {
  const [listings, setListings] = useState<ProductListingWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productListingService.getAvailable();
      if (response.error) {
        setError(response.error.message);
        return;
      }
      setListings(response.data || []);
    } catch {
      setError("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const renderListingItem = ({ item }: { item: ProductListingWithDetails }) => (
    <View style={styles.listingCard}>
      <View style={styles.listingContent}>
        {item.products?.image_url && (
          <Image
            source={{ uri: item.products.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.listingInfo}>
          <View style={styles.listingHeader}>
            <Text style={styles.productName}>{item.products?.name}</Text>
            {item.profiles?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.farmerName}>
            by {item.profiles?.full_name || "Anonymous Farmer"}
          </Text>

          <View style={styles.priceQuantityRow}>
            <View>
              <Text style={styles.price}>₹{item.price_per_unit}</Text>
              <Text style={styles.priceUnit}>per {item.unit_of_measure}</Text>
            </View>

            <View style={styles.quantityInfo}>
              <Text style={styles.quantityText}>
                {item.quantity_available} {item.unit_of_measure}
              </Text>
              <Text style={styles.quantityLabel}>available</Text>
            </View>
          </View>

          {item.harvest_date && (
            <Text style={styles.harvestDate}>
              Harvested: {new Date(item.harvest_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Make Offer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading fresh produce... 🌱</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Unable to load listings</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchListings}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fresh From Farm 🚜</Text>
        <Text style={styles.headerSubtitle}>
          Discover quality produce directly from verified farmers
        </Text>
      </View>

      <FlatList
        data={listings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={fetchListings}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No listings available</Text>
            <Text style={styles.emptyMessage}>
              Check back later for fresh produce!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "#6b7280",
  },
  flatListContent: {
    padding: 16,
  },
  listingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  listingContent: {
    flexDirection: "row",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  listingInfo: {
    flex: 1,
  },
  listingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  verifiedBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "500",
  },
  farmerName: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  priceQuantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  priceUnit: {
    fontSize: 12,
    color: "#6b7280",
  },
  quantityInfo: {
    alignItems: "flex-end",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  quantityLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  harvestDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: "#374151",
    fontWeight: "600",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingCard: {
    backgroundColor: "white",
    padding: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 24,
  },
  errorCard: {
    backgroundColor: "white",
    padding: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 8,
  },
  errorMessage: {
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyMessage: {
    color: "#6b7280",
    textAlign: "center",
  },
});
