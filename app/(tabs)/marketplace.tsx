import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  Card,
  Column,
  Container,
  Row,
  ScreenContainer,
  Spacer,
} from "@/components/ui/Layout";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  Product,
  ProductListing,
  productListingService,
  ProductListingStatus,
  productService,
} from "@/lib";

export default function MarketplaceScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
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

  const filteredListings = getFilteredListings();

  const renderListingCard = (listing: ProductListing) => {
    const product = products.find((p) => p.id === listing.product_id);
    const isMyListing = listing.farmer_id === user?.id;

    return (
      <Card key={listing.id} style={styles.listingCard}>
        <Column gap={12}>
          <Row justify="space-between" align="center">
            <Column gap={4} style={{ flex: 1 }}>
              <Text style={[styles.productName, { color: colors.text }]}>
                {getProductName(listing.product_id)}
              </Text>
              <Text style={[styles.category, { color: colors.icon }]}>
                {product?.category || "Category"}
              </Text>
            </Column>
            {isMyListing && (
              <View
                style={[
                  styles.myListingBadge,
                  { backgroundColor: colors.success },
                ]}
              >
                <Text style={styles.myListingText}>My Listing</Text>
              </View>
            )}
          </Row>

          <Row justify="space-between" align="center">
            <Column gap={4}>
              <Text style={[styles.price, { color: colors.success }]}>
                ₹{listing.price_per_unit}/{listing.unit_of_measure}
              </Text>
              <Text style={[styles.quantity, { color: colors.icon }]}>
                {listing.quantity_available} {listing.unit_of_measure} available
              </Text>
            </Column>
            <Column align="flex-end" gap={4}>
              <Text style={[styles.harvestDate, { color: colors.icon }]}>
                Harvested:{" "}
                {new Date(listing.harvest_date || "").toLocaleDateString()}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.statusText}>{listing.status}</Text>
              </View>
            </Column>
          </Row>

          {product?.description && (
            <Text
              style={[styles.description, { color: colors.text }]}
              numberOfLines={2}
            >
              {product.description}
            </Text>
          )}
        </Column>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <Container style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Spacer size="md" />
          <Text style={[styles.loadingText, { color: colors.icon }]}>
            Loading marketplace...
          </Text>
        </Container>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Container>
        {/* Welcome Section */}
        <Card padding="lg">
          <Column gap={8}>
            <Text style={[styles.title, { color: colors.text }]}>
              Marketplace 🛒
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Fresh produce from local farmers
            </Text>
          </Column>
        </Card>

        <Spacer size="md" />

        {/* Search Bar */}
        <Card padding="md">
          <Row align="center" gap={12}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.icon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text, flex: 1 }]}
              placeholder="Search products..."
              placeholderTextColor={colors.icon}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Row>
        </Card>

        <Spacer size="md" />

        {/* Add Product Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Row align="center" justify="center" gap={8}>
            <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Product Listing</Text>
          </Row>
        </TouchableOpacity>

        <Spacer size="lg" />

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            <Column gap={16}>{filteredListings.map(renderListingCard)}</Column>
            <Spacer size="xl" />
          </ScrollView>
        ) : (
          <Card padding="lg">
            <Column align="center" gap={16}>
              <IconSymbol name="storefront" size={48} color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No listings found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Be the first to add a product listing!"}
              </Text>
              <TouchableOpacity
                style={[styles.emptyAction, { backgroundColor: colors.tint }]}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyActionText}>Add Product</Text>
              </TouchableOpacity>
            </Column>
          </Card>
        )}
      </Container>

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 8,
  },
  addButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listingCard: {
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
  },
  category: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  myListingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  myListingText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
  },
  quantity: {
    fontSize: 14,
    fontWeight: "500",
  },
  harvestDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyAction: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    padding: 20,
    paddingTop: 60,
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
  listingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
