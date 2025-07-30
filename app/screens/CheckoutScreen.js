import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, TextInput, Image, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, MapPin, CreditCard, CheckCircle, Trash2, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { customerAPI, ordersAPI, cartAPI } from '../services/api';
import { SCREEN_NAMES } from '../types';
import Modal from '../components/ui/Modal';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import PaymentService from '../services/paymentService';
import PAYMENT_CONFIG from '../constants/paymentConfig';

const { width, height } = Dimensions.get('window');

// Responsive sizing helper
const responsiveValue = (mobile, tablet) => {
  return width >= 768 ? tablet : mobile;
};

// Reusable PaymentOption component with responsive sizing
const PaymentOption = ({ icon, title, selected, onPress, disabled, comingSoon }) => (
  <TouchableOpacity
    className={`flex-row items-center p-2 rounded-lg ${selected ? 'bg-green-50' : ''}`}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
    style={{ minHeight: responsiveValue(50, 60) }}
  >
    <View className="bg-white p-1.5 rounded-lg mr-3">
      {icon}
    </View>
    <Text 
      className={`flex-1 ${disabled ? 'text-gray-400' : 'text-gray-800'}`}
      style={{ fontSize: responsiveValue(14, 16) }}
    >
      {title}
      {comingSoon && <Text className="text-gray-400 text-xs"> (Coming Soon)</Text>}
    </Text>
    {!disabled && (
      <View className={`w-5 h-5 rounded-full border-2 ${selected ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
        {selected && <Ionicons name="checkmark" size={14} color="white" />}
      </View>
    )}
  </TouchableOpacity>
);

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
  const [expandedSection, setExpandedSection] = useState('upi');
  const [selectedPayment, setSelectedPayment] = useState('gpay');
  const [customUpiId, setCustomUpiId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  
  // Get items from route params (for Buy Now functionality)
  const routeItems = route?.params?.items;

  // GST rate (5%)
  const GST_RATE = 0.05;

  // Calculation helpers
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
      
      if (routeItems && Array.isArray(routeItems)) {
        items = routeItems;
      } else {
        const cartRes = await cartAPI.getCart();
        const cartData = cartRes?.data?.data?.cart || {};
        items = Array.isArray(cartData.items) ? cartData.items : [];
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
      
      if (!routeItems) {
        updateCartItems(items);
      }
      
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
  }, [routeItems]);

  useFocusEffect(
    React.useCallback(() => {
      fetchCartAndAddresses();
    }, [routeItems])
  );

  // Create order with payment status
  const createOrderWithPayment = async (paymentResult) => {
    if (!selectedAddress) {
      throw new Error('Please select a shipping address.');
    }
    if (!cart.items || cart.items.length === 0) {
      throw new Error('Your cart is empty.');
    }
    
    const addressObj = addresses.find(addr => addr._id === selectedAddress);
    if (!addressObj) {
      throw new Error('Selected address not found.');
    }

    const deliveryAddress = {
      street: addressObj.street,
      city: addressObj.city,
      state: addressObj.state,
      postalCode: addressObj.postalCode,
      country: addressObj.country,
      phone: addressObj.phone || user?.phone || '',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    };

    if (!deliveryAddress.phone || deliveryAddress.phone.trim() === '') {
      throw new Error('No phone number found for delivery address. Please edit your address or profile.');
    }

    let paymentMethodValue = paymentMethod;
    if (paymentMethod === 'Cash on Delivery') paymentMethodValue = 'cash_on_delivery';
    else if (paymentMethod === 'Online Payment') paymentMethodValue = 'upi';

    const items = cart.items.map(item => {
      let productId = null;
      if (item.product && typeof item.product === 'object') {
        productId = item.product._id || item.product.id;
      } else if (item.product) {
        productId = item.product;
      } else if (item._id) {
        productId = item._id;
      }
      
      if (!productId) {
        console.error('Could not find product ID for item:', item);
        throw new Error(`Product ID not found for item: ${item.name || 'Unknown item'}`);
      }
      
      if (!item.quantity || item.quantity <= 0) {
        console.error('Invalid quantity for item:', item);
        throw new Error(`Invalid quantity for item: ${item.name || 'Unknown item'}`);
      }
      
      const base = {
        product: productId,
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

    const orderData = {
      deliveryAddress,
      paymentMethod: paymentMethodValue,
      items,
      clearCart: true,
      ...(paymentResult && {
        paymentStatus: 'paid',
        transactionId: paymentResult.transactionId,
        paymentDetails: {
          method: paymentResult.paymentMethod,
          amount: paymentResult.amount,
          timestamp: paymentResult.timestamp
        }
      })
    };

    const response = await ordersAPI.createOrder(orderData);
    const createdOrderId = response?.data?.data?.order?._id || response?.data?.data?._id;
    setOrderId(createdOrderId);
    
    return response;
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setPaymentError(null);
    
    try {
      await createOrderWithPayment();
      updateCartItems([]);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('Orders');
      }, 3000);
    } catch (error) {
      Alert.alert(
        'Order Failed',
        error.message || error.response?.data?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPayment) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (selectedPayment === 'upi_id' && !customUpiId.trim()) {
      Alert.alert('Error', 'Please enter a valid UPI ID');
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    try {
      const orderId = `ORDER_${Date.now()}`;
      const options = selectedPayment === 'upi_id' ? { upiId: customUpiId.trim() } : {};
      
      const paymentResult = await PaymentService.processPayment(
        selectedPayment,
        cart.total,
        orderId,
        options
      );

      if (paymentResult && paymentResult.success) {
        await createOrderWithPayment(paymentResult);
        updateCartItems([]);
        setPaymentModalVisible(false);
        
        navigation.navigate('PaymentStatus', {
          paymentMethod: selectedPayment,
          amount: cart.total,
          orderId: orderId,
          transactionId: paymentResult.transactionId,
          onPaymentComplete: () => {
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              navigation.navigate('Orders');
            }, 3000);
          },
          onPaymentFailed: (error) => {
            setPaymentError(error);
            Alert.alert('Payment Failed', error);
          }
        });
      } else {
        throw new Error('Payment was not successful');
      }

    } catch (error) {
      setPaymentError(error.message || 'Payment failed. Please try again.');
      Alert.alert('Payment Failed', error.message || 'Payment was not successful. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

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

  const RadioButton = ({ selected, color = "#059669" }) => (
    <View 
      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selected ? 'border-green-600 bg-green-100' : 'border-gray-300'}`}
      style={selected ? { borderColor: color, backgroundColor: `${color}20` } : {}}
    >
      {selected ? <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /> : null}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

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
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: responsiveValue(16, 24), paddingTop: responsiveValue(16, 24) }}
      >
        {/* Shipping Address */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold mb-2" style={{ fontSize: responsiveValue(16, 18) }}>
            Shipping Address
          </Text>
          {(Array.isArray(addresses) ? addresses : []).map((address) => (
            <View 
              key={address._id} 
              className={`border p-4 rounded-lg mb-2 ${selectedAddress === address._id ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
              style={{ minHeight: responsiveValue(100, 120) }}
            >
              <TouchableOpacity
                className="absolute top-2 right-2 z-10"
                onPress={() => handleDeleteAddress(address._id)}
                disabled={addresses.length <= 1}
                style={{ opacity: addresses.length <= 1 ? 0.4 : 1 }}
              >
                <Trash2 size={responsiveValue(16, 18)} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedAddress(address._id)}
                className="flex-1"
                activeOpacity={0.8}
              >
                <View className="flex-row justify-between">
                  <Text 
                    className="font-semibold" 
                    style={{ fontSize: responsiveValue(14, 16) }}
                  >
                    {user ? user.name : ''}
                  </Text>
                </View>
                <Text style={{ fontSize: responsiveValue(13, 14) }}>
                  {address.street}, {address.city}
                </Text>
                <Text style={{ fontSize: responsiveValue(13, 14) }}>
                  {address.state}, {address.postalCode}
                </Text>
                <Text style={{ fontSize: responsiveValue(13, 14) }}>
                  {address.country}
                </Text>
                <Text 
                  className="text-xs text-gray-500 mt-1"
                  style={{ fontSize: responsiveValue(11, 12) }}
                >
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
            <Text 
              className="text-green-600 font-semibold"
              style={{ fontSize: responsiveValue(14, 16) }}
            >
              Add New Address
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text 
            className="text-lg font-semibold mb-2"
            style={{ fontSize: responsiveValue(16, 18) }}
          >
            Payment Method
          </Text>
          <TouchableOpacity
            className={`border p-4 rounded-lg flex-row justify-between items-center ${paymentMethod === 'Cash on Delivery' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            onPress={() => {
              setPaymentMethod('Cash on Delivery');
              setShowPaymentOptions(false);
              setPaymentModalVisible(false);
            }}
            style={{ minHeight: responsiveValue(60, 70) }}
          >
            <View className="flex-row items-center">
              <CreditCard size={responsiveValue(20, 24)} color="#6b7280" />
              <Text 
                className="ml-4"
                style={{ fontSize: responsiveValue(14, 16) }}
              >
                Cash on Delivery (COD)
              </Text>
            </View>
            {paymentMethod === 'Cash on Delivery' && <CheckCircle size={responsiveValue(18, 20)} color="#059669" />}
          </TouchableOpacity>
          <TouchableOpacity
            className={`border p-4 rounded-lg flex-row justify-between items-center mt-2 ${paymentMethod === 'Online Payment' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            onPress={() => {
              setPaymentMethod('Online Payment');
              setShowPaymentOptions(true);
              setPaymentModalVisible(true);
            }}
            style={{ minHeight: responsiveValue(60, 70) }}
          >
            <View className="flex-row items-center">
              <CreditCard size={responsiveValue(20, 24)} color="#6b7280" />
              <Text 
                className="ml-4"
                style={{ fontSize: responsiveValue(14, 16) }}
              >
                Online Payment
              </Text>
            </View>
            {paymentMethod === 'Online Payment' && <CheckCircle size={responsiveValue(18, 20)} color="#059669" />}
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-2">
            <Text 
              className="text-lg font-semibold"
              style={{ fontSize: responsiveValue(16, 18) }}
            >
              Order Summary
            </Text>
            {routeItems && (
              <View className="bg-green-100 px-2 py-1 rounded-full">
                <Text 
                  className="text-xs font-medium text-green-700"
                  style={{ fontSize: responsiveValue(10, 12) }}
                >
                  Buy Now
                </Text>
              </View>
            )}
          </View>
          {cart.items.map((item) => (
            <View 
              key={item.product?._id || item.product?.id || item.product} 
              className="flex-row justify-between items-center mb-2"
              style={{ minHeight: responsiveValue(30, 36) }}
            >
              <Text 
                className="flex-1"
                style={{ fontSize: responsiveValue(13, 15) }}
              >
                {item.product?.name || item.name} x{item.quantity}
              </Text>
              <Text style={{ fontSize: responsiveValue(13, 15) }}>
                ₹{(item.product?.price ? item.product.price * item.quantity : item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View className="border-t border-gray-200 mt-2 pt-2">
            <View className="flex-row justify-between items-center mb-1">
              <Text style={{ fontSize: responsiveValue(13, 15) }}>Subtotal</Text>
              <Text style={{ fontSize: responsiveValue(13, 15) }}>₹{cart.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-1">
              <Text style={{ fontSize: responsiveValue(13, 15) }}>GST (5%)</Text>
              <Text style={{ fontSize: responsiveValue(13, 15) }}>₹{cart.gst.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-1">
              <Text style={{ fontSize: responsiveValue(13, 15) }}>Shipping</Text>
              <Text style={{ fontSize: responsiveValue(13, 15) }}>₹{cart.shipping.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center font-bold">
              <Text 
                className="font-bold"
                style={{ fontSize: responsiveValue(14, 16) }}
              >
                Total
              </Text>
              <Text 
                className="font-bold"
                style={{ fontSize: responsiveValue(14, 16) }}
              >
                ₹{cart.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View 
        className="bg-white border-t border-gray-200 p-4"
        style={{ paddingHorizontal: responsiveValue(16, 24) }}
      >
        <TouchableOpacity
          onPress={paymentMethod === 'Online Payment' ? () => setPaymentModalVisible(true) : handlePlaceOrder}
          disabled={isPlacingOrder}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={["#10b981", "#059669"]}
            className="py-4 flex-row items-center justify-center rounded-xl"
          >
            <CheckCircle 
              width={responsiveValue(16, 18)} 
              height={responsiveValue(16, 18)} 
              color="#fff" 
            />
            <Text 
              className="text-white font-semibold text-sm ml-1.5"
              style={{ fontSize: responsiveValue(14, 16) }}
            >
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
        title="Payment Options"
        size="full"
        showCloseButton
        closeOnBackdropPress
        style="pb-0"
      >
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ 
            paddingHorizontal: responsiveValue(16, 24),
            paddingBottom: responsiveValue(100, 120)
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Summary */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <View className="flex-row justify-between items-center mb-2">
              <Text 
                className="text-gray-600"
                style={{ fontSize: responsiveValue(13, 15) }}
              >
                Total Amount
              </Text>
              <Text 
                className="text-gray-400 line-through"
                style={{ fontSize: responsiveValue(13, 15) }}
              >
                ₹{(cart.total + 19).toFixed(0)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text 
                className="text-2xl font-bold text-green-700"
                style={{ fontSize: responsiveValue(20, 24) }}
              >
                ₹{cart.total.toFixed(0)}
              </Text>
              <View className="bg-green-100 px-2 py-1 rounded-full">
                <Text 
                  className="text-green-700 text-xs font-medium"
                  style={{ fontSize: responsiveValue(10, 12) }}
                >
                  Save ₹19
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Error Display */}
          {paymentError && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text 
                className="text-red-700 text-sm"
                style={{ fontSize: responsiveValue(12, 14) }}
              >
                {paymentError}
              </Text>
            </View>
          )}

          {/* Offers Banner */}
          <TouchableOpacity 
            className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-200 flex-row justify-between items-center"
            onPress={() => {}}
          >
            <Text 
              className="text-amber-800 font-medium"
              style={{ fontSize: responsiveValue(13, 15) }}
            >
              Bank offers available
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={responsiveValue(16, 18)} 
              color="#d97706" 
            />
          </TouchableOpacity>

          {/* Payment Options */}
          <View className="space-y-3">
            {/* UPI */}
            <View className="bg-white rounded-xl p-3 border border-gray-200">
              <TouchableOpacity 
                className="flex-row justify-between items-center"
                onPress={() => setExpandedSection(expandedSection === 'upi' ? '' : 'upi')}
              >
                <View className="flex-row items-center">
                  <View className="bg-green-100 p-2 rounded-full mr-3">
                    <MaterialCommunityIcons 
                      name="bank" 
                      size={responsiveValue(16, 18)} 
                      color="#059669" 
                    />
                  </View>
                  <Text 
                    className="font-medium"
                    style={{ fontSize: responsiveValue(14, 16) }}
                  >
                    UPI Payment
                  </Text>
                </View>
                <Ionicons 
                  name={expandedSection === 'upi' ? 'chevron-up' : 'chevron-down'} 
                  size={responsiveValue(16, 18)} 
                  color="#6b7280" 
                />
              </TouchableOpacity>

              {expandedSection === 'upi' && (
                <View className="mt-3 space-y-2">
                  <PaymentOption 
                    icon={<FontAwesome5 name="google-pay" size={responsiveValue(18, 20)} color="#34A853" />}
                    title="Google Pay"
                    selected={selectedPayment === 'gpay'}
                    onPress={() => setSelectedPayment('gpay')}
                  />
                  <PaymentOption 
                    icon={<MaterialCommunityIcons name="phone" size={responsiveValue(18, 20)} color="#5F259F" />}
                    title="PhonePe"
                    selected={selectedPayment === 'phonepe'}
                    onPress={() => setSelectedPayment('phonepe')}
                  />
                  <PaymentOption 
                    icon={<MaterialCommunityIcons name="account-plus-outline" size={responsiveValue(18, 20)} color="#059669" />}
                    title="Enter UPI ID"
                    selected={selectedPayment === 'upi_id'}
                    onPress={() => setSelectedPayment('upi_id')}
                  />

                  {selectedPayment === 'upi_id' && (
                    <View className="mt-2 bg-gray-50 rounded-lg p-3">
                      <TextInput
                        value={customUpiId}
                        onChangeText={setCustomUpiId}
                        placeholder="yourname@upi"
                        className="border-b border-gray-200 pb-1"
                        autoCapitalize="none"
                        style={{ fontSize: responsiveValue(14, 16) }}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Wallet */}
            <View className="bg-white rounded-xl p-3 border border-gray-200">
              <TouchableOpacity 
                className="flex-row justify-between items-center"
                onPress={() => setExpandedSection(expandedSection === 'wallet' ? '' : 'wallet')}
              >
                <View className="flex-row items-center">
                  <View className="bg-purple-100 p-2 rounded-full mr-3">
                    <MaterialCommunityIcons 
                      name="wallet" 
                      size={responsiveValue(16, 18)} 
                      color="#7e22ce" 
                    />
                  </View>
                  <Text 
                    className="font-medium"
                    style={{ fontSize: responsiveValue(14, 16) }}
                  >
                    Wallet
                  </Text>
                </View>
                <Ionicons 
                  name={expandedSection === 'wallet' ? 'chevron-up' : 'chevron-down'} 
                  size={responsiveValue(16, 18)} 
                  color="#6b7280" 
                />
              </TouchableOpacity>

              {expandedSection === 'wallet' && (
                <View className="mt-3">
                  <PaymentOption 
                    icon={<MaterialCommunityIcons name="wallet-outline" size={responsiveValue(18, 20)} color="#7e22ce" />}
                    title="Wallet Balance"
                    selected={false}
                    disabled
                    comingSoon
                  />
                </View>
              )}
            </View>

            {/* Cards */}
            <View className="bg-white rounded-xl p-3 border border-gray-200">
              <TouchableOpacity 
                className="flex-row justify-between items-center"
                onPress={() => setExpandedSection(expandedSection === 'card' ? '' : 'card')}
              >
                <View className="flex-row items-center">
                  <View className="bg-blue-100 p-2 rounded-full mr-3">
                    <MaterialCommunityIcons 
                      name="credit-card-outline" 
                      size={responsiveValue(16, 18)} 
                      color="#1d4ed8" 
                    />
                  </View>
                  <Text 
                    className="font-medium"
                    style={{ fontSize: responsiveValue(14, 16) }}
                  >
                    Credit/Debit Card
                  </Text>
                </View>
                <Ionicons 
                  name={expandedSection === 'card' ? 'chevron-up' : 'chevron-down'} 
                  size={responsiveValue(16, 18)} 
                  color="#6b7280" 
                />
              </TouchableOpacity>

              {expandedSection === 'card' && (
                <View className="mt-3">
                  <PaymentOption 
                    icon={<MaterialCommunityIcons name="credit-card" size={responsiveValue(18, 20)} color="#1d4ed8" />}
                    title="Add Card"
                    selected={false}
                    disabled
                    comingSoon
                  />
                </View>
              )}
            </View>
          </View>

          {/* Security Note */}
          <View className="mt-4 flex-row items-center">
            <Ionicons 
              name="shield-checkmark" 
              size={responsiveValue(14, 16)} 
              color="#059669" 
            />
            <Text 
              className="text-gray-500 text-xs ml-1"
              style={{ fontSize: responsiveValue(11, 13) }}
            >
              Secure and encrypted payments
            </Text>
          </View>
        </ScrollView>

        {/* Payment Button */}
        <View 
          className="bg-white p-4 border-t border-gray-200"
          style={{ paddingHorizontal: responsiveValue(16, 24) }}
        >
          <TouchableOpacity
            className={`rounded-lg py-3 items-center ${isPaying || (selectedPayment === 'upi_id' && !customUpiId) ? 'bg-gray-300' : 'bg-green-600'}`}
            onPress={handlePayment}
            disabled={isPaying || (selectedPayment === 'upi_id' && !customUpiId)}
          >
            {isPaying ? (
              <ActivityIndicator color="#ffffff" size={responsiveValue('small', 'large')} />
            ) : (
              <Text 
                className="text-white font-bold"
                style={{ fontSize: responsiveValue(14, 16) }}
              >
                Pay ₹{cart.total.toFixed(0)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View 
          className="bg-white rounded-3xl p-8 items-center shadow-lg"
          style={{ 
            width: responsiveValue(280, 320),
            maxWidth: responsiveValue(300, 360)
          }}
        >
          <LottieView
            source={require('../../assets/Payment-Success.json')}
            autoPlay
            loop={false}
            style={{ 
              width: responsiveValue(120, 150),
              height: responsiveValue(120, 150)
            }}
            resizeMode="cover"
          />
          <Text 
            className="text-2xl font-bold text-green-600 mt-2 text-center"
            style={{ fontSize: responsiveValue(20, 24) }}
          >
            Order Placed!
          </Text>
          <Text 
            className="text-gray-700 mt-2 text-base text-center font-medium"
            style={{ fontSize: responsiveValue(14, 16) }}
          >
            Your order has been confirmed
          </Text>
          <View className="mt-4 w-full items-center">
            <Text 
              className="text-gray-500 text-sm text-center"
              style={{ fontSize: responsiveValue(12, 14) }}
            >
              Thank you for shopping with FarmFerry!
            </Text>
            {orderId && (
              <Text 
                className="text-gray-400 text-xs mt-2"
                style={{ fontSize: responsiveValue(10, 12) }}
              >
                Order ID: {orderId}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CheckoutScreen;