import React, { useState, useEffect, useRef } from 'react';
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
const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const scrollViewRef = useRef(null);
  const [featuredProductsY, setFeaturedProductsY] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ===== Products fetched from backend =====
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await productsAPI.getProducts();
        setFetchedProducts(
          (res?.data?.data?.products || []).map(p => ({
            ...p,
            id: p._id, // Ensure we have both id and _id for compatibility
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

  // Fetch categories dynamically
  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesAPI.getCategories();
        // Support both array and object response
        const cats = res?.data?.data?.categories || res?.data?.data || [];
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err?.response?.data || err.message);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);
  const { cartItems, wishlistItems, updateCartItems, updateWishlistItems } = useAppContext();


  // Decide which product list to use: fetched from API, otherwise fallback to dummy data
  const allProducts = fetchedProducts.length ? fetchedProducts : featuredProducts;

  // Filter products by selected category ID
  const filteredProducts = selectedCategory
    ? allProducts.filter((item) => {
        // item.categoryId may be an object or string, mapped as 'categoryId' or 'category'
        // Our mapping sets 'category' to category name, but let's use categoryId for accuracy
        // Support both backend and fallback data
        const catId = item.categoryId?._id || item.categoryId || item.category_id || item.category;
        return catId === selectedCategory;
      })
    : allProducts;

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
    {
      id: 2,
      title: '20% OFF',
      subtitle: 'Fresh Tomatoes',
      description: 'Get premium quality fresh produce at amazing prices',
      icon: <Truck width={24} height={24} color="#fff" />,
      tag: 'Free Shipping',
      gradient: 'bg-gradient-to-r from-blue-500 to-blue-700',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&h=400&fit=crop',
    },
    {
      id: 3,
      title: '100% Organic',
      subtitle: 'Certified Fresh Vegetables',
      description: 'Pesticide-free organic produce grown with love and care',
      icon: <Leaf width={24} height={24} color="#fff" />,
      tag: 'Certified',
      gradient: 'bg-gradient-to-r from-emerald-500 to-emerald-700',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=400&fit=crop',
    },
    {
      id: 4,
      title: 'Flash Sale',
      subtitle: 'Up to 40% OFF',
      description: 'Limited time flash sale on premium fruits and vegetables',
      icon: <Clock width={24} height={24} color="#fff" />,
      tag: 'Ends Soon',
      gradient: 'bg-gradient-to-r from-orange-500 to-orange-700',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=400&fit=crop',
    },
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
    {
      title: 'Fresh Deals',
      subtitle: 'Daily specials',
      icon: Leaf,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-800',
      subtitleColor: 'text-blue-600'
    },
    {
      title: 'Bulk Orders',
      subtitle: 'Best prices',
      icon: ShoppingCart,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      iconBg: 'bg-amber-500',
      textColor: 'text-amber-800',
      subtitleColor: 'text-amber-600'
    },
    {
      title: 'Farm Visit',
      subtitle: 'See your produce',
      icon: MapPin,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-800',
      subtitleColor: 'text-emerald-600'
    },
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
    {
      id: '2',
      _id: '2',
      name: 'Alphonso Mangoes',
      image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&h=800&fit=crop',
      discount: 10,
      rating: 4.8,
      reviews: 215,
      farmer: 'Mango King Orchards',
      category: 'Fruits',
      price: 120,
      originalPrice: 135,
      categoryId: 'fruits',
      description: 'Premium Alphonso mangoes from Ratnagiri',
      stock: 30,
      supplierId: {
        businessName: 'Mango King Orchards'
      }
    },
    {
      id: '3',
      _id: '3',
      name: 'Basmati Rice',
      image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=800&h=800&fit=crop',
      discount: 5,
      rating: 4.3,
      reviews: 89,
      farmer: 'Golden Grains',
      category: 'Grains',
      price: 95,
      originalPrice: 100,
      categoryId: 'grains',
      description: 'Premium quality basmati rice',
      stock: 100,
      supplierId: {
        businessName: 'Golden Grains'
      }
    },
    {
      id: '4',
      _id: '4',
      name: 'Fresh Spinach',
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&h=800&fit=crop',
      discount: 20,
      rating: 4.6,
      reviews: 156,
      farmer: 'Leafy Greens Co.',
      category: 'Vegetables',
      price: 30,
      originalPrice: 38,
      categoryId: 'vegetables',
      description: 'Freshly harvested organic spinach',
      stock: 40,
      supplierId: {
        businessName: 'Leafy Greens Co.'
      }
    },
    {
      id: '5',
      _id: '5',
      name: 'Red Apples',
      image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&h=800&fit=crop',
      discount: 0,
      rating: 4.7,
      reviews: 189,
      farmer: 'Apple Valley',
      category: 'Fruits',
      price: 80,
      originalPrice: 80,
      categoryId: 'fruits',
      description: 'Juicy red apples from Kashmir',
      stock: 60,
      supplierId: {
        businessName: 'Apple Valley'
      }
    },
    {
      id: '6',
      _id: '6',
      name: 'Organic Potatoes',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&h=800&fit=crop',
      discount: 12,
      rating: 4.2,
      reviews: 102,
      farmer: 'Root Farms',
      category: 'Vegetables',
      price: 28,
      originalPrice: 32,
      categoryId: 'vegetables',
      description: 'Organic potatoes grown in nutrient-rich soil',
      stock: 75,
      supplierId: {
        businessName: 'Root Farms'
      }
    },
    {
      id: '7',
      _id: '7',
      name: 'Bananas (Bunch)',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&h=800&fit=crop',
      discount: 8,
      rating: 4.4,
      reviews: 143,
      farmer: 'Tropical Fruits',
      category: 'Fruits',
      price: 40,
      originalPrice: 44,
      categoryId: 'fruits',
      description: 'Fresh bananas from southern plantations',
      stock: 50,
      supplierId: {
        businessName: 'Tropical Fruits'
      }
    },
    {
      id: '8',
      _id: '8',
      name: 'Whole Wheat Flour',
      image: 'https://images.unsplash.com/photo-1607247131271-0b74e8ba9f4d?w=800&h=800&fit=crop',
      discount: 15,
      rating: 4.1,
      reviews: 76,
      farmer: 'Healthy Grains',
      category: 'Grains',
      price: 65,
      originalPrice: 77,
      categoryId: 'grains',
      description: '100% whole wheat flour stone ground',
      stock: 45,
      supplierId: {
        businessName: 'Healthy Grains'
      }
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const isInWishlist = (id) => wishlistItems.some((item) => item._id === id || item.id === id);
  const isInCart = (id) => cartItems.some((item) => item._id === id || item.id === id);

  const toggleWishlist = (product) => {
    const productId = product._id || product.id;
    const newWishlist = isInWishlist(productId)
      ? wishlistItems.filter(item => (item._id !== productId && item.id !== productId))
      : [...wishlistItems, product];
    updateWishlistItems(newWishlist);
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

  // Helper to scroll to Featured Products section
  const scrollToFeaturedProducts = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: featuredProductsY, animated: true });
    }
  };

  const CategoryItem = ({ item }) => {
    const isSelected = selectedCategory === (item._id || item.id);
    return (
      <View style={{ width: width * 0.23, alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={{ width: '100%' }}
          onPress={() => {
            setSelectedCategory(item._id || item.id);
            setTimeout(scrollToFeaturedProducts, 100); // ensure filter applies before scroll
          }}
        >
          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 16, 
            padding: 8, 
            marginBottom: 8, 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.1, 
            shadowRadius: 4, 
            elevation: 2, 
            borderWidth: isSelected ? 2 : 1, 
            borderColor: isSelected ? '#10b981' : '#f3f4f6' 
          }}>
            <View style={{ width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' }}>
              <Image
                source={
                  item.image && typeof item.image === 'string' && item.image.trim() !== ''
                    ? { uri: item.image }
                    : { uri: 'https://via.placeholder.com/100' }
                }
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          </View>
          <Text style={{ 
            fontSize: 14, 
            color: isSelected ? '#10b981' : '#1f2937', 
            fontWeight: '600', 
            textAlign: 'center' 
          }}>
            {item.name}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFarmerItem = ({ item }) => (
    <View className="bg-white rounded-3xl p-5 w-44 items-center shadow-lg border border-gray-100">
      <View className="relative mb-3">
        <Image source={{ uri: item.image }} className="w-20 h-20 rounded-full border-4 border-gray-100" />
        {item.verified && (
          <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-green-500 justify-center items-center border-2 border-white">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}
      </View>
      <Text className="text-sm font-bold text-gray-800 mb-0.5">{item.name}</Text>
      <Text className="text-xs text-gray-500 mb-0.5">{item.farm}</Text>
      <Text className="text-xs text-green-500 font-medium mb-0.5">{item.location}</Text>
      <Text className="text-xs text-blue-500 mt-1">{item.products} products</Text>
      <View className="flex-row items-center bg-amber-50 rounded-xl px-3 py-2 border border-amber-200 mt-3">
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
        onPress={() => {
          console.log(item);
          navigation.navigate('ProductDetails', { product: item });
        }}
        activeOpacity={0.9}
      >
        <View className="flex-1 bg-white rounded-3xl overflow-hidden m-1 min-w-[48%] shadow-lg border border-gray-100">
          <View className="relative">
            <Image source={{ uri: item.image }} className="w-full h-32" />
            <View className="absolute inset-0 bg-black/20" />
            {item.discount && (
              <View className="absolute top-3 left-3 bg-red-500 px-2 py-1 rounded-lg shadow-md">
                <Text className="text-white text-xs font-bold">{item.discount}% OFF</Text>
              </View>
            )}
            <TouchableOpacity
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 justify-center items-center shadow-sm"
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
          <View className="p-4">
            <Text className="text-sm font-bold text-gray-800 mb-1">{item.name}</Text>
            <Text className="text-xs text-green-500 font-medium mb-2">by {item.farmer}</Text>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-green-500">₹{item.price}</Text>
              <Text className="text-xs text-gray-400 line-through">₹{item.originalPrice}</Text>
              <View className="flex-row items-center bg-amber-50 rounded-lg px-2 py-1 border border-amber-200">
                <Star width={10} height={10} fill="#facc15" color="#facc15" />
                <Text className="text-xs text-amber-800 ml-1">{item.rating}</Text>
              </View>
            </View>
            <Text className="text-xs text-gray-500 mb-3">{item.reviews} reviews</Text>
            <TouchableOpacity
              className="overflow-hidden rounded-xl"
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              disabled={inCart}
              style={{
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              {inCart ? (
                <View className="py-2.5 flex-row items-center justify-center bg-gray-100 rounded-xl">
                  <Text className="text-gray-500 font-semibold text-sm">Added to Cart</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={{
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                  }}
                >
                  <ShoppingCart width={14} height={14} color="#fff" />
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 6 }}>Add to Cart</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickAction = ({ item }) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity className={`flex-1 flex-row items-center rounded-xl p-4 border-2 m-1 min-w-[48%] shadow-md ${item.bgColor} ${item.borderColor}`}>
        <View className={`w-12 h-12 rounded-xl justify-center items-center mr-4 ${item.iconBg}`}>
          <Icon width={20} height={20} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className={`text-sm font-semibold ${item.textColor}`}>{item.title}</Text>
          <Text className={`text-xs ${item.subtitleColor}`}>{item.subtitle}</Text>
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
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <AppBar />

      {/* Search Bar */}
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <SearchIcon width={22} height={22} color="#6b7280" />
          <TextInput
            placeholder="Search fresh produce, grains, organic foods..."
            placeholderTextColor="#94a3b8"
            style={{ flex: 1, marginLeft: 12, color: '#1f2937', fontSize: 14 }}
          />
          <View style={{ width: 1, height: 24, backgroundColor: '#e5e7eb', marginHorizontal: 12 }} />
          <TouchableOpacity style={{ padding: 8 }}>
            <Filter width={20} height={20} color="#94a3b8" />
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
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Shop by Category</Text>
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={{ 
                color: selectedCategory ? '#ef4444' : 'green', 
                fontWeight: '600', 
                fontSize: 14 
              }}>
                {selectedCategory ? 'Clear Filter' : 'View All'}
              </Text>
            </TouchableOpacity>
          </View>
          {loadingCategories ? (
            <Text>Loading categories...</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {categories.map((item, index) => (
                <CategoryItem key={item._id || item.id || index} item={item} />
              ))}
            </View>
          )}
        </View>

        {/* Banner */}
        <View style={{ height: 256, borderRadius: 24, overflow: 'hidden', marginHorizontal: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }}>
          <Image
            source={{ uri: banners[currentBanner].image }}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
          />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{banners[currentBanner].tag}</Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                {banners[currentBanner].icon}
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>{banners[currentBanner].title}</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 8 }}>{banners[currentBanner].subtitle}</Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.95)' }}>{banners[currentBanner].description}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                onPress={scrollToFeaturedProducts}
              >
                <Text style={{ color: '#1f2937', fontWeight: '600', marginRight: 8 }}>Shop Now</Text>
                <ArrowRight width={18} height={18} color="#1f2937" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                  <Star width={16} height={16} fill="#facc15" color="#facc15" />
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '500', marginLeft: 4 }}>4.8 Rating</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 8 }}>
            {banners.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentBanner(index)}
                style={{ width: index === currentBanner ? 32 : 8, height: 8, borderRadius: 4, backgroundColor: index === currentBanner ? '#10b981' : '#d1d5db' }}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
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
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Popular Farmers</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: 'green', fontWeight: '600', fontSize: 14 }}>View All</Text>
              <ChevronRight width={16} height={16} color="green" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={farmers}
            renderItem={renderFarmerItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingRight: 16 }}
          />
        </View>

        {/* Featured Products */}
        <View
          onLayout={event => setFeaturedProductsY(event.nativeEvent.layout.y)}
          style={{ paddingHorizontal: 16, marginBottom: 24 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>Featured Products</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: 'green', fontWeight: '600', fontSize: 14 }}>View All</Text>
              <ChevronRight width={16} height={16} color="green" />
            </TouchableOpacity>
          </View>
          
          {selectedCategory && (
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={{
                alignSelf: 'flex-end',
                marginBottom: 12,
                backgroundColor: '#fef2f2',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: '#dc2626', fontWeight: '600', fontSize: 12 }}>
                Clear Filter
              </Text>
            </TouchableOpacity>
          )}
          
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