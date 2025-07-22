import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

export default function PlaceOrderScreen({ navigation }) {
  const handlePlaceOrder = () => {
    Alert.alert('Success', 'Your order has been placed!');
    navigation.navigate('Orders');
  };

  return (
    <View className="flex-1 bg-gray-50 p-5 justify-center">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Place Order</Text>

      <Text className="text-gray-600 text-base mb-6">
        Confirm your address and payment method to place your order.
      </Text>

      {/* This would be replaced by address & payment UI */}
      <View className="bg-white p-4 rounded-2xl border border-gray-200 mb-6">
        <Text className="text-gray-700">Address: 5A, Main Road, Chennai</Text>
        <Text className="text-gray-700 mt-2">Payment: Cash on Delivery</Text>
      </View>

      <TouchableOpacity
        onPress={handlePlaceOrder}
        className="bg-green-500 py-4 rounded-2xl items-center"
      >
        <Text className="text-white text-base font-semibold">Confirm & Place Order</Text>
      </TouchableOpacity>
    </View>
  );
}
