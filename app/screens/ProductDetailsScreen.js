import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Plus, Minus, Heart, Star, Share2, ChevronRight } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { productsAPI, cartAPI } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const ProductDetailsScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const { cartItems, wishlistItems, updateCartItems, updateWishlistItems } = useAppContext();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await productsAPI.getProductDetails(productId);
        setProduct(response.data.data);
      } catch (error) {
        console.error('Failed to fetch product details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Product not found.</Text>
      </View>
    );
  }

  const isInWishlist = wishlistItems.some(item => item._id === product._id);
  const isInCart = cartItems.some(item => item.product._id === product._id);

  const toggleWishlist = () => {
    const newWishlist = isInWishlist
      ? wishlistItems.filter(item => item._id !== product._id)
      : [...wishlistItems, product];
    updateWishlistItems(newWishlist);
  };

  const handleAddToCart = async () => {
    if (!isInCart) {
      try {
        const response = await cartAPI.addToCart({ productId: product._id, quantity: 1 });
        updateCartItems(response.data.data.items);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
    }
  };

  const handleBuyNow = async () => {
    if (!isInCart) {
      try {
        const response = await cartAPI.addToCart({ productId: product._id, quantity: 1 });
        updateCartItems(response.data.data.items);
        navigation.navigate('Checkout', { 
          items: response.data.data.items
        });
      } catch (error) {
        console.error('Failed to add to cart and buy now:', error);
      }
    } else {
      navigation.navigate('Checkout', { 
        items: cartItems
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#059669" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleWishlist}>
          <Heart
            size={24}
            color={isInWishlist ? '#ef4444' : '#9ca3af'}
            fill={isInWishlist ? '#ef4444' : 'none'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Product Image */}
        <View className="w-full bg-gray-50 items-center justify-center py-6">
          <View
            className="bg-white rounded-3xl shadow-lg"
            style={{
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              transform: [{ translateY: -16 }],
            }}
          >
            <Image
              source={{ uri: product.images[0]?.url }}
              className="w-64 h-64 rounded-2xl"
              resizeMode="contain"
            />
          </View>
        </View>


        {/* Product Info */}
        <View className="bg-white p-6 mt-4 rounded-t-3xl shadow-sm">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>
            {product.discount > 0 && (
              <View className="bg-red-500 px-3 py-1 rounded-full">
                <Text className="text-white text-sm font-medium">{product.discount}% OFF</Text>
              </View>
            )}
          </View>

          <Text className="text-sm text-green-600 mb-4">by {product.supplier?.name || 'FarmFerry'}</Text>

          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center bg-amber-50 rounded-lg px-3 py-1 border border-amber-200 mr-4">
              <Star width={14} height={14} fill="#facc15" color="#facc15" />
              <Text className="text-sm text-amber-800 ml-1">{product.averageRating.toFixed(1)} ({product.totalReviews} reviews)</Text>
            </View>
            <Text className="text-sm text-gray-500">{product.unit}</Text>
          </View>

          <View className="flex-row items-center mb-6">
            <Text className="text-2xl font-bold text-green-600">₹{product.price}</Text>
            {product.originalPrice && (
              <Text className="text-base text-gray-400 line-through ml-3">₹{product.originalPrice}</Text>
            )}
          </View>

          {/* Product Description */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Description</Text>
            <Text className="text-gray-600">
              {product.description}
            </Text>
          </View>

          {/* Nutritional Info */}
          {product.nutritionalInfo && (
            <View className="mb-8">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Nutritional Information</Text>
              <View className="bg-gray-50 p-4 rounded-lg">
                {Object.entries(product.nutritionalInfo).map(([key, value]) => (
                  <View key={key} className="flex-row justify-between py-2 border-b border-gray-200">
                    <Text className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</Text>
                    <Text className="text-gray-800 font-medium">{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Farmer Info */}
          {product.supplier && (
            <View className="mb-8">
              <Text className="text-lg font-semibold text-gray-800 mb-3">About the Farmer</Text>
              <View className="flex-row items-center bg-green-50 p-4 rounded-lg">
                <Image
                  source={{ uri: product.supplier.logo?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' }}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <View>
                  <Text className="text-gray-800 font-medium">{product.supplier.name}</Text>
                  <Text className="text-gray-500 text-sm">{product.supplier.farmName || 'Organic Farm'}</Text>
                  <Text className="text-green-600 text-sm">{product.supplier.address?.city || 'Maharashtra'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`flex-row justify-center items-center rounded-xl py-4 shadow-sm ${isInCart ? 'bg-gray-200' : 'bg-green-500'}`}
          onPress={handleAddToCart}
          disabled={isInCart}
        >
          {isInCart ? (
            <Text className="text-gray-600 text-lg font-semibold">Added to Cart</Text>
          ) : (
            <>
              <Plus width={20} height={20} color="#fff" />
              <Text className="text-white text-lg font-semibold ml-2">Add to Cart - ₹{product.price}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailsScreen;