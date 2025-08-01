import React, { useState, useEffect, useRef, image } from 'react';
import { useAppContext } from '../context/AppContext';
import AppBar from '../components/ui/AppBar';
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
  RefreshControl
} from 'react-native';
import { productsAPI, categoriesAPI } from '../services/api';
import { MapPin, Plus, Heart, Search as SearchIcon, Filter, Star, Bell, User, ChevronRight, ArrowRight, Clock, Truck, Leaf, Percent, ShoppingCart} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { farmers } from '../components/ui/farmers';
import { useUserLocation } from '../hooks/useUserLocation';
import { cartAPI } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const scrollViewRef = useRef(null);
  const [featuredProductsY, setFeaturedProductsY] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [buyNowPressedId, setBuyNowPressedId] = useState(null);

  // Get screen dimensions
  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;

  // Responsive sizing
  const responsiveValue = (small, medium, large) => {
    if (isSmallScreen) return small;
    if (isMediumScreen) return medium;
    return large;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await productsAPI.getProducts();
        setFetchedProducts(
          (res?.data?.data?.products || []).map(p => ({
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
          }))
        );
      } catch (err) {
        console.error('Failed to fetch products:', err?.response?.data || err.message);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  // Fetch categories
  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesAPI.getCategories({ parent: 'null' });
        const cats = res?.data?.data?.categories || res?.data?.data || [];
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err?.response?.data || err.message);
        try {
          const fallbackRes = await categoriesAPI.getCategories();
          const allCats = fallbackRes?.data?.data?.categories || fallbackRes?.data?.data || [];
          const parentCategories = allCats.filter(cat => !cat.parent);
          setCategories(parentCategories);
        } catch (fallbackErr) {
          console.error('Fallback category fetch also failed:', fallbackErr);
        }
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  const { cartItems, wishlistItems, updateCartItems, addToWishlist, removeFromWishlist } = useAppContext();
  const allProducts = fetchedProducts.length ? fetchedProducts : featuredProducts;
  const filteredProducts = allProducts;

  const banners = [
    {
      id: 1,
      title: 'Free Delivery',
      subtitle: 'Free on order ₹500',
      description: 'Limited time offer - Direct from farm to your doorstep',
      icon: <Percent width={24} height={24} color="#fff" />,
      tag: 'Limited Time',
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-700',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXoXvo9LcdoOtIf2eedVwHvi2i01qVBIMrjQ&s',
    },
    // ... other banners
  ];

  const quickActions = [
    {
      title: 'Quick Order',
      subtitle: '30 min delivery',
      icon: Truck,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
      iconBg: 'bg-green-500',
      textColor: 'text-green-800',
      subtitleColor: 'text-green-600'
    },
    // ... other quick actions
  ];

  const featuredProducts = [
    {
      id: '1',
      _id: '1',
      name: 'Organic Tomatoes',
      image: 'https://images.unsplash.com/photo-1594282402317-6af14d6ab718?w=800&h=800&fit=crop',
      discount: 15,
      rating: 4.5,
      reviews: 128,
      farmer: 'Green Valley Farms',
      category: 'Vegetables',
      price: 45,
      originalPrice: 53,
      categoryId: 'vegetables',
      description: 'Fresh organic tomatoes grown without pesticides',
      stock: 50,
      supplierId: {
        businessName: 'Green Valley Farms'
      }
    },
    // ... other products
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const scrollToFeaturedProducts = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: featuredProductsY, animated: true });
    }
  };

  const CategoryItem = ({ item }) => {
    const categoryItemSize = responsiveValue(width * 0.28, width * 0.23, width * 0.18);
    
    return (
      <View className={`items-center mb-4`} style={{ width: categoryItemSize }}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Subcategories', { category: item })}
        >
          <View className="bg-white rounded-2xl p-2 mb-2 shadow-sm border border-gray-100">
            <View className="w-full aspect-square rounded-xl overflow-hidden">
              <Image
                source={
                  item.image && typeof item.image === 'object' && item.image.url
                    ? { uri: item.image.url }
                    : item.image && typeof item.image === 'string' && item.image.trim() !== ''
                    ? { uri: item.image }
                    : { uri: 'https://via.placeholder.com/100' }
                }
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>
          <Text className="text-sm font-semibold text-gray-800 text-center" numberOfLines={1}>
            {item.name}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFarmerItem = ({ item }) => (
    <View className={`bg-white rounded-3xl p-4 items-center shadow-md border border-gray-100 mr-4`} 
      style={{ width: responsiveValue(140, 160, 180) }}>
      <View className="relative mb-3">
        <Image source={{ uri: item.image }} className="w-16 h-16 rounded-full border-4 border-gray-100" />
        {item.verified && (
          <View className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 justify-center items-center border-2 border-white">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}
      </View>
      <Text className="text-sm font-bold text-gray-800 mb-0.5 text-center" numberOfLines={1}>{item.name}</Text>
      <Text className="text-xs text-gray-500 mb-0.5 text-center" numberOfLines={1}>{item.farm}</Text>
      <Text className="text-xs text-green-500 font-medium mb-0.5 text-center" numberOfLines={1}>{item.location}</Text>
      <View className="flex-row items-center bg-amber-50 rounded-lg px-2 py-1 border border-amber-200 mt-2">
        <Star width={12} height={12} fill="#facc15" color="#facc15" />
        <Text className="text-xs font-bold text-amber-800 ml-1">{item.rating}</Text>
      </View>
    </View>
  );

  const renderProductItem = ({ item }) => {
    const productId = item._id || item.id;
    const inWishlist = isInWishlist(productId);
    const inCart = isInCart(productId);
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
        activeOpacity={0.9}
        className={`mb-2 mx-1 ${isLargeScreen ? 'w-[48%]' : 'w-[47%]'}`}
      >
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <View className="relative">
            <Image source={{ uri: item.image }} className="w-full" style={{ height: responsiveValue(120, 140, 160) }} />
            <View className="absolute inset-0 bg-black/20" />
            {item.discount && (
              <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-lg shadow-md">
                <Text className="text-white text-xs font-bold">{Number(item.discount).toFixed(2)}% OFF</Text>
              </View>
            )}
            <TouchableOpacity
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 justify-center items-center shadow-sm"
              onPress={(e) => {
                e.stopPropagation();
                toggleWishlist(item);
              }}
            >
              <Heart
                width={16}
                height={16}
                color={inWishlist ? '#ef4444' : '#9ca3af'}
                fill={inWishlist ? '#ef4444' : 'none'}
              />
            </TouchableOpacity>
          </View>
          <View className="p-3">
            <Text className="text-sm font-bold text-gray-800 mb-1" numberOfLines={1}>{item.name}</Text>
            <Text className="text-xs text-green-500 font-medium mb-1" numberOfLines={1}>by {item.farmer}</Text>
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-base font-bold text-green-500">₹{item.price}</Text>
              <Text className="text-xs text-gray-400 line-through">₹{item.originalPrice}</Text>
              <View className="flex-row items-center bg-amber-50 rounded-lg px-1.5 py-1 border border-amber-200">
                <Star width={10} height={10} fill="#facc15" color="#facc15" />
                <Text className="text-xs text-amber-800 ml-1">{item.rating}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="overflow-hidden rounded-lg mt-2"
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              disabled={inCart}
            >
              {inCart ? (
                <View className="py-2 flex-row items-center justify-center bg-gray-100 rounded-lg">
                  <Text className="text-gray-500 font-semibold text-xs">Added</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  className="py-2 flex-row items-center justify-center rounded-lg"
                >
                  <ShoppingCart width={14} height={14} color="#fff" />
                  <Text className="text-white font-semibold text-sm ml-1">Add</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="overflow-hidden rounded-lg mt-1.5 py-2 flex-row items-center justify-center"
              onPress={async (e) => {
                e.stopPropagation();
                setBuyNowPressedId(productId);
                setTimeout(() => {
                  setBuyNowPressedId(null);
                  navigation.navigate('Checkout', {
                    items: [{ ...item, quantity: 1 }]
                  });
                }, 150);
              }}
              style={{
                backgroundColor: buyNowPressedId === productId ? '#10b981' : '#f3f4f6',
              }}
            >
              <Text className={`font-semibold text-sm ${buyNowPressedId === productId ? 'text-white' : 'text-gray-800'}`}>
                Buy Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickAction = ({ item }) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity className={`flex-1 flex-row items-center rounded-xl p-3 border-2 m-1 min-w-[48%] shadow-sm ${item.bgColor} ${item.borderColor}`}>
        <View className={`w-10 h-10 rounded-lg justify-center items-center mr-3 ${item.iconBg}`}>
          <Icon width={18} height={18} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className={`text-sm font-semibold ${item.textColor}`} numberOfLines={1}>{item.title}</Text>
          <Text className={`text-xs ${item.subtitleColor}`} numberOfLines={1}>{item.subtitle}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const fetchAllData = async () => {
    setLoadingProducts(true);
    setLoadingCategories(true);
    try {
      await Promise.all([
        productsAPI.getProducts(),
        categoriesAPI.getCategories(),
      ]);
    } catch (err) {
      console.error('Failed to fetch data:', err?.response?.data || err.message);
    } finally {
      setLoadingProducts(false);
      setLoadingCategories(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <AppBar />

      {/* Search Bar */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200">
          <SearchIcon width={20} height={20} color="#6b7280" />
          <TextInput
            placeholder="Search fresh produce, grains, organic foods..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-3 text-gray-800 text-sm"
          />
          <View className="w-px h-6 bg-gray-200 mx-3" />
          <TouchableOpacity className="p-1">
            <Filter width={18} height={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#059669"]} />
        }
      >
        {/* Categories */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Shop by Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
              <Text className="text-green-600 font-semibold text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          {loadingCategories ? (
            <Text>Loading categories...</Text>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {categories.slice(0, 6).map((item, index) => (
                <CategoryItem key={item._id || item.id || index} item={item} />
              ))}
            </View>
          )}
        </View>

        {/* Banner */}
        <View className="h-64 rounded-2xl overflow-hidden mx-4 mb-6 shadow-md">
          <Image
            source={{ uri: banners[currentBanner].image }}
            className="w-full h-full absolute"
          />
          <View className="absolute inset-0 bg-black/40" />
          <View className="flex-1 p-5 justify-between">
            <View className="flex-row justify-between items-start">
              <View className="bg-white/20 rounded-lg px-3 py-2 border border-white/30">
                <Text className="text-white text-xs font-bold">{banners[currentBanner].tag}</Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-white/20 justify-center items-center">
                {banners[currentBanner].icon}
              </View>
            </View>
            <View className="mb-4">
              <Text className="text-2xl font-bold text-white mb-1">{banners[currentBanner].title}</Text>
              <Text className="text-lg font-semibold text-white mb-1">{banners[currentBanner].subtitle}</Text>
              <Text className="text-sm text-white/95">{banners[currentBanner].description}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                className="flex-row items-center bg-white px-5 py-2 rounded-lg"
                onPress={scrollToFeaturedProducts}
              >
                <Text className="text-gray-800 font-semibold mr-2">Shop Now</Text>
                <ArrowRight width={16} height={16} color="#1f2937" />
              </TouchableOpacity>
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center bg-white/20 rounded-lg px-3 py-1.5 border border-white/30">
                  <Star width={14} height={14} fill="#facc15" color="#facc15" />
                  <Text className="text-white text-xs font-medium ml-1">4.8 Rating</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="flex-row justify-center items-center mt-4 gap-2">
            {banners.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentBanner(index)}
                className={`h-1.5 rounded-full ${index === currentBanner ? 'w-6 bg-green-500' : 'w-2 bg-gray-300'}`}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-6">
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 8 }}
          />
        </View>

        {/* Farmers */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Popular Farmers</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-green-600 font-semibold text-sm mr-1">View All</Text>
              <ChevronRight width={14} height={14} color="#16a34a" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={farmers}
            renderItem={renderFarmerItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          />
        </View>

        {/* Featured Products */}
        <View
          onLayout={event => setFeaturedProductsY(event.nativeEvent.layout.y)}
          className="px-4 mb-6"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Featured Products</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-green-600 font-semibold text-sm mr-1">View All</Text>
              <ChevronRight width={14} height={14} color="#16a34a" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => (item._id || item.id).toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 8 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;