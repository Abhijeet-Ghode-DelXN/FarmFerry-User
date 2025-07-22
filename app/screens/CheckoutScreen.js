import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MapPin, CreditCard, CheckCircle } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { customerAPI, ordersAPI } from '../services/api';

const CheckoutScreen = ({ route }) => {
  const navigation = useNavigation();
  const { items, subtotal, shipping, total, savings } = route.params;
  const { user } = useAppContext();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoading(true);
      try {
        const response = await customerAPI.getProfile();
        setAddresses(response.data.data.addresses);
        if (response.data.data.addresses.length > 0) {
          setSelectedAddress(response.data.data.addresses[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a shipping address.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      await ordersAPI.createOrder({
        shippingAddress: selectedAddress,
        paymentMethod,
      });
      Alert.alert('Success', 'Your order has been placed successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Orders') },
      ]);
    } catch (error) {
      Alert.alert(
        'Order Failed',
        error.response?.data?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg text-black font-medium">Checkout</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Shipping Address */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Shipping Address</Text>
          {addresses.map((address) => (
            <TouchableOpacity
              key={address._id}
              className={`border p-4 rounded-lg mb-2 ${
                selectedAddress === address._id ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
              onPress={() => setSelectedAddress(address._id)}
            >
              <View className="flex-row justify-between">
                <Text className="font-semibold">{user.name}</Text>
                {selectedAddress === address._id && <CheckCircle size={20} color="#059669" />}
              </View>
              <Text>{address.street}, {address.city}</Text>
              <Text>{address.state}, {address.postalCode}</Text>
              <Text>{address.country}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => navigation.navigate('AddAddress')}
            className="mt-2"
          >
            <Text className="text-green-600 font-semibold">Add New Address</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Payment Method</Text>
          <TouchableOpacity
            className={`border p-4 rounded-lg flex-row justify-between items-center ${
              paymentMethod === 'COD' ? 'border-green-500 bg-green-50' : 'border-gray-200'
            }`}
            onPress={() => setPaymentMethod('COD')}
          >
            <View className="flex-row items-center">
              <CreditCard size={24} color="#6b7280" />
              <Text className="ml-4">Cash on Delivery (COD)</Text>
            </View>
            {paymentMethod === 'COD' && <CheckCircle size={20} color="#059669" />}
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Order Summary</Text>
          {items.map((item) => (
            <View key={item.product._id} className="flex-row justify-between items-center mb-2">
              <Text className="flex-1">{item.product.name} x{item.quantity}</Text>
              <Text>₹{(item.product.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View className="border-t border-gray-200 mt-2 pt-2">
            <View className="flex-row justify-between items-center mb-1">
              <Text>Subtotal</Text>
              <Text>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-1">
              <Text>Shipping</Text>
              <Text>₹{shipping.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center font-bold">
              <Text className="font-bold">Total</Text>
              <Text className="font-bold">₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="bg-green-500 py-4 rounded-2xl items-center"
        >
          <Text className="text-white text-lg font-semibold">
            {isPlacingOrder ? 'Placing Order...' : `Place Order - ₹${total.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CheckoutScreen; 