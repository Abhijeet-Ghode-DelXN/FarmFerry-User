import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native';
import {
  Minus,
  Plus,
  Heart,
  ChevronRight,
  Tag,
  MapPin,
  Clock,
  Star,
  Trash2,
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { cartAPI } from '../services/api';

export default function CartScreen({ navigation }) {
  const {
    cartItems,
    updateCartItems,
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
  } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      updateCartItems(response.data.data.cart.items);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCart();
  };

  const handleUpdateQuantity = async (cartItemId, quantity) => {
    try {
      const response = await cartAPI.updateCartItem(cartItemId, quantity);
      updateCartItems(response.data.data.cart.items);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const increaseQty = (item) => {
    handleUpdateQuantity(item._id, item.quantity + 1);
  };

  const decreaseQty = (item) => {
    if (item.quantity > 1) {
      handleUpdateQuantity(item._id, item.quantity - 1);
    } else {
      removeFromCart(item._id);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const response = await cartAPI.removeCartItem(cartItemId);
      updateCartItems(response.data.data.cart.items);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const toggleWishlist = (product) => {
    if (!product || !product.name) return;
    const productId = product._id;
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      Alert.alert('Removed from Wishlist', `${product.name} has been removed from your wishlist`);
    } else {
      addToWishlist(product);
      Alert.alert('Added to Wishlist', `${product.name} has been added to your wishlist`);
    }
  };

  const isInWishlist = (id) => {
    if (!id) {
      console.warn('isInWishlist called with invalid id:', id);
      return false;
    }
    return wishlistItems.some((item) => item && item._id === id);
  };

  const moveToWishlist = (product) => {
    if (!product || !product.name) return;
    const productId = product._id;
    if (!isInWishlist(productId)) {
      addToWishlist(product);
    }
    removeFromCart(product._id);
    Alert.alert('Moved to Wishlist', `${product.name} has been moved to your wishlist`);
  };

  const handlePromoCode = () => navigation.navigate('PromoCode');
  const handleChangeAddress = () => navigation.navigate('SetDefaultAddress');

  // GST rate (5%)
  const GST_RATE = 0.05;

  // Calculation helpers
  const getSubtotal = () =>
    safeCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getTotalDiscount = () =>
    safeCartItems.reduce((sum, item) => {
      if (item.originalPrice) {
        return sum + (item.originalPrice - item.price) * item.quantity;
      }
      return sum;
    }, 0);
  const getTotalGST = () =>
    safeCartItems.reduce((sum, item) => sum + (item.price * GST_RATE) * item.quantity, 0);
  const getShipping = () => 4.0;
  const getGrandTotal = () => getSubtotal() + getTotalGST() + getShipping();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const handleProceedToCheckout = () => {
    if (!Array.isArray(safeCartItems) || safeCartItems.length === 0) {
      Alert.alert('Cart is empty');
      return;
    }
    navigation.navigate('Checkout', {
      subtotal: getSubtotal(),
      shipping: getShipping(),
      total: getGrandTotal(),
      savings: getTotalDiscount(),
      items: safeCartItems
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar backgroundColor="white" barStyle="dark-content" />

      {/* AppBar with back arrow */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={responsiveValue(20, 24, 24)} color="black" />
        </TouchableOpacity>
        <Text className={`${responsiveValue('text-base', 'text-lg', 'text-lg')} text-black font-medium`}>Cart</Text>
      </View>

      {/* Deliver to block */}
      <View className="bg-white px-4 py-3 border-b border-green-100">
        <TouchableOpacity className="flex-row items-center" onPress={handleChangeAddress}>
          <MapPin size={responsiveValue(14, 16, 16)} color="#059669" />
          <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-black ml-2`}>Deliver to </Text>
          <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} font-semibold text-black`}>Selected Location</Text>
          <ChevronRight size={responsiveValue(12, 14, 14)} color="#059669" className="ml-1" />
        </TouchableOpacity>
        <Text className={`${responsiveValue('text-xs', 'text-xs', 'text-sm')} text-gray-500 mt-1 ml-6`}>Mokarwadi, Pune - 411046</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#059669"]} />
        }
      >
        {(safeCartItems?.length ?? 0) === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
              <Text className="text-green-400 text-2xl">🛒</Text>
            </View>
            <Text className="text-green-600 text-lg">Your cart is empty</Text>
            <Text className="text-green-500 text-sm mt-2">Add some fresh items to get started!</Text>
          </View>
        ) : (
          <>
            {/* Delivery Summary */}
            <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-green-100">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className={`${responsiveValue('text-base', 'text-lg', 'text-lg')} font-semibold text-grey-800`}>Get it in 10 mins</Text>
                  <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-green-600`}>
                    {(safeCartItems?.length ?? 0)} Product{(safeCartItems?.length ?? 0) > 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-black-700 font-medium`}>Express</Text>
                </View>
              </View>
            </View>

            {/* Cart Items */}
            <View className="px-4 pt-4">
              {safeCartItems.map((item, idx) => {
                if (!item) return null;
                const discount = item.originalPrice ? (item.originalPrice - item.price) : 0;
                const gst = item.price * GST_RATE;
                const finalPrice = item.price + gst;
                const imageSize = responsiveValue(80, 96, 100);
                
                return (
                  <View
                    key={item.id}
                    className="bg-white rounded-2xl mb-4 p-4 shadow-sm border border-gray-200"
                    style={{
                      shadowColor: '#6b7280',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View
                        style={{
                          width: imageSize,
                          height: imageSize,
                          borderWidth: 1,
                          borderColor: '#bbf7d0',
                          backgroundColor: '#f0fdf4',
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: responsiveValue(8, 12, 12),
                          alignSelf: 'center',
                          overflow: 'hidden',
                          shadowColor: '#6b7280',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 6,
                          elevation: 4,
                        }}
                      >
                        <Image
                          source={{ uri: item.product?.images?.[0]?.url || item.product?.image || item.image || 'https://via.placeholder.com/96x96?text=No+Image' }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row justify-between items-start mb-1">
                          <Text 
                            className={`${responsiveValue('text-sm', 'text-base', 'text-base')} font-semibold text-black-800 flex-1`}
                            numberOfLines={2}
                          >
                            {item.name}
                          </Text>
                          <TouchableOpacity onPress={() => removeFromCart(item._id)} className="ml-2">
                            <Trash2 size={responsiveValue(16, 18, 18)} color="red" />
                          </TouchableOpacity>
                        </View>
                        <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-green-600 mb-1`}>{item.unit || '500 g'}</Text>
                        <View className="flex-row items-center mb-1">
                          <Text className={`${responsiveValue('text-base', 'text-lg', 'text-lg')} font-bold text-green-800`}>
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </Text>
                          {item.originalPrice && (
                            <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-gray-400 line-through ml-2`}>
                              ₹{(item.originalPrice * item.quantity).toFixed(2)}
                            </Text>
                          )}
                        </View>
                        {discount > 0 && (
                          <Text className={`${responsiveValue('text-xs', 'text-xs', 'text-sm')} text-red-500 mb-1`}>
                            Discount: ₹{(discount * item.quantity).toFixed(2)}
                          </Text>
                        )}
                        <Text className={`${responsiveValue('text-xs', 'text-xs', 'text-sm')} text-blue-500 mb-1`}>
                          GST (5%): ₹{(gst * item.quantity).toFixed(2)}
                        </Text>
                        <Text className={`${responsiveValue('text-xs', 'text-xs', 'text-sm')} text-black-700 mb-2`}>
                          Final: ₹{(finalPrice * item.quantity).toFixed(2)}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center bg-green-50 rounded-full px-1 py-1">
                            <TouchableOpacity
                              onPress={() => decreaseQty(item)}
                              className={`${responsiveValue('w-7 h-7', 'w-8 h-8', 'w-8 h-8')} rounded-full bg-white items-center justify-center shadow-sm border border-green-100`}
                            >
                              <Minus size={responsiveValue(12, 14, 14)} color="#059669" />
                            </TouchableOpacity>
                            <Text className={`${responsiveValue('mx-2', 'mx-4', 'mx-4')} font-medium text-green-700`}>
                              {item.quantity}
                            </Text>
                            <TouchableOpacity
                              onPress={() => increaseQty(item)}
                              className={`${responsiveValue('w-7 h-7', 'w-8 h-8', 'w-8 h-8')} rounded-full bg-white items-center justify-center shadow-sm border border-green-100`}
                            >
                              <Plus size={responsiveValue(12, 14, 14)} color="#059669" />
                            </TouchableOpacity>
                          </View>
                          <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
                            <Text className={`${responsiveValue('text-xs', 'text-xs', 'text-sm')} text-green-700`}>✓</Text>
                            <Text className={`${responsiveValue('text-xs', 'text-xs', 'text-sm')} text-grey-700 ml-1`}>Har Din Sasta</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="flex-row items-center mt-3 pt-3 border-t border-green-100"
                      onPress={() => moveToWishlist(item)}
                    >
                      <Heart
                        size={responsiveValue(14, 16, 16)}
                        color={isInWishlist(item._id) ? "red" : "#059669"}
                        fill={isInWishlist(item._id) ? "red" : "none"}
                      />
                      <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-grey-600 ml-2`}>
                        Move to wishlist
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Promo Code Section */}
            <View className="bg-white mx-4 mt-6 rounded-2xl p-4 shadow-sm border border-green-100">
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={handlePromoCode}
              >
                <View className="flex-row items-center">
                  <Tag size={responsiveValue(18, 20, 20)} color="#059669" />
                  <Text className={`${responsiveValue('text-sm', 'text-base', 'text-base')} text-grey-700 ml-3`}>
                    Enter your promo code
                  </Text>
                </View>
                <ChevronRight size={responsiveValue(18, 20, 20)} color="#059669" />
              </TouchableOpacity>
            </View>

            <View className="h-32" />
          </>
        )}
      </ScrollView>

      {/* Checkout Bar */}
      {(safeCartItems?.length ?? 0) > 0 && (
        <View className="bg-white border-t border-green-100">
          <View className="px-4 py-3 border-b border-green-100">
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-green-700`}>Subtotal</Text>
              <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} font-medium text-green-800`}>
                ₹{getSubtotal().toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-green-700`}>Total Discount</Text>
              <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} font-medium text-red-500`}>
                -₹{getTotalDiscount().toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-green-700`}>Total GST (5%)</Text>
              <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} font-medium text-blue-500`}>
                ₹{getTotalGST().toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} text-green-700`}>Delivery</Text>
              <Text className={`${responsiveValue('text-xs', 'text-sm', 'text-sm')} font-medium text-green-800`}>
                ₹{getShipping().toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className={`${responsiveValue('text-sm', 'text-base', 'text-base')} font-semibold text-black-800`}>
                Grand Total: ₹{getGrandTotal().toFixed(2)}
              </Text>
            </View>
          </View>
          <View className="px-4 py-4">
            <TouchableOpacity
              onPress={handleProceedToCheckout}
              activeOpacity={0.9}
              className="rounded-2xl overflow-hidden shadow-sm"
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: responsiveValue(14, 16, 16),
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="text-white font-semibold text-base">Proceed to Checkout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}