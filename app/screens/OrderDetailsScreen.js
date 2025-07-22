import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';

const orderDetails = {
  id: '123456',
  status: 'Delivered',
  total: 325,
  items: [
    { name: 'Organic Tomatoes', qty: 1, price: 45, image: require('../../assets/images/tomato.png') },
    { name: 'Fresh Apples', qty: 2, price: 240, image: require('../../assets/images/apple.png') },
    { name: 'Cashews', qty: 0.5, price: 200, image: require('../../assets/images/dryfruits.jpg') },
  ],
};

export default function OrderDetailsScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-800 mb-2">Order #{orderDetails.id}</Text>
      <Text className="text-green-600 font-medium mb-4">Status: {orderDetails.status}</Text>

      {orderDetails.items.map((item, index) => (
        <View
          key={index}
          className="flex-row bg-white p-4 mb-3 rounded-2xl shadow-sm items-center"
        >
          <Image source={item.image} className="w-14 h-14 mr-4" resizeMode="contain" />
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">{item.name}</Text>
            <Text className="text-sm text-gray-500">Qty: {item.qty} • ₹{item.price}</Text>
          </View>
        </View>
      ))}

      <View className="mt-4 border-t border-gray-200 pt-4">
        <Text className="text-lg font-semibold text-gray-700">Total: ₹{orderDetails.total}</Text>
      </View>
    </ScrollView>
  );
}
