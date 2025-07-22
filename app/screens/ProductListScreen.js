import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { productsAPI } from '../services/api';

export default function ProductListScreen() {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsAPI.getProducts();
        setProducts(response.data.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-6">
      <Text className="text-2xl font-bold text-gray-800 mb-4">All Products</Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-2xl mb-4 p-3 w-[48%]"
            onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
          >
            <Image source={{ uri: item.images[0]?.url }} className="w-full h-28 mb-2" resizeMode="contain" />
            <Text className="text-gray-800 font-semibold">{item.name}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-green-600 font-bold">₹{item.price}/kg</Text>
              {item.originalPrice && (
                <Text className="text-xs text-gray-400 ml-2 line-through">₹{item.originalPrice}/kg</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
