import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import AppBar from '../components/ui/AppBar';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { productsAPI, categoriesAPI, reviewsAPI } from '../services/api';
import { MapPin, Plus, Heart, Search as SearchIcon, Filter, Star, ChevronRight, ArrowRight, Clock, Truck, Leaf, Percent, ShoppingCart, ArrowLeft, MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserLocation } from '../hooks/useUserLocation';
import { cartAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const SubcategoriesScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buyNowPressedId, setBuyNowPressedId] = useState(null);
  const [updatingRatings, setUpdatingRatings] = useState(new Set());
  const [updatingAllProducts, setUpdatingAllProducts] = useState(false);

  const { cartItems, wishlistItems, updateCartItems, addToWishlist, removeFromWishlist } = useAppContext();

  // Fetch subcategories for the selected category
  useEffect(() => {
    fetchSubcategories();
  }, [category]);

  // Fetch products when subcategory changes
  useEffect(() => {
    fetchProducts();
  }, [selectedSubcategory]);

  // Refresh data when screen comes into focus (e.g., after returning from product details)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Screen focused - refreshing data');
      if (selectedSubcategory) {
        // First fetch basic product list
        fetchProducts().then(() => {
          // Then fetch updated details for all products to ensure ratings are current
          setTimeout(() => {
            fetchUpdatedProductDetails();
          }, 500); // Small delay to ensure basic fetch completes
        });
      }
    }, [selectedSubcategory])
  );

  const fetchSubcategories = async () => {
    try {
      setLoadingSubcategories(true);
      const res = await categoriesAPI.getCategories();
      const allCategories = res?.data?.data?.categories || res?.data?.data || [];
      
      // Filter subcategories that have the current category as parent
      const categorySubcategories = allCategories.filter(cat => 
        cat.parent === category._id || cat.parent === category.id
      );
      
      // If no direct subcategories, use the main category itself
      if (categorySubcategories.length === 0) {
        setSubcategories([category]);
        setSelectedSubcategory(category);
      } else {
        setSubcategories(categorySubcategories);
        setSelectedSubcategory(categorySubcategories[0]);
      }
    } catch (err) {
      console.error('Failed to fetch subcategories:', err?.response?.data || err.message);
      // Fallback to using the main category
      setSubcategories([category]);
      setSelectedSubcategory(category);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const fetchProducts = async () => {
    if (!selectedSubcategory) return;
    
    try {
      setLoadingProducts(true);
      console.log('🔄 Fetching products for category:', selectedSubcategory._id || selectedSubcategory.id);
      
      const params = {
        category: selectedSubcategory._id || selectedSubcategory.id,
        limit: 50
      };
      const res = await productsAPI.getProducts(params);
      const fetchedProducts = (res?.data?.data?.products || []).map(p => ({
        ...p,
        id: p._id,
        image: p.images?.[0]?.url || '',
        discount: p.offerPercentage,
        rating: p.averageRating,
        reviews: p.totalReviews,
        farmer: p.supplierId?.businessName || '',
        category: p.categoryId?.name || '',
        price: p.discountedPrice ?? p.price,
        originalPrice: p.price,
      }));
      
      console.log('📊 Fetched products with ratings:', fetchedProducts.map(p => ({
        id: p._id,
        rating: p.rating,
        reviews: p.reviews
      })));
      
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Failed to fetch products:', err?.response?.data || err.message);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const isInWishlist = (id) => wishlistItems.some((item) => item && item._id === id);
  const isInCart = (id) => cartItems.some((item) => item && item._id === id);

  const toggleWishlist = async (product) => {
    const productId = product._id;
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(product);
    }
  };

  const handleAddToCart = async (product) => {
    const productId = product._id || product.id;
    if (!isInCart(productId)) {
      try {
        const response = await cartAPI.addToCart({ productId, quantity: 1 });
        updateCartItems(response.data.data.cart.items);
        Alert.alert('Added to Cart', `${product.name} has been added to your cart`);
      } catch (error) {
        console.error('Failed to add to cart:', error);
        Alert.alert('Error', 'Could not add item to cart. Please try again.');
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    await Promise.all([fetchSubcategories(), fetchProducts()]);
    // Also fetch updated product details after basic refresh
    setTimeout(() => {
      fetchUpdatedProductDetails();
    }, 500);
    setRefreshing(false);
  };

  // Enhanced function to fetch updated product details for all products
  const fetchUpdatedProductDetails = async () => {
    if (!products.length) return;
    
    console.log('🔄 Fetching updated details for all products');
    setUpdatingAllProducts(true);
    
    try {
      // Fetch individual product details for all products to get updated ratings
      const updatedProducts = await Promise.all(
        products.map(async (product) => {
          try {
            const response = await productsAPI.getProductDetails(product._id || product.id);
            const updatedProduct = response.data.data.product;
            return {
              ...product,
              rating: updatedProduct.averageRating,
              reviews: updatedProduct.totalReviews,
            };
          } catch (error) {
            console.error(`Failed to fetch details for product ${product._id}:`, error);
            return product; // Return original product if fetch fails
          }
        })
      );
      
      console.log('📊 Updated all product ratings:', updatedProducts.map(p => ({
        id: p._id,
        rating: p.rating,
        reviews: p.reviews
      })));
      
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Failed to fetch updated product details:', error);
    } finally {
      setUpdatingAllProducts(false);
    }
  };

  // Update product rating and review count after a review is submitted
  const updateProductRating = async (productId) => {
    console.log('🔄 Updating product rating for:', productId);
    console.log('🔄 Current products count:', products.length);
    
    try {
      setUpdatingRatings(prev => new Set(prev).add(productId));
      
      // Fetch updated product data
      const response = await productsAPI.getProductDetails(productId);
      console.log('📊 Product details response:', response.data);
      const updatedProduct = response.data.data.product;
      console.log('📊 Updated product data:', {
        id: updatedProduct._id,
        averageRating: updatedProduct.averageRating,
        totalReviews: updatedProduct.totalReviews
      });
      
      // Update the product in the local state
      setProducts(prevProducts => {
        const updatedProducts = prevProducts.map(product => 
          product._id === productId || product.id === productId
            ? {
                ...product,
                rating: updatedProduct.averageRating,
                reviews: updatedProduct.totalReviews,
              }
            : product
        );
        
        const updatedProductInState = updatedProducts.find(p => p._id === productId || p.id === productId);
        console.log('✅ Updated product in state:', {
          id: updatedProductInState?._id,
          rating: updatedProductInState?.rating,
          reviews: updatedProductInState?.reviews
        });
        
        return updatedProducts;
      });
    } catch (error) {
      console.error('❌ Failed to update product rating:', error);
      console.error('❌ Error details:', error.response?.data);
      // Fallback: just refresh all products
      console.log('🔄 Falling back to refresh all products');
      await fetchProducts();
    } finally {
      setUpdatingRatings(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const renderSubcategoryItem = ({ item }) => {
    const isSelected = selectedSubcategory && (selectedSubcategory._id === item._id || selectedSubcategory.id === item.id);
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedSubcategory(item)}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
          borderLeftWidth: 3,
          borderLeftColor: isSelected ? '#10b981' : 'transparent',
          marginBottom: 4,
        }}
      >
        <View style={{
          alignItems: 'center',
        }}>
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 8,
            backgroundColor: '#f3f4f6',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Image
              source={
                item.image && typeof item.image === 'object' && item.image.url
                  ? { uri: item.image.url }
                  : item.image && typeof item.image === 'string' && item.image.trim() !== ''
                  ? { uri: item.image }
                  : { uri: 'https://via.placeholder.com/50' }
              }
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          
          {/* Tag/Subcategory Name */}
          <View style={{
            backgroundColor: isSelected ? '#10b981' : '#f3f4f6',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            minWidth: 60,
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: isSelected ? '600' : '500',
              color: isSelected ? 'white' : '#374151',
              textAlign: 'center',
            }}>
              {item.name}
            </Text>
          </View>
          
          {/* Description (if available) */}
          {item.description && (
            <Text style={{
              fontSize: 10,
              color: '#6b7280',
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 12,
              paddingHorizontal: 4,
            }} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item }) => {
    const productId = item._id || item.id;
    const inWishlist = isInWishlist(productId);
    const inCart = isInCart(productId);
    const isUpdatingRating = updatingRatings.has(productId);
    
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('🚀 Navigating to ProductDetails (main card) with callback for product:', item._id || item.id);
          navigation.navigate('ProductDetails', { 
            product: item,
            onReviewSubmitted: () => {
              console.log('📞 Callback triggered (main card) for product:', item._id || item.id);
              console.log('📞 About to call updateProductRating...');
              updateProductRating(item._id || item.id);
              console.log('📞 updateProductRating called successfully');
            }
          });
        }}
        activeOpacity={0.9}
        style={{ width: '48%', marginBottom: 16 }}
      >
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
          borderWidth: 1,
          borderColor: '#f3f4f6',
          height: 250, // Fixed height for consistent card size
        }}>
          <View style={{ position: 'relative' }}>
            <Image 
              source={{ uri: item.image }} 
              style={{ width: '100%', height: 100 }}
              resizeMode="cover"
            />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)' }} />
            {item.discount && (
              <View style={{
                position: 'absolute',
                top: 8,
                left: 8,
                backgroundColor: '#ef4444',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                  {Number(item.discount).toFixed(0)}% OFF
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.9)',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 1
              }}
              onPress={(e) => {
                e.stopPropagation();
                toggleWishlist(item);
              }}
            >
              <Heart
                width={14}
                height={14}
                color={inWishlist ? '#ef4444' : '#9ca3af'}
                fill={inWishlist ? '#ef4444' : 'none'}
              />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#1f2937', marginBottom: 3, lineHeight: 14 }}>
              {item.name}
            </Text>
            <Text style={{ fontSize: 10, color: '#10b981', fontWeight: '500', marginBottom: 4 }}>
              by {item.farmer}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#10b981' }}>
                ₹{item.price}
              </Text>
              {item.originalPrice !== item.price && (
                <Text style={{ fontSize: 10, color: '#9ca3af', textDecorationLine: 'line-through' }}>
                  ₹{item.originalPrice}
                </Text>
              )}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fef3c7',
                paddingHorizontal: 4,
                paddingVertical: 1,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#fde68a'
              }}>
                <Star width={6} height={6} fill="#facc15" color="#facc15" />
                {isUpdatingRating ? (
                  <ActivityIndicator size={8} color="#92400e" style={{ marginLeft: 1 }} />
                ) : (
                  <Text style={{ fontSize: 9, color: '#92400e', fontWeight: '600', marginLeft: 1 }}>
                    {item.rating || 0}
                  </Text>
                )}
              </View>
            </View>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 6 }}>
              {isUpdatingRating ? 'Updating...' : `${item.reviews || 0} reviews`}
            </Text>
            <TouchableOpacity
              style={{
                overflow: 'hidden',
                borderRadius: 8,
                marginBottom: 4
              }}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              disabled={inCart}
            >
              {inCart ? (
                <View style={{
                  paddingVertical: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f3f4f6',
                  borderRadius: 8
                }}>
                  <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 11 }}>
                    Added to Cart
                  </Text>
                </View>
              ) : (
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={{
                    paddingVertical: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                  }}
                >
                  <ShoppingCart width={10} height={10} color="#fff" />
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 11, marginLeft: 3 }}>
                    Add to Cart
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: buyNowPressedId === productId ? '#10b981' : '#f3f4f6',
                  paddingVertical: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  shadowColor: '#d1d5db',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={async (e) => {
                  e.stopPropagation();
                  setBuyNowPressedId(productId);
                  setTimeout(() => {
                    setBuyNowPressedId(null);
                    // Navigate to checkout with the product
                    navigation.navigate('Checkout', {
                      items: [{ ...item, quantity: 1 }]
                    });
                  }, 150);
                }}
              >
                <Text style={{ 
                  color: buyNowPressedId === productId ? 'white' : '#1f2937', 
                  fontWeight: '600', 
                  fontSize: 11 
                }}>
                  Buy Now
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#f3f4f6',
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  shadowColor: '#d1d5db',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  console.log('🚀 Navigating to ProductDetails with callback for product:', item._id || item.id);
                  navigation.navigate('ProductDetails', { 
                    product: item,
                    onReviewSubmitted: () => {
                      console.log('📞 Callback triggered for product:', item._id || item.id);
                      console.log('📞 About to call updateProductRating...');
                      updateProductRating(item._id || item.id);
                      console.log('📞 updateProductRating called successfully');
                    }
                  });
                }}
              >
                <MessageCircle width={12} height={12} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f3f4f6',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <ArrowLeft width={20} height={20} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
              {category.name}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              {subcategories.length} subcategories
            </Text>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        }}>
          <SearchIcon width={20} height={20} color="#6b7280" />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#94a3b8"
            style={{ flex: 1, marginLeft: 12, color: '#1f2937', fontSize: 14 }}
          />
          <View style={{ width: 1, height: 20, backgroundColor: '#e5e7eb', marginHorizontal: 12 }} />
          <TouchableOpacity style={{ padding: 4 }}>
            <Filter width={18} height={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar - Subcategories */}
        <View style={{
          width: width * 0.30,
          backgroundColor: 'white',
          borderRightWidth: 1,
          borderRightColor: '#e5e7eb'
        }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#059669"]} />
            }
          >
            <View style={{ paddingVertical: 8 }}>
              {loadingSubcategories ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                    Loading categories...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={subcategories}
                  renderItem={renderSubcategoryItem}
                  keyExtractor={(item) => (item._id || item.id).toString()}
                  scrollEnabled={false}
                />
              )}
            </View>
          </ScrollView>
        </View>

        {/* Main Content - Products */}
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#059669"]} />
            }
          >
            <View style={{ padding: 16 }}>
              {selectedSubcategory && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>
                    {selectedSubcategory.name}
                  </Text>
                  {selectedSubcategory.description && (
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                      {selectedSubcategory.description}
                    </Text>
                  )}
                </View>
              )}

              {loadingProducts ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>
                    Loading products...
                  </Text>
                </View>
              ) : updatingAllProducts ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                    Updating product ratings...
                  </Text>
                </View>
              ) : products.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
                    No products found in this category
                  </Text>
                  <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
                    Try selecting a different subcategory
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={products}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => (item._id || item.id).toString()}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default SubcategoriesScreen; 