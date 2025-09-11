import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import {
  Product,
  ProductListing,
  productListingService,
  ProductListingStatus,
  productService,
  useAuth
} from '@/lib';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


export default function MarketplaceScreen() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const { user, signIn, getCurrentUser, loading: authLoading } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(!user);

  const handleLogin = async () => {
    console.log('Login attempt with email:', loginEmail);
    
    if (!loginEmail || !loginPassword) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      const response = await signIn({
        email: loginEmail,
        password: loginPassword
      });
      
      console.log('Login response:', {
        success: response.success,
        hasUser: !!response.data?.user,
        hasSession: !!response.data?.session,
        error: response.error
      });

      if (response.success && response.data?.user && response.data?.session) {
        const userId = response.data.user.id;
        console.log('Login successful, user ID:', userId);
        
        // Verify the user data is properly loaded
        const currentUser = await getCurrentUser();
        console.log('Current user data:', {
          success: currentUser.success,
          hasUser: !!currentUser.data,
          userId: currentUser.data?.id
        });

        if (!currentUser.success || !currentUser.data?.id) {
          console.error('User data not properly loaded:', currentUser.error);
          Alert.alert(
            'Login Error',
            'Failed to load user data. Please try again.'
          );
          return;
        }

        setShowLoginModal(false);
        setLoginEmail('');
        setLoginPassword('');
      } else {
        console.error('Login failed:', response.error);
        Alert.alert(
          'Login Failed', 
          response.error?.message || 'Please check your email and password'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Error',
        error instanceof Error ? error.message : 'Failed to sign in. Please try again.'
      );
    }
  };
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load products and listings, with search and category filter
  const loadData = async () => {
    console.log('Loading data with user:', user?.id);
    setIsLoading(true);
    try {

      // Use static user ID for development
      const userId = 'static-user-id-123';
      console.log('Using static user ID:', userId);

      // Load farmer's product listings
      console.log('Fetching listings for farmer:', userId);
      const listingsResponse = await productListingService.getAll({
        filters: [{ column: 'farmer_id', operator: 'eq', value: userId }],
        sorts: [{ column: 'created_at', ascending: false }]
      });
      console.log('Listings response:', listingsResponse);
      
      if (listingsResponse.error) {
        console.error('Error fetching listings:', listingsResponse.error);
        Alert.alert('Error', `Failed to load listings: ${listingsResponse.error.message}`);
        return;
      }
      
      if (listingsResponse.data) {
        console.log(`Found ${listingsResponse.data.length} listings`);
        setListings(listingsResponse.data);
      }

      // Product search or category filter
      console.log('Fetching products with:', { searchQuery, selectedCategory });
      let productsResponse;
      if (searchQuery) {
        productsResponse = await productService.searchProducts(searchQuery);
      } else if (selectedCategory) {
        productsResponse = await productService.getByCategory(selectedCategory);
      } else {
        productsResponse = await productService.getAll({
          sorts: [{ column: 'name', ascending: true }]
        });
      }
      console.log('Products response:', productsResponse);

      if (productsResponse.error) {
        console.error('Error fetching products:', productsResponse.error);
        Alert.alert('Error', `Failed to load products: ${productsResponse.error.message}`);
        return;
      }

      if (productsResponse.data) {
        console.log(`Found ${productsResponse.data.length} products`);
        setProducts(productsResponse.data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error loading marketplace data:', error);
      Alert.alert('Error', `Failed to load marketplace data: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('Loading data with user:', user?.id);
    // Always keep login modal hidden for development
    setShowLoginModal(false);
    
    loadData().catch(error => {
      console.error('Error in loadData:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchQuery, selectedCategory]);
  // Category list for filter (example, replace with your categories)
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Product details modal
  const openProductModal = (product: Product) => {
    console.log('Opening product modal with:', product);
    setModalProduct(product);
    setShowProductModal(true);
  };
  const closeProductModal = () => {
    console.log('Closing product modal');
    setShowProductModal(false);
    setModalProduct(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddListing = async () => {
    console.log('Starting handleAddListing');
    try {
      // Detailed validation
      if (!user?.id) {
        console.error('No user ID found');
        Alert.alert('Authentication Error', 'Please log in to create a listing');
        return;
      }
      
      console.log('User authenticated:', user.id);
      
      // Validate required fields
      const missingFields = [];
      if (!newListing.product_id) missingFields.push('Product');
      if (!newListing.price_per_unit) missingFields.push('Price per Unit');
      if (!newListing.quantity_available) missingFields.push('Quantity Available');
      
      if (missingFields.length > 0) {
        Alert.alert('Missing Fields', `Please fill in: ${missingFields.join(', ')}`);
        return;
      }

      // Validate numeric fields
      const price = parseFloat(newListing.price_per_unit);
      const quantity = parseInt(newListing.quantity_available);

      if (isNaN(price) || price <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid price');
        return;
      }

      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid quantity');
        return;
      }

      // Validate dates if provided
      if (newListing.harvest_date && !/^\d{4}-\d{2}-\d{2}$/.test(newListing.harvest_date)) {
        Alert.alert('Invalid Date', 'Harvest date should be in YYYY-MM-DD format');
        return;
      }

      if (newListing.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(newListing.expiry_date)) {
        Alert.alert('Invalid Date', 'Expiry date should be in YYYY-MM-DD format');
        return;
      }

      const listingData = {
        ...newListing,
        farmer_id: user.id,
        price_per_unit: price,
        quantity_available: quantity,
        status: 'available' as ProductListingStatus,
        harvest_date: newListing.harvest_date || null,
        expiry_date: newListing.expiry_date || null,
      };

      console.log('Attempting to create listing with data:', listingData);

      const response = await productListingService.create(listingData);
      console.log('Server response:', response);

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
        const errorMessage = response.error?.message || 'Unknown error occurred';
        console.error('Server error:', response.error);
        Alert.alert('Error', `Failed to create product listing: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to create product listing: ${errorMessage}`);
    }
  };

  const handleUpdateListingStatus = async (listingId: string, newStatus: ProductListingStatus) => {
    try {
      console.log('Updating listing status:', { listingId, newStatus });
      
      if (!listingId) {
        console.error('No listing ID provided');
        Alert.alert('Error', 'Invalid listing ID');
        return;
      }

      const response = await productListingService.update(listingId, { status: newStatus });
      console.log('Update response:', response);

      if (response.success) {
        await loadData();
        Alert.alert('Success', 'Listing status updated');
      } else {
        const errorMessage = response.error?.message || 'Unknown error';
        console.error('Failed to update listing:', errorMessage);
        Alert.alert('Error', `Failed to update listing status: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating listing:', error);
      Alert.alert('Error', `Failed to update listing status: ${errorMessage}`);
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

  // Product list UI (with search/filter)
  const ProductList = () => (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <TextInput
          style={styles.textInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          placeholderTextColor="#757575"
        />
        <View style={{ marginLeft: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.unitOption, !selectedCategory && styles.unitOptionActive]}
              onPress={() => setSelectedCategory('')}
            >
              <ThemedText style={styles.unitOptionText}>All</ThemedText>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.unitOption, selectedCategory === cat && styles.unitOptionActive]}
                onPress={() => setSelectedCategory(cat || '')}
              >
                <ThemedText style={styles.unitOptionText}>{cat}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {products.map(product => (
          <TouchableOpacity
            key={product.id}
            style={{ marginRight: 12, padding: 12, borderRadius: 8, backgroundColor: '#222' }}
            onPress={() => openProductModal(product)}
          >
            <ThemedText style={{ color: 'white', fontWeight: '600' }}>{product.name}</ThemedText>
            {product.category && (
              <ThemedText style={{ color: '#aaa', fontSize: 12 }}>{product.category}</ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

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
          <ThemedText style={styles.detailValue}>₹{listing.price_per_unit}/{listing.unit_of_measure}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Available:</ThemedText>
          <ThemedText style={styles.detailValue}>{listing.quantity_available} {listing.unit_of_measure}</ThemedText>
        </View>
        {/* Description is moved to the service layer */}
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
      {/* Loading Indicator */}
      {(authLoading || isLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      )}
      {/* Login Modal */}
      <Modal
        visible={showLoginModal}
        animationType="slide"
        onRequestClose={() => {
          if (!authLoading) setShowLoginModal(false);
        }}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Login Required</ThemedText>
            <ThemedText style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
              Please sign in to access the marketplace
            </ThemedText>
          </View>
          <View style={[styles.modalContent, { padding: 16 }]}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Email</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: !loginEmail && showLoginModal ? '#ff4444' : '#333' }
                ]}
                value={loginEmail}
                onChangeText={(text) => {
                  setLoginEmail(text.trim());
                  console.log('Email input:', text.trim());
                }}
                placeholder="Enter your email"
                placeholderTextColor="#757575"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!authLoading}
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: !loginPassword && showLoginModal ? '#ff4444' : '#333' }
                ]}
                value={loginPassword}
                onChangeText={(text) => {
                  setLoginPassword(text);
                  console.log('Password length:', text.length);
                }}
                placeholder="Enter your password"
                placeholderTextColor="#757575"
                secureTextEntry
                editable={!authLoading}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.saveButton,
                (!loginEmail || !loginPassword) && { opacity: 0.7 },
                authLoading && { opacity: 0.5 }
              ]}
              onPress={() => {
                console.log('Login button pressed');
                handleLogin();
              }}
              disabled={authLoading || !loginEmail || !loginPassword}
            >
              <ThemedText style={styles.saveButtonText}>
                {authLoading ? 'Signing in...' : 'Sign In'}
              </ThemedText>
            </TouchableOpacity>
            {/* Test Account Info (remove in production) */}
            <View style={{ marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 8 }}>
              <ThemedText style={{ color: '#fff', fontSize: 12 }}>
                Test Account:{'\n'}
                Email: test@example.com{'\n'}
                Password: test123
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </Modal>

      <View style={styles.header}>
        <ThemedText type="title">Marketplace</ThemedText>
        {user && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Product search/filter UI */}
      <ProductList />

      {/* Product details modal */}
      <Modal visible={showProductModal} animationType="slide" onRequestClose={closeProductModal}>
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Product Details</ThemedText>
            <TouchableOpacity onPress={closeProductModal}>
              <IconSymbol name="xmark" size={24} color="#757575" />
            </TouchableOpacity>
          </View>
          {modalProduct && (
            <ScrollView style={styles.modalContent}>
              <ThemedText style={styles.inputLabel}>Name</ThemedText>
              <ThemedText style={styles.detailValue}>{modalProduct.name}</ThemedText>
              <ThemedText style={styles.inputLabel}>Category</ThemedText>
              <ThemedText style={styles.detailValue}>{modalProduct.category || 'N/A'}</ThemedText>
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <ThemedText style={styles.detailValue}>{modalProduct.description || 'N/A'}</ThemedText>
              {/* Add more product fields as needed */}
            </ScrollView>
          )}
        </ThemedView>
      </Modal>

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
              onPress={() => {
                console.log('Add Listing button pressed');
                handleAddListing().catch(error => {
                  console.error('Error in handleAddListing:', error);
                  Alert.alert('Error', 'Failed to add listing. Please try again.');
                });
              }}
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
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
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
