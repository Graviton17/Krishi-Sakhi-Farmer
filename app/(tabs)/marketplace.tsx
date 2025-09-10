import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert, 
  TouchableOpacity, 
  Modal,
  TextInput,
  View
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/lib';
import { 
  productListingService,
  productService,
  ProductListing,
  Product,
  ProductListingStatus
} from '@/lib';

export default function MarketplaceScreen() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newListing, setNewListing] = useState({
    product_id: '',
    price_per_unit: '',
    quantity_available: '',
    unit: 'kg',
    description: '',
    harvest_date: '',
    expiry_date: '',
  });

  const loadData = async () => {
    try {
      if (!user?.id) return;

      // Load farmer's product listings
      const listingsResponse = await productListingService.getAll({
        filters: [{ column: 'farmer_id', operator: 'eq', value: user.id }],
        sorts: [{ column: 'created_at', direction: 'desc' }]
      });

      if (listingsResponse.success) {
        setListings(listingsResponse.data || []);
      }

      // Load available products
      const productsResponse = await productService.getAll({
        sorts: [{ column: 'name', direction: 'asc' }]
      });

      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      Alert.alert('Error', 'Failed to load marketplace data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddListing = async () => {
    try {
      if (!user?.id || !newListing.product_id || !newListing.price_per_unit || !newListing.quantity_available) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const listingData = {
        ...newListing,
        farmer_id: user.id,
        price_per_unit: parseFloat(newListing.price_per_unit),
        quantity_available: parseInt(newListing.quantity_available),
        status: 'available' as ProductListingStatus,
        harvest_date: newListing.harvest_date || null,
        expiry_date: newListing.expiry_date || null,
      };

      const response = await productListingService.create(listingData);

      if (response.success) {
        setNewListing({
          product_id: '',
          price_per_unit: '',
          quantity_available: '',
          unit: 'kg',
          description: '',
          harvest_date: '',
          expiry_date: '',
        });
        setShowAddModal(false);
        loadData();
        Alert.alert('Success', 'Product listing created successfully');
      } else {
        Alert.alert('Error', 'Failed to create product listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'Failed to create product listing');
    }
  };

  const handleUpdateListingStatus = async (listingId: string, newStatus: ProductListingStatus) => {
    try {
      const response = await productListingService.update(listingId, { status: newStatus });

      if (response.success) {
        loadData();
        Alert.alert('Success', 'Listing status updated');
      } else {
        Alert.alert('Error', 'Failed to update listing status');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      Alert.alert('Error', 'Failed to update listing status');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      Alert.alert(
        'Delete Listing',
        'Are you sure you want to delete this listing?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const response = await productListingService.delete(listingId);
              if (response.success) {
                loadData();
                Alert.alert('Success', 'Listing deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete listing');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting listing:', error);
      Alert.alert('Error', 'Failed to delete listing');
    }
  };

  const getStatusColor = (status: ProductListingStatus) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'sold_out': return '#FF9800';
      case 'delisted': return '#F44336';
      default: return '#757575';
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const ListingItem = ({ listing }: { listing: ProductListing }) => (
    <ThemedView style={styles.listingItem}>
      <View style={styles.listingHeader}>
        <ThemedText style={styles.listingTitle}>
          {getProductName(listing.product_id)}
        </ThemedText>
        <View style={styles.listingActions}>
          {listing.status === 'available' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => handleUpdateListingStatus(listing.id, 'sold_out')}
            >
              <IconSymbol name="pause.fill" size={16} color="white" />
            </TouchableOpacity>
          )}
          {listing.status === 'sold_out' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleUpdateListingStatus(listing.id, 'available')}
            >
              <IconSymbol name="play.fill" size={16} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            onPress={() => handleDeleteListing(listing.id)}
          >
            <IconSymbol name="trash" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.listingDetails}>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Price:</ThemedText>
          <ThemedText style={styles.detailValue}>₹{listing.price_per_unit}/{listing.unit}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Available:</ThemedText>
          <ThemedText style={styles.detailValue}>{listing.quantity_available} {listing.unit}</ThemedText>
        </View>
        {listing.description && (
          <ThemedText style={styles.listingDescription}>{listing.description}</ThemedText>
        )}
        {listing.harvest_date && (
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Harvested:</ThemedText>
            <ThemedText style={styles.detailValue}>
              {new Date(listing.harvest_date).toLocaleDateString()}
            </ThemedText>
          </View>
        )}
      </View>
      
      <View style={styles.listingMeta}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(listing.status) }]}>
          <ThemedText style={styles.statusText}>{listing.status}</ThemedText>
        </View>
        <ThemedText style={styles.createdDate}>
          Listed: {new Date(listing.created_at).toLocaleDateString()}
        </ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Marketplace</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {listings.length > 0 ? (
          listings.map((listing) => <ListingItem key={listing.id} listing={listing} />)
        ) : (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="cart.fill" size={48} color="#757575" />
            <ThemedText style={styles.emptyText}>No listings yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>Add your first product listing to start selling</ThemedText>
          </ThemedView>
        )}
      </ScrollView>

      {/* Add Listing Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Add New Listing</ThemedText>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <IconSymbol name="xmark" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Product *</ThemedText>
              <View style={styles.productSelector}>
                {products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.productOption,
                      newListing.product_id === product.id && styles.productOptionActive
                    ]}
                    onPress={() => setNewListing(prev => ({ ...prev, product_id: product.id }))}
                  >
                    <ThemedText style={[
                      styles.productOptionText,
                      newListing.product_id === product.id && styles.productOptionTextActive
                    ]}>
                      {product.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Price per Unit (₹) *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newListing.price_per_unit}
                onChangeText={(text) => setNewListing(prev => ({ ...prev, price_per_unit: text }))}
                placeholder="Enter price per unit"
                placeholderTextColor="#757575"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Quantity Available *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newListing.quantity_available}
                onChangeText={(text) => setNewListing(prev => ({ ...prev, quantity_available: text }))}
                placeholder="Enter quantity"
                placeholderTextColor="#757575"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Unit</ThemedText>
              <View style={styles.unitSelector}>
                {['kg', 'g', 'lb', 'ton', 'piece', 'dozen'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitOption,
                      newListing.unit === unit && styles.unitOptionActive
                    ]}
                    onPress={() => setNewListing(prev => ({ ...prev, unit }))}
                  >
                    <ThemedText style={[
                      styles.unitOptionText,
                      newListing.unit === unit && styles.unitOptionTextActive
                    ]}>
                      {unit}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newListing.description}
                onChangeText={(text) => setNewListing(prev => ({ ...prev, description: text }))}
                placeholder="Enter product description"
                placeholderTextColor="#757575"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Harvest Date</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newListing.harvest_date}
                onChangeText={(text) => setNewListing(prev => ({ ...prev, harvest_date: text }))}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor="#757575"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Expiry Date</ThemedText>
              <TextInput
                style={styles.textInput}
                value={newListing.expiry_date}
                onChangeText={(text) => setNewListing(prev => ({ ...prev, expiry_date: text }))}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor="#757575"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAddModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleAddListing}
            >
              <ThemedText style={styles.saveButtonText}>Add Listing</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listingItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listingTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  listingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: '600',
  },
  listingDescription: {
    opacity: 0.7,
    marginTop: 8,
    lineHeight: 20,
  },
  listingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  createdDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    opacity: 0.7,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  productSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productOption: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  productOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  productOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productOptionTextActive: {
    color: 'white',
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitOption: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  unitOptionActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unitOptionTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
