import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, TextInput, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, MapPin, CreditCard, CheckCircle, Trash2, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { customerAPI, ordersAPI, cartAPI } from '../services/api';
import { SCREEN_NAMES } from '../types';
import UpiPay from 'react-native-upi-pay';
import Modal from '../components/ui/Modal';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

// Payment options for online payment
const paymentOptions = [
  {
    id: 'gpay',
    title: 'Google Pay',
    icon: FontAwesome5,
    iconName: 'google-pay',
    bgColor: 'bg-blue-50',
    imageUrl: null,
    rightLogo: null,
  },
  {
    id: 'phonepe',
    title: 'PhonePe',
    icon: MaterialCommunityIcons,
    iconName: 'phone',
    bgColor: 'bg-purple-50',
    imageUrl: null,
    rightLogo: null,
  },
  {
    id: 'upi_id',
    title: 'Other UPI',
    icon: MaterialCommunityIcons,
    iconName: 'plus-circle-outline',
    bgColor: 'bg-green-50',
    imageUrl: null,
    rightLogo: null,
  },
  // Add more options as needed
];

const CheckoutScreen = ({ route }) => {
  const navigation = useNavigation();
  const { updateCartItems } = useAppContext();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [cart, setCart] = useState({ items: [], subtotal: 0, shipping: 0, gst: 0, total: 0, savings: 0 });
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState('upi'); // 'upi', 'wallet', 'card'
  const [selectedPayment, setSelectedPayment] = useState('gpay'); // 'gpay', 'phonepe', 'upi_id', 'wallet', 'card'
  const [customUpiId, setCustomUpiId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedOption, setSelectedOption] = useState(paymentOptions[0].id);
  
  // Get items from route params (for Buy Now functionality)
  const routeItems = route?.params?.items;

  // GST rate (5%)
  const GST_RATE = 0.05;

  // Calculation helpers (same as CartScreen)
  const getSubtotal = (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getTotalDiscount = (items) => items.reduce((sum, item) => {
    if (item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);
  const getTotalGST = (items) => items.reduce((sum, item) => sum + (item.price * GST_RATE) * item.quantity, 0);
  const getShipping = () => 4.0;
  const getGrandTotal = (items) => getSubtotal(items) + getTotalGST(items) + getShipping();

  // Fetch cart and addresses on mount/focus
  const fetchCartAndAddresses = async () => {
    setIsLoading(true);
    try {
      let items = [];
      
      // If route items are provided (Buy Now), use them; otherwise fetch from cart
      if (routeItems && Array.isArray(routeItems)) {
        items = routeItems;
        console.log('Using route items for checkout:', items);
      } else {
        // Fetch cart
        const cartRes = await cartAPI.getCart();
        const cartData = cartRes?.data?.data?.cart || {};
        items = Array.isArray(cartData.items) ? cartData.items : [];
        console.log('Using cart items for checkout:', items);
      }
      
      const subtotal = getSubtotal(items);
      const gst = getTotalGST(items);
      const shipping = getShipping();
      const total = subtotal + gst + shipping;
      const savings = getTotalDiscount(items);
      setCart({
        items,
        subtotal,
        gst,
        shipping,
        total,
        savings,
      });
      
      // Only update cart items if we're not using route items (Buy Now)
      if (!routeItems) {
        updateCartItems(items);
      }
      
      // Fetch addresses
      const response = await customerAPI.getProfile();
      const addresses = response?.data?.data?.customer?.addresses;
      setAddresses(Array.isArray(addresses) ? addresses : []);
      if (Array.isArray(addresses) && addresses.length > 0) {
        setSelectedAddress(addresses[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch cart or addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCartAndAddresses();
  }, [routeItems]); // Re-run when route items change

  useFocusEffect(
    React.useCallback(() => {
      fetchCartAndAddresses();
    }, [routeItems]) // Re-run when route items change
  );

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a shipping address.');
      return;
    }
    if (!cart.items || cart.items.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }
    const addressObj = addresses.find(addr => addr._id === selectedAddress);
    if (!addressObj) {
      Alert.alert('Error', 'Selected address not found.');
      return;
    }
    // Debug: log user object
    console.log('DEBUG: user object at checkout:', user);
    // Ensure phone is present and non-empty
    const deliveryAddress = {
      street: addressObj.street,
      city: addressObj.city,
      state: addressObj.state,
      postalCode: addressObj.postalCode,
      country: addressObj.country,
      phone: addressObj.phone || user?.phone || '',
    };
    console.log('DEBUG: deliveryAddress.phone being sent:', deliveryAddress.phone);
    if (!deliveryAddress.phone || deliveryAddress.phone.trim() === '') {
      Alert.alert('Error', 'No phone number found for delivery address. Please edit your address or profile.');
      return;
    }
    // Map paymentMethod to backend enum
    let paymentMethodValue = paymentMethod;
    if (paymentMethod === 'Cash on Delivery') paymentMethodValue = 'cash_on_delivery';
    else if (paymentMethod === 'Online Payment') paymentMethodValue = 'upi';
    // Build items array dynamically
    const items = cart.items.map(item => {
      const base = {
        product: item.product?._id || item.product?.id || item.product,
        quantity: item.quantity,
      };
      if (item.variation && item.variation.name && item.variation.value) {
        base.variation = {
          name: item.variation.name,
          value: item.variation.value,
        };
      }
      return base;
    });
    setIsPlacingOrder(true);
    try {
      const response = await ordersAPI.createOrder({
        deliveryAddress,
        paymentMethod: paymentMethodValue,
        items,
        clearCart: true, // clear cart after order
      });
      console.log('Order API response:', response);
      updateCartItems([]);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('Orders');
      }, 3000);
    } catch (error) {
      console.log('Order API error:', error, error?.response);
      if (error.response) {
        Alert.alert(
          'Order Failed',
          error.response?.data?.message || 'An unexpected error occurred. Please try again.'
        );
      }
      // If no error.response, do not show alert (could be navigation/unmount issue)
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // UPI Payment Handler
  const handleUpiPayment = async (app) => {
    setIsPaying(true);
    try {
      const upiId = 'yourupiid@okicici'; // TODO: Replace with your business UPI ID
      const payeeName = 'FarmFerry';
      const amount = cart.total.toFixed(2);
      const transactionRef = `FF${Date.now()}`;
      const response = await UpiPay.initializePayment({
        vpa: upiId,
        payeeName,
        amount,
        transactionRef,
        app,
      });
      if (response && response.Status && response.Status.toLowerCase() === 'success') {
        // Payment successful, place order
        handlePlaceOrder();
      } else {
        Alert.alert('Payment Failed', 'Payment was not successful. Please try again.');
      }
    } catch (error) {
      Alert.alert('Payment Error', 'An error occurred during payment.');
    } finally {
      setIsPaying(false);
    }
  };

  // Add delete handler for addresses
  const handleDeleteAddress = async (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerAPI.deleteAddress(addressId);
              fetchCartAndAddresses();
              Alert.alert('Deleted', 'Address deleted successfully.');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete address.');
            }
          },
        },
      ]
    );
  };

  // Enhanced RadioButton with green theme
  const RadioButton = ({ selected }) => (
    <View className={`w-5 h-5 rounded-full border-2 ${selected ? 'border-green-600 bg-green-100' : 'border-gray-300'} items-center justify-center`}>
      {selected ? <View className="w-2.5 h-2.5 rounded-full bg-green-600" /> : null}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  // Empty cart state
  if (!cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg mb-2">Your cart is empty.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text className="text-green-600 font-semibold">Go Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Empty address state
  if (!addresses || addresses.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg mb-2">No addresses found. Please add a shipping address.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddAddress')}>
          <Text className="text-green-600 font-semibold">Add Address</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Shipping Address */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Shipping Address</Text>
          {(Array.isArray(addresses) ? addresses : []).map((address) => (
            <View key={address._id} className={`border p-4 rounded-lg mb-2 ${selectedAddress === address._id ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <TouchableOpacity
                className="absolute top-2 right-2 z-10"
                onPress={() => handleDeleteAddress(address._id)}
                disabled={addresses.length <= 1}
                style={{ opacity: addresses.length <= 1 ? 0.4 : 1 }}
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedAddress(address._id)}
                className="flex-1"
                activeOpacity={0.8}
                style={{ minHeight: 60 }}
              >
                <View className="flex-row justify-between">
                  <Text className="font-semibold">{user ? user.name : ''}</Text>
                </View>
                <Text>{address.street}, {address.city}</Text>
                <Text>{address.state}, {address.postalCode}</Text>
                <Text>{address.country}</Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {address.phone && address.phone.trim() !== ''
                    ? address.phone
                    : user?.phone && user.phone.trim() !== ''
                      ? `${user.phone} (from profile)`
                      : 'No phone number'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => navigation.navigate("AddAddress")}
            className="mt-2"
          >
            <Text className="text-green-600 font-semibold">Add New Address</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-2">Payment Method</Text>
          <TouchableOpacity
            className={`border p-4 rounded-lg flex-row justify-between items-center ${paymentMethod === 'Cash on Delivery' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            onPress={() => {
              setPaymentMethod('Cash on Delivery');
              setShowPaymentOptions(false);
              setPaymentModalVisible(false);
            }}
          >
            <View className="flex-row items-center">
              <CreditCard size={24} color="#6b7280" />
              <Text className="ml-4">Cash on Delivery (COD)</Text>
            </View>
            {paymentMethod === 'Cash on Delivery' && <CheckCircle size={20} color="#059669" />}
          </TouchableOpacity>
          <TouchableOpacity
            className={`border p-4 rounded-lg flex-row justify-between items-center mt-2 ${paymentMethod === 'Online Payment' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            onPress={() => {
              setPaymentMethod('Online Payment');
              setShowPaymentOptions(true);
              setPaymentModalVisible(true);
            }}
          >
            <View className="flex-row items-center">
              <CreditCard size={24} color="#6b7280" />
              <Text className="ml-4">Online Payment</Text>
            </View>
            {paymentMethod === 'Online Payment' && <CheckCircle size={20} color="#059669" />}
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold">Order Summary</Text>
            {routeItems && (
              <View className="bg-green-100 px-2 py-1 rounded-full">
                <Text className="text-xs font-medium text-green-700">Buy Now</Text>
              </View>
            )}
          </View>
          {cart.items.map((item) => (
            <View key={item.product?._id || item.product?.id || item.product} className="flex-row justify-between items-center mb-2">
              <Text className="flex-1">{item.product?.name || item.name} x{item.quantity}</Text>
              <Text>₹{(item.product?.price ? item.product.price * item.quantity : item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View className="border-t border-gray-200 mt-2 pt-2">
            <View className="flex-row justify-between items-center mb-1">
              <Text>Subtotal</Text>
              <Text>₹{cart.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-1">
              <Text>GST (5%)</Text>
              <Text>₹{cart.gst.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-1">
              <Text>Shipping</Text>
              <Text>₹{cart.shipping.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center font-bold">
              <Text className="font-bold">Total</Text>
              <Text className="font-bold">₹{cart.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          onPress={paymentMethod === 'Online Payment' ? () => setPaymentModalVisible(true) : handlePlaceOrder}
          disabled={isPlacingOrder}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={["#10b981", "#059669"]}
            className="py-4 flex-row items-center justify-center rounded-xl"
          >
            <CheckCircle width={18} height={18} color="#fff" />
            <Text className="text-white font-semibold text-sm ml-1.5">
              {isPlacingOrder
                ? 'Placing Order...'
                : paymentMethod === 'Online Payment'
                  ? 'Pay & Place Order'
                  : `Place Order - ₹${cart.total.toFixed(2)}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Payment Options Modal */}
      <Modal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        title="Pay Online"
        size="full"
        showCloseButton
        closeOnBackdropPress
        style="pb-0"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Offer/discount info */}
          <View className="rounded-2xl bg-white border border-green-200 p-4 mb-4 shadow-md flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-extrabold text-green-700">₹{cart.total.toFixed(0)}</Text>
              <Text className="text-xs text-gray-400 line-through">₹{(cart.total + 19).toFixed(0)}</Text>
              <Text className="text-xs text-green-700 font-semibold mt-1">Save ₹19</Text>
            </View>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="bank-transfer" size={28} color="#059669" />
              <Text className="ml-2 font-bold text-green-700">Pay Online</Text>
            </View>
          </View>
          <TouchableOpacity className="mb-4 flex-row items-center justify-between px-2" onPress={() => { }}>
            <Text className="text-green-700 font-medium">Extra discount with bank offers</Text>
            <Text className="text-green-700 underline font-semibold">View Offers</Text>
          </TouchableOpacity>

          {/* UPI Section */}
          <View className="bg-white rounded-2xl shadow-sm mb-4 p-3 border border-green-100">
            <TouchableOpacity className="flex-row items-center justify-between pb-2" onPress={() => setExpandedSection(expandedSection === 'upi' ? '' : 'upi')}>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="bank" size={22} color="#059669" />
                <Text className="ml-2 font-bold text-green-700 text-base">Pay by any UPI App</Text>
              </View>
              <Ionicons name={expandedSection === 'upi' ? 'chevron-up' : 'chevron-down'} size={22} color="#059669" />
            </TouchableOpacity>
            {expandedSection === 'upi' && (
              <View className="mt-2">
                <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg" style={{ backgroundColor: selectedPayment === 'gpay' ? '#e6f9f0' : 'transparent' }} onPress={() => setSelectedPayment('gpay')}>
                  <FontAwesome5 name="google-pay" size={28} color="#34A853" />
                  <Text className="ml-3 flex-1 text-base font-medium">GPay</Text>
                  <RadioButton selected={selectedPayment === 'gpay'} />
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg" style={{ backgroundColor: selectedPayment === 'phonepe' ? '#e6f9f0' : 'transparent' }} onPress={() => setSelectedPayment('phonepe')}>
                  <MaterialCommunityIcons name="phone" size={28} color="#5F259F" />
                  <Text className="ml-3 flex-1 text-base font-medium">PhonePe</Text>
                  <RadioButton selected={selectedPayment === 'phonepe'} />
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg" style={{ backgroundColor: selectedPayment === 'upi_id' ? '#e6f9f0' : 'transparent' }} onPress={() => setSelectedPayment('upi_id')}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#059669" />
                  <Text className="ml-3 flex-1 text-base font-medium">Add UPI ID</Text>
                  <RadioButton selected={selectedPayment === 'upi_id'} />
                </TouchableOpacity>
                {selectedPayment === 'upi_id' && (
                  <View className="flex-row items-center mt-2 px-2">
                    <Text className="mr-2 text-green-700 font-semibold">UPI ID:</Text>
                    <View className="flex-1 border-b border-green-300">
                      <TextInput
                        value={customUpiId}
                        onChangeText={setCustomUpiId}
                        placeholder="yourupi@bank"
                        className="py-1 px-2 text-green-900"
                      />
                    </View>
                  </View>
                )}
                <Text className="text-xs text-green-700 mt-2 font-semibold px-2">Offers Available</Text>
              </View>
            )}
          </View>

          {/* Wallet Section */}
          <View className="bg-white rounded-2xl shadow-sm mb-4 p-3 border border-green-100">
            <TouchableOpacity className="flex-row items-center justify-between pb-2" onPress={() => setExpandedSection(expandedSection === 'wallet' ? '' : 'wallet')}>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="wallet" size={22} color="#059669" />
                <Text className="ml-2 font-bold text-green-700 text-base">Wallet</Text>
              </View>
              <Ionicons name={expandedSection === 'wallet' ? 'chevron-up' : 'chevron-down'} size={22} color="#059669" />
            </TouchableOpacity>
            {expandedSection === 'wallet' && (
              <View className="mt-2">
                <Text className="text-xs text-green-700 font-semibold px-2">Offers Available</Text>
                <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg mt-2" style={{ backgroundColor: selectedPayment === 'wallet' ? '#e6f9f0' : 'transparent' }} onPress={() => setSelectedPayment('wallet')}>
                  <MaterialCommunityIcons name="wallet-outline" size={28} color="#059669" />
                  <Text className="ml-3 flex-1 text-base font-medium">Wallet (Coming Soon)</Text>
                  <RadioButton selected={selectedPayment === 'wallet'} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Card Section */}
          <View className="bg-white rounded-2xl shadow-sm mb-4 p-3 border border-green-100">
            <TouchableOpacity className="flex-row items-center justify-between pb-2" onPress={() => setExpandedSection(expandedSection === 'card' ? '' : 'card')}>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="credit-card-outline" size={22} color="#059669" />
                <Text className="ml-2 font-bold text-green-700 text-base">Debit/Credit Cards</Text>
              </View>
              <Ionicons name={expandedSection === 'card' ? 'chevron-up' : 'chevron-down'} size={22} color="#059669" />
            </TouchableOpacity>
            {expandedSection === 'card' && (
              <View className="mt-2">
                <TouchableOpacity className="flex-row items-center py-3 px-2 rounded-lg" style={{ backgroundColor: selectedPayment === 'card' ? '#e6f9f0' : 'transparent' }} onPress={() => setSelectedPayment('card')}>
                  <MaterialCommunityIcons name="credit-card" size={28} color="#059669" />
                  <Text className="ml-3 flex-1 text-base font-medium">Debit/Credit Card (Coming Soon)</Text>
                  <RadioButton selected={selectedPayment === 'card'} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        {/* Divider above Place Order button */}
        <View className="border-t border-green-200" />
        {/* Place Order button in a white card */}
        <View className="bg-white p-4 shadow-lg rounded-t-2xl">
          <TouchableOpacity
            className="bg-green-600 rounded-xl py-3 items-center shadow-md"
            onPress={() => {
              if (selectedOption === 'gpay') handleUpiPayment(UpiPay.UPI_APPS.GOOGLE_PAY);
              else if (selectedOption === 'phonepe') handleUpiPayment(UpiPay.UPI_APPS.PHONEPE);
              else if (selectedOption === 'upi_id' && customUpiId) handleUpiPayment(customUpiId);
              else Alert.alert('Select a valid payment method or enter UPI ID.');
            }}
            disabled={isPaying || (selectedOption === 'upi_id' && !customUpiId)}
          >
            <Text className="text-white font-extrabold text-lg">Place Order</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Success Modal */}
      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View className="bg-white rounded-3xl p-8 items-center shadow-lg w-[300px] max-w-[360px]">
          {/* Animation Container */}
          <LottieView
            source={require('../../assets/Payment-Success.json')} // Make sure this path is correct
            autoPlay
            loop={false}
            style={{ width: 150, height: 150 }}
            resizeMode="cover"
          />

          <Text className="text-2xl font-bold text-green-600 mt-2 text-center">Order Placed!</Text>
          <Text className="text-gray-700 mt-2 text-base text-center font-medium">
            Your order has been confirmed
          </Text>
          <View className="mt-4 w-full items-center">
            <Text className="text-gray-500 text-sm text-center">
              Thank you for shopping with FarmFerry!
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckoutScreen; 