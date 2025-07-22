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
  length
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

  // Defensive fallback: ensure cartItems is always an array
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  console.log('CartScreen cartItems:', cartItems);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await cartAPI.getCart();
        updateCartItems(response.data.data.items);
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, []);

  const recommendedProducts = [
    {
      id: 101,
      name: 'Organic Bananas',
      price: 35,
      originalPrice: 45,
      weight: '1 kg',
      image: {
        uri: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop',
      },
      discount: '22%',
      rating: 4.3,
      deliveryTime: '30 min',
    },
    {
      id: 102,
      name: 'Cherry Tomatoes',
      price: 60,
      originalPrice: 80,
      weight: '500 g',
      image: {
        uri: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=200&h=200&fit=crop',
      },
      discount: '25%',
      rating: 4.5,
      deliveryTime: '25 min',
    },
  ];

  const frequentlyBoughtProducts = [
    {
      id: 201,
      name: 'Fresh Milk',
      price: 50,
      originalPrice: 60,
      weight: '1 L',
      image: {
        uri: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop',
      },
      discount: '17%',
      rating: 4.2,
      deliveryTime: '20 min',
    },
    {
      id: 202,
      name: 'Brown Bread',
      price: 40,
      originalPrice: 55,
      weight: '400 g',
      image: {
        uri: 'https://images.unsplash.com/photo-1604908554165-910cf4b84076?w=200&h=200&fit=crop',
      },
      discount: '27%',
      rating: 4.6,
      deliveryTime: '15 min',
    },
  ];

  const handleUpdateQuantity = async (productId, quantity) => {
    try {
      const response = await cartAPI.updateCartItem(productId, quantity);
      updateCartItems(response.data.data.items);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const increaseQty = (item) => {
    handleUpdateQuantity(item.id, item.quantity + 1);
  };

  const decreaseQty = (item) => {
    if (item.quantity > 1) {
      handleUpdateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await cartAPI.removeCartItem(productId);
      updateCartItems(response.data.data.items);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const toggleWishlist = (product) => {
    if (!product || !product.name) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      Alert.alert('Removed from Wishlist', `${product.name} has been removed from your wishlist`);
    } else {
      addToWishlist({ ...product, image: product.image.uri });
      Alert.alert('Added to Wishlist', `${product.name} has been added to your wishlist`);
    }
  };

  const isInWishlist = (id) => {
    return wishlistItems.some((item) => item._id === id);
  };

  const moveToWishlist = (product) => {
    if (!product || !product.name) return;
    if (!isInWishlist(product.id)) {
      addToWishlist(product);
    }
    removeFromCart(product.id);
    Alert.alert('Moved to Wishlist', `${product.name} has been moved to your wishlist`);
  };

  const handleAddRecommended = async (product) => {
    if (!product || !product.name) return;
    try {
        await cartAPI.addToCart({ productId: product.id, quantity: 1 });
        const response = await cartAPI.getCart();
        updateCartItems(response.data.data.items);
        Alert.alert('Added to Cart', `${product.name} has been added to your cart`);
    } catch (error) {
        console.error('Failed to add recommended product to cart:', error);
        Alert.alert('Error', 'Could not add item to cart.');
    }
  };

  const handlePromoCode = () => navigation.navigate('PromoCode');

  const handleViewAllRecommended = () => {
    navigation.navigate('RecommendedProducts', {
      products: recommendedProducts,
      title: 'Fresh Picks for You',
    });
  };

  const handleViewAllFrequentlyBought = () => {
    navigation.navigate('RecommendedProducts', {
      products: frequentlyBoughtProducts,
      title: 'Frequently Bought Together',
    });
  };

  const handleChangeAddress = () => navigation.navigate('SelectAddress');

  const getSubtotal = () =>
    safeCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getShipping = () => 4.0;
  const getTotal = () => getSubtotal() + getShipping();
  const getSavings = () =>
    safeCartItems.reduce((sum, item) => {
      if (item.originalPrice) {
        return sum + (item.originalPrice - item.price) * item.quantity;
      }
      return sum;
    }, 0);

  const renderRecommendedProduct = (product) => (
    (!product || !product.name) ? null : (
      <View
        key={product.id}
        className="bg-white rounded-2xl p-3 mr-3 shadow-sm border border-green-100"
        style={{ width: 160 }}
      >
        <View className="relative w-full h-24 bg-green-50 rounded-xl mb-3 overflow-hidden">
          <Image source={{ uri: product.image.uri }} className="w-full h-full" resizeMode="cover" />
          <View className="absolute top-1 left-1 bg-green-500 px-2 py-1 rounded-full">
            <Text className="text-white text-xs font-medium">{product.discount}</Text>
          </View>
          <TouchableOpacity
            className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full items-center justify-center shadow-sm"
            onPress={() => toggleWishlist(product)}
          >
            <Heart
              size={12}
              color={isInWishlist(product.id) ? 'red' : '#059669'}
              fill={isInWishlist(product.id) ? 'red' : 'none'}
            />
          </TouchableOpacity>
        </View>
        <Text className="text-sm font-semibold text-green-800 mb-1" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-xs text-green-600 mb-2">{product.weight}</Text>
        <View className="flex-row items-center mb-2">
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text className="text-xs text-gray-600 ml-1">{product.rating}</Text>
          <View className="flex-row items-center ml-2">
            <Clock size={10} color="#059669" />
            <Text className="text-xs text-green-600 ml-1">{product.deliveryTime}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-green-800">₹{product.price.toFixed(2)}</Text>
            <Text className="text-xs text-gray-400 line-through">₹{product.originalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            className="bg-green-500 w-8 h-8 rounded-full items-center justify-center"
            onPress={() => handleAddRecommended(product)}
          >
            <Plus size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    )
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar backgroundColor="white" barStyle="dark-content" />

      {/* AppBar with back arrow */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg text-black font-medium">Cart</Text>
      </View>

      {/* Deliver to block just below AppBar */}
      <View className="bg-white px-4 py-3 border-b border-green-100">
        <TouchableOpacity className="flex-row items-center" onPress={handleChangeAddress}>
          <MapPin size={16} color="#059669" />
          <Text className="text-sm text-black ml-2">Deliver to </Text>
          <Text className="text-sm font-semibold text-black">Selected Location</Text>
          <ChevronRight size={14} color="#059669" className="ml-1" />
        </TouchableOpacity>
        <Text className="text-xs text-gray-500 mt-1 ml-6">Mokarwadi, Pune - 411046</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
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
                  <Text className="text-lg font-semibold text-grey-800">Get it in 10 mins</Text>
                  <Text className="text-sm text-green-600">
                    {(safeCartItems?.length ?? 0)} Product{(safeCartItems?.length ?? 0) > 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-black-700 text-sm font-medium">Express</Text>
                </View>
              </View>
            </View>

            {/* Cart Items */}
            <View className="px-4 pt-4">
              {safeCartItems.map((item, idx) => {
                console.log('Rendering cart item', idx, item);
                if (!item) return null;
                return (
                  <View
                    key={item.id}
                    className="bg-white rounded-2xl mb-4 p-4 shadow-sm border border-gray-200"
                    style={{
                      shadowColor: '#6b7280', // Tailwind gray-500
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View className="w-24 h-24 bg-green-50 border border-gray-200 rounded-xl items-center justify-center mr-3 self-center overflow-hidden">
                        <Image
                          source={{ uri: item.images?.[0]?.url || item.image }}
                          className="w-full h-full"
                          resizeMode="contain"
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row justify-between items-start mb-1">
                          <Text className="font-semibold text-base text-black-800 flex-1">{item.name}</Text>
                          <TouchableOpacity onPress={() => removeFromCart(item.id)} className="ml-2">
                            <Trash2 size={18} color="red" />
                          </TouchableOpacity>
                        </View>
                        <Text className="text-sm text-green-600 mb-1">{item.unit || '500 g'}</Text>
                        <View className="flex-row items-center mb-3">
                          <Text className="text-lg font-bold text-green-800">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </Text>
                          {item.originalPrice && (
                            <Text className="text-sm text-gray-400 line-through ml-2">
                              ₹{item.originalPrice}
                            </Text>
                          )}
                        </View>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center bg-green-50 rounded-full px-1 py-1">
                            <TouchableOpacity
                              onPress={() => decreaseQty(item)}
                              className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm border border-green-100"
                            >
                              <Minus size={14} color="#059669" />
                            </TouchableOpacity>
                            <Text className="mx-4 font-medium text-green-700">{item.quantity}</Text>
                            <TouchableOpacity
                              onPress={() => increaseQty(item)}
                              className="w-8 h-8 rounded-full bg-white items-center justify-center shadow-sm border border-green-100"
                            >
                              <Plus size={14} color="#059669" />
                            </TouchableOpacity>
                          </View>
                          <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full">
                            <Text className="text-green-700 text-xs">✓</Text>
                            <Text className="text-grey-700 text-xs ml-1">Har Din Sasta</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="flex-row items-center mt-3 pt-3 border-t border-green-100"
                      onPress={() => moveToWishlist(item)}
                    >
                      <Heart
                        size={16}
                        color={isInWishlist(item.id) ? "red" : "#059669"}
                        fill={isInWishlist(item.id) ? "red" : "none"}
                      />
                      <Text className="text-sm text-grey-600 ml-2">Move to wishlist</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Recommended Products */}
            <View className="mt-6">
              <View className="flex-row items-center justify-between px-4 mb-4">
                <Text className="text-lg font-semibold text-grey-900">Fresh picks for you</Text>
                <TouchableOpacity onPress={handleViewAllRecommended}>
                  <ChevronRight size={20} color="#059669" />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
                {recommendedProducts.map(renderRecommendedProduct)}
              </ScrollView>
            </View>

            {/* Frequently Bought Together */}
            <View className="mt-6">
              <View className="flex-row items-center justify-between px-4 mb-4">
                <Text className="text-lg font-semibold text-grey-900">Frequently bought together</Text>
                <TouchableOpacity onPress={handleViewAllFrequentlyBought}>
                  <ChevronRight size={20} color="#059669" />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
                {frequentlyBoughtProducts.map(renderRecommendedProduct)}
              </ScrollView>
            </View>

            {/* Promo Code Section */}
            <View className="bg-white mx-4 mt-6 rounded-2xl p-4 shadow-sm border border-green-100">
              <TouchableOpacity
                className="flex-arow items-center justify-between"
                onPress={handlePromoCode}
              >
                <View className="flex-row items-center">
                  <Tag size={20} color="#059669" />
                  <Text className="text-base text-grey-700 ml-3">Enter your promo code</Text>
                </View>
                <ChevronRight size={20} color="#059669" />
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
              <Text className="text-sm text-green-700">Subtotal</Text>
              <Text className="text-sm font-medium text-green-800">
                ₹{getSubtotal().toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-green-700">Delivery</Text>
              <Text className="text-sm font-medium text-green-800">
                ₹{getShipping().toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-semibold text-black-800">
                Total: ₹{getTotal().toFixed(2)}
              </Text>
              <View className="flex-row items-center">
                <Tag size={14} color="#059669" />
                <Text className="text-sm text-black-600 ml-1">
                  Saved ₹{getSavings().toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
          <View className="px-4 py-4">
            <TouchableOpacity
              onPress={() => navigation.navigate('Checkout', {
                subtotal: getSubtotal(),
                shipping: getShipping(),
                total: getTotal(),
                savings: getSavings(),
                items: safeCartItems
              })}
              activeOpacity={0.9}
              className="rounded-2xl overflow-hidden shadow-sm"
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
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