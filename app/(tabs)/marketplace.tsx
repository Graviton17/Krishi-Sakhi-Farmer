import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import {
  Product,
  ProductListing,
  productListingService,
  ProductListingStatus,
  productService,
} from "@/lib";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MarketplaceScreen() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListing, setNewListing] = useState({
    product_id: "",
    quantity_available: "",
    unit_of_measure: "kg",
    price_per_unit: "",
    harvest_date: "",
  });

  const loadMarketplaceData = useCallback(async () => {
    try {
      if (!user?.id) return;

      console.log("Loading marketplace data for user:", user.id);

      // Load all available product listings
      const listingsResponse = await productListingService.getAll({
        filters: [{ column: "status", operator: "eq", value: "available" }],
        sorts: [{ column: "created_at", ascending: false }],
        pagination: { page: 1, limit: 50 },
      });

      if (listingsResponse.success && listingsResponse.data) {
        console.log(
          "Listings loaded successfully:",
          listingsResponse.data.length
        );
        setListings(listingsResponse.data);
      } else {
        console.error("Failed to load listings:", listingsResponse.error);
      }

      // Load all products
      const productsResponse = await productService.getAll({
        sorts: [{ column: "name", ascending: true }],
      });

      if (productsResponse.success && productsResponse.data) {
        console.log(
          "Products loaded successfully:",
          productsResponse.data.length
        );
        setProducts(productsResponse.data);
      } else {
        console.error("Failed to load products:", productsResponse.error);
      }
    } catch (error) {
      console.error("Error loading marketplace data:", error);
      Alert.alert(
        "Error",
        "Failed to load marketplace data. Please try again."
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadMarketplaceData();
    }
  }, [user?.id, loadMarketplaceData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMarketplaceData();
  };

  const handleAddListing = async () => {
    try {
      if (
        !user?.id ||
        !newListing.product_id ||
        !newListing.quantity_available ||
        !newListing.price_per_unit
      ) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      const listingData = {
        farmer_id: user.id,
        product_id: newListing.product_id,
        quantity_available: parseInt(newListing.quantity_available),
        unit_of_measure: newListing.unit_of_measure,
        price_per_unit: parseFloat(newListing.price_per_unit),
        status: "available" as ProductListingStatus,
        harvest_date: newListing.harvest_date || null,
      };

      console.log("Creating new listing:", listingData);
      const response = await productListingService.create(listingData);

      if (response.success && response.data) {
        console.log("Listing created successfully:", response.data);
        setListings((prev) => [response.data!, ...prev]);
        setNewListing({
          product_id: "",
          quantity_available: "",
          unit_of_measure: "kg",
          price_per_unit: "",
          harvest_date: "",
        });
        setShowAddModal(false);
        Alert.alert("Success", "Product listing created successfully!");
      } else {
        console.error("Failed to create listing:", response.error);
        Alert.alert(
          "Error",
          response.error?.message || "Failed to create listing"
        );
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      Alert.alert("Error", "Failed to create listing. Please try again.");
    }
  };

  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown Product";
  };

  const getFilteredListings = () => {
    let filtered = listings;

    if (searchQuery) {
      filtered = filtered.filter((listing) => {
        const productName = getProductName(listing.product_id).toLowerCase();
        return productName.includes(searchQuery.toLowerCase());
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter((listing) => {
        const product = products.find((p) => p.id === listing.product_id);
        return (
          product?.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
      });
    }

    return filtered;
  };

  const ListingCard = ({ listing }: { listing: ProductListing }) => {
    const product = products.find((p) => p.id === listing.product_id);
    const isMyListing = listing.farmer_id === user?.id;

    return (
      <ThemedView style={styles.listingCard}>
        {product?.image_url && (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
          />
        )}
        <View style={styles.listingContent}>
          <View style={styles.listingHeader}>
            <ThemedText style={styles.productName}>
              {product?.name || "Unknown Product"}
            </ThemedText>
            {isMyListing && (
              <View style={styles.myListingBadge}>
                <ThemedText style={styles.myListingText}>My Listing</ThemedText>
              </View>
            )}
          </View>

          {product?.description && (
            <ThemedText style={styles.productDescription}>
              {product.description}
            </ThemedText>
          )}

          <View style={styles.listingDetails}>
            <View style={styles.detailRow}>
              <IconSymbol name="scalemass.fill" size={16} color="#666" />
              <ThemedText style={styles.detailText}>
                {listing.quantity_available} {listing.unit_of_measure}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol
                name="dollarsign.circle.fill"
                size={16}
                color="#4CAF50"
              />
              <ThemedText style={styles.priceText}>
                ₹{listing.price_per_unit}/{listing.unit_of_measure}
              </ThemedText>
            </View>

            {listing.harvest_date && (
              <View style={styles.detailRow}>
                <IconSymbol name="calendar" size={16} color="#666" />
                <ThemedText style={styles.detailText}>
                  Harvested:{" "}
                  {new Date(listing.harvest_date).toLocaleDateString()}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.listingFooter}>
            <ThemedText style={styles.dateText}>
              Listed: {new Date(listing.created_at).toLocaleDateString()}
            </ThemedText>
            {!isMyListing && (
              <TouchableOpacity style={styles.contactButton}>
                <ThemedText style={styles.contactButtonText}>
                  Contact Farmer
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ThemedView>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <ThemedText style={styles.loadingText}>
          Loading marketplace...
        </ThemedText>
      </View>
    );
  }

  const filteredListings = getFilteredListings();

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Marketplace</ThemedText>
        <ThemedText style={styles.subtitle}>
          Fresh produce from local farmers
        </ThemedText>
      </ThemedView>

      {/* Search Bar */}
      <ThemedView style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnifyingglass" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </ThemedView>

      {/* Listings */}
      <ScrollView
        style={styles.listingsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="storefront" size={64} color="#CCC" />
            <ThemedText style={styles.emptyStateText}>
              {searchQuery ? "No products found" : "No listings available"}
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {searchQuery
                ? "Try adjusting your search terms"
                : "Be the first to list your products!"}
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      {/* Add Listing FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <IconSymbol name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Add Listing Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>
              Add Product Listing
            </ThemedText>
            <TouchableOpacity onPress={handleAddListing}>
              <ThemedText style={styles.saveButton}>List</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Product *</ThemedText>
              <View style={styles.pickerContainer}>
                {products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productOption,
                      newListing.product_id === product.id &&
                        styles.productOptionSelected,
                    ]}
                    onPress={() =>
                      setNewListing((prev) => ({
                        ...prev,
                        product_id: product.id,
                      }))
                    }
                  >
                    <ThemedText
                      style={[
                        styles.productOptionText,
                        newListing.product_id === product.id &&
                          styles.productOptionTextSelected,
                      ]}
                    >
                      {product.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                Quantity Available *
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={newListing.quantity_available}
                onChangeText={(text) =>
                  setNewListing((prev) => ({
                    ...prev,
                    quantity_available: text,
                  }))
                }
                placeholder="Enter quantity"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Unit of Measure</ThemedText>
              <View style={styles.unitSelector}>
                {["kg", "grams", "liters", "pieces", "boxes"].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitOption,
                      newListing.unit_of_measure === unit &&
                        styles.unitOptionSelected,
                    ]}
                    onPress={() =>
                      setNewListing((prev) => ({
                        ...prev,
                        unit_of_measure: unit,
                      }))
                    }
                  >
                    <ThemedText
                      style={[
                        styles.unitOptionText,
                        newListing.unit_of_measure === unit &&
                          styles.unitOptionTextSelected,
                      ]}
                    >
                      {unit}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                Price per Unit *
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={newListing.price_per_unit}
                onChangeText={(text) =>
                  setNewListing((prev) => ({ ...prev, price_per_unit: text }))
                }
                placeholder="Enter price in ₹"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Harvest Date</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newListing.harvest_date}
                onChangeText={(text) =>
                  setNewListing((prev) => ({ ...prev, harvest_date: text }))
                }
                placeholder="YYYY-MM-DD (optional)"
              />
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  listingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  listingContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  myListingBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  myListingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  productDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 20,
  },
  listingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  priceText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  listingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  dateText: {
    fontSize: 12,
    opacity: 0.5,
  },
  contactButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    fontSize: 16,
    color: "#FF4444",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  pickerContainer: {
    gap: 8,
  },
  productOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  productOptionSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  productOptionText: {
    fontSize: 16,
  },
  productOptionTextSelected: {
    color: "white",
    fontWeight: "500",
  },
  unitSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  unitOptionSelected: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  unitOptionText: {
    fontSize: 14,
  },
  unitOptionTextSelected: {
    color: "white",
    fontWeight: "500",
  },
});
