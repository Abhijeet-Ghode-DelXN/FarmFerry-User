import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart } from 'lucide-react-native';
import { ordersAPI } from '../services/api';
import { format } from 'date-fns';
import { getStatusColor, getStatusText } from '../utils/helpers';
import Button from '../components/ui/Button';
import { SCREEN_NAMES } from '../types';

const { width } = Dimensions.get('window');

// Remove static filterOptions
// const filterOptions = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderAgainLoadingId, setOrderAgainLoadingId] = useState(null);
  const [filterOptions, setFilterOptions] = useState(['All']);
  // Add order cancellation handler
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [returningOrderId, setReturningOrderId] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returningOrder, setReturningOrder] = useState(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = selectedFilter === 'All' ? {} : { status: selectedFilter.toLowerCase() };
      const response = await ordersAPI.getMyOrders(params);
      let fetchedOrders = [];
      if (response?.data?.data?.orders) {
        fetchedOrders = response.data.data.orders;
      } else if (response?.data?.data) {
        fetchedOrders = response.data.data;
      }
      setOrders(fetchedOrders);
      // Dynamically compute filter options from unique statuses
      const statuses = Array.from(new Set(fetchedOrders.map(o => getStatusText(o.status))));
      setFilterOptions(['All', ...statuses.filter(s => s && s !== 'All')]);
    } catch (error) {
      setOrders([]);
      setFilterOptions(['All']);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleOrderAgain = async (order) => {
    // console.log('Order Again clicked, order object:', order); // Debug log (optional to remove)
    // Check for required fields
    if (!order.items || order.items.length === 0 || !order.deliveryAddress || !order.paymentMethod) {
      Alert.alert('Error', 'Order is missing items, address, or payment method.');
      return;
    }
    setOrderAgainLoadingId(order._id);
    try {
      // Map payment method to backend enum if needed
      let paymentMethod = order.paymentMethod;
      if (paymentMethod === 'Cash on Delivery') paymentMethod = 'cash_on_delivery';
      else if (paymentMethod === 'Credit Card') paymentMethod = 'credit_card';
      else if (paymentMethod === 'Debit Card') paymentMethod = 'debit_card';
      else if (paymentMethod === 'UPI') paymentMethod = 'upi';
      else if (paymentMethod === 'Bank Transfer') paymentMethod = 'bank_transfer';
      // else assume already correct

      const orderData = {
        items: order.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          variation: item.variation || undefined,
        })),
        supplier: order.supplier?._id || order.supplier,
        paymentMethod,
        deliveryAddress: order.deliveryAddress, // <-- Use correct field
      };
      await ordersAPI.createOrder(orderData);
      Alert.alert('Success', 'Order placed again successfully!');
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to place order again.');
    } finally {
      setOrderAgainLoadingId(null);
    }
  };

  // Add order cancellation handler
  const handleCancelOrder = async (order) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setCancellingOrderId(order._id);
            try {
              await ordersAPI.updateOrderStatus(order._id, 'cancelled');
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
              fetchOrders();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order.');
            } finally {
              setCancellingOrderId(null);
            }
          },
        },
      ]
    );
  };

  const handleReturnOrder = async (order) => {
    Alert.alert(
      'Return Order',
      'Are you sure you want to return this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setReturningOrderId(order._id);
            try {
              await ordersAPI.returnOrder(order._id);
              Alert.alert('Order Returned', 'Your order return request has been placed.');
              fetchOrders();
            } catch (error) {
              Alert.alert('Error', 'Failed to return order.');
            } finally {
              setReturningOrderId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenReturnModal = (order) => {
    setReturningOrder(order);
    setReturnReason('');
    setReturnError('');
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    if (!returnReason.trim()) {
      setReturnError('Please enter a reason for return.');
      return;
    }
    setIsSubmittingReturn(true);
    setReturnError('');
    try {
      await ordersAPI.returnOrder(returningOrder._id, returnReason);
      setReturnSuccess(true);
      setShowReturnModal(false);
      setTimeout(() => setReturnSuccess(false), 2000);
      fetchOrders();
    } catch (err) {
      setReturnError(err?.response?.data?.message || 'Failed to request return.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Use helpers for status color/text
  const getStatusColorClass = (status) => {
    const color = getStatusColor(status, 'order');
    // Map color to Tailwind-like classes or fallback
    if (color === '#10b981') return 'bg-green-100 text-green-800';
    if (color === '#ef4444') return 'bg-red-100 text-red-800';
    if (color === '#3b82f6') return 'bg-blue-100 text-blue-800';
    if (color === '#8b5cf6') return 'bg-purple-100 text-purple-800';
    if (color === '#f59e0b') return 'bg-yellow-100 text-yellow-800';
    if (color === '#6b7280') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Dynamic filter
  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'All') return orders;
    return orders.filter(order => getStatusText(order.status) === selectedFilter);
  }, [orders, selectedFilter]);

  const renderFilterTab = (filter) => (
    <TouchableOpacity
      key={filter}
      onPress={() => setSelectedFilter(filter)}
      className={`px-4 py-2 mr-3 rounded-full ${selectedFilter === filter ? '' : 'bg-gray-200'}`}
      style={{
        backgroundColor: selectedFilter === filter ? '#10B981' : undefined,
      }}
    >
      <Text
        className="font-medium"
        style={{
          color: selectedFilter === filter ? 'white' : '#4b5563',
        }}
      >
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => {
    // Return eligibility: delivered and within 7 days
    let returnAvailable = false;
    let daysLeft = 0;
    if (item.status === 'delivered' && item.deliveredAt) {
      const daysSinceDelivery = (new Date() - new Date(item.deliveredAt)) / (1000 * 60 * 60 * 24);
      daysLeft = Math.max(0, 7 - Math.floor(daysSinceDelivery));
      returnAvailable = daysSinceDelivery <= 7;
    }
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
        className="bg-white mx-4 mb-4 rounded-3xl shadow-sm border border-gray-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="p-5">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                {/* Product Image or Cart Icon */}
                {item.items && item.items.length > 0 && item.items[0].product?.images && item.items[0].product.images.length > 0 && item.items[0].product.images[0].url ? (
                  <Image source={{ uri: item.items[0].product.images[0].url }} style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }} />
                ) : (
                  <Text className="text-3xl mr-3">🛒</Text>
                )}
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    {item.items && item.items.length > 0
                      ? item.items.map(i => i.product?.name || 'Product').join(', ')
                      : 'No Products'}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {item.items.length} item{item.items.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
            <View className={`px-3 py-1 rounded-full ${getStatusColorClass(item.status)}`}> {/* Dynamic color */}
              <View className="flex-row items-center">
                <Ionicons
                  name="ellipse"
                  size={14}
                  color={getStatusColor(item.status, 'order')}
                />
                <Text
                  className="ml-1 text-xs font-semibold"
                  style={{ color: getStatusColor(item.status, 'order') }}
                >
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>
          </View>
          {/* Return Availability Badge */}
          {item.status === 'delivered' && (
            <View style={{ marginBottom: 6 }}>
              <Text style={{
                backgroundColor: returnAvailable ? '#d1fae5' : '#e5e7eb',
                color: returnAvailable ? '#047857' : '#6b7280',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 3,
                fontWeight: 'bold',
                alignSelf: 'flex-start',
                fontSize: 13,
              }}>
                {returnAvailable
                  ? `Return Available (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left)`
                  : 'Return Not Available'}
              </Text>
            </View>
          )}
          {/* Replacement Status Badge */}
          {item.replacementStatus && (
            <View style={{ marginBottom: 6 }}>
              <Text style={{
                backgroundColor: '#fef3c7',
                color: '#b45309',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 3,
                fontWeight: 'bold',
                alignSelf: 'flex-start',
                fontSize: 13,
              }}>
                Replacement: {item.replacementStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          )}

          {/* Order Details - dynamic fields */}
          <View className="bg-gray-50 p-3 rounded-2xl mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-2">
                  {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : ''}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="pricetag-outline" size={16} color="#6b7280" />
                <Text className="text-sm text-gray-600 ml-2">₹{item.totalAmount?.toFixed(2) ?? '0.00'}</Text>
              </View>
            </View>
            {/* Render address if present */}
            {item.address && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="location-outline" size={16} color="#6b7280" />
                <Text className="text-xs text-gray-500 ml-2 flex-1">{item.address?.addressLine1 || item.address}</Text>
              </View>
            )}
            {/* Render payment method if present */}
            {item.paymentMethod && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="card-outline" size={16} color="#6b7280" />
                <Text className="text-xs text-gray-500 ml-2 flex-1">{item.paymentMethod}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View className="flex-row justify-between items-center mb-0">
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-gray-800">₹{item.totalAmount?.toFixed(2) ?? '0.00'}</Text>
              <Text className="text-sm text-gray-500 ml-2">Total</Text>
            </View>
          </View>
          {/* Buttons on the same line, visually balanced */}
          <View style={styles.actionRow}>
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
                className="overflow-hidden rounded-xl"
                style={styles.actionButtonGreen}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" style={{ marginLeft: 4 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                onPress={() => handleOrderAgain(item)}
                disabled={orderAgainLoadingId === item._id}
                className="overflow-hidden rounded-xl"
                style={[styles.actionButtonGreen, orderAgainLoadingId === item._id && { opacity: 0.7 }]}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.actionButtonGradient}
                >
                  <ShoppingCart size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>
                    {orderAgainLoadingId === item._id ? 'Ordering...' : 'Order Again'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {(item.status === 'pending' || item.status === 'processing') && (
              <View style={styles.cancelButtonContainer}>
                <TouchableOpacity
                  onPress={() => handleCancelOrder(item)}
                  disabled={cancellingOrderId === item._id}
                  style={{ alignItems: 'center', justifyContent: 'center', height: 40, width: 44, opacity: cancellingOrderId === item._id ? 0.7 : 1, borderRadius: 22 }}
                >
                  <Ionicons name="close-circle" size={28} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
            {/* Return Order icon for delivered orders */}
            {item.status === 'delivered' && (
              <View style={styles.cancelButtonContainer}>
                <TouchableOpacity
                  onPress={() => returnAvailable ? handleOpenReturnModal(item) : null}
                  disabled={!returnAvailable}
                  style={{ alignItems: 'center', justifyContent: 'center', height: 40, width: 44, opacity: returnAvailable ? 1 : 0.5, borderRadius: 22 }}
                >
                  <Ionicons name="return-down-back" size={28} color={returnAvailable ? "#6366f1" : "#9ca3af"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Text className="text-6xl mb-4">🛒</Text>
      <Text className="text-xl font-bold text-gray-800 mb-2">No Orders Yet</Text>
      <Text className="text-gray-500 text-center mb-6">
        {selectedFilter === 'All'
          ? 'Start exploring delicious restaurants and place your first order!'
          : `No ${selectedFilter.toLowerCase()} orders found`}
      </Text>
      {/* <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-3 rounded-full flex-row items-center justify-center mb-4"
      >
        <Text className="text-white font-semibold">Start Ordering</Text>
      </LinearGradient> */}
      {/* <Button
        title="Add New Address"
        onPress={() => navigation.navigate(SCREEN_NAMES.ADD_ADDRESS)}
        fullWidth
        size="large"
        style={{ marginTop: 12 }}
      /> */}
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      {/* Header */}
      <View className="bg-white px-4 py-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-4 p-2 rounded-full bg-gray-100"
            >
              <Ionicons name="arrow-back" size={24} color="#10B981" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-800">My Orders</Text>
          </View>
          {/* <TouchableOpacity className="p-2 rounded-full bg-gray-100">
            <Ionicons name="search" size={24} color="#10B981" />
          </TouchableOpacity> */}
        </View>
        {/* Filter Tabs - dynamic */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {filterOptions.map(renderFilterTab)}
        </ScrollView>
        {/* Add New Address Button (always visible) */}
        {/* <Button
          title="Add New Address"
          onPress={() => navigation.navigate('AddAddress')}
          fullWidth
          size="large"
          style={{ marginTop: 16 }}
        /> */}
      </View>
      {/* Orders List */}
      <View className="flex-1">
        {filteredOrders.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item._id}
            renderItem={renderOrderItem}
            contentContainerStyle={{ paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#10B981']}
                tintColor="#10B981"
              />
            }
          />
        )}
      </View>
      {/* Quick Actions: Only Support button remains */}
      {/* Support button removed as requested */}
      {/* Return Modal */}
      <Modal
        visible={showReturnModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReturnModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 350 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Return Reason</Text>
            <TextInput
              value={returnReason}
              onChangeText={setReturnReason}
              placeholder="Enter reason for return"
              style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, marginBottom: 12, minHeight: 60 }}
              multiline
            />
            {returnError ? <Text style={{ color: '#dc2626', marginBottom: 8 }}>{returnError}</Text> : null}
            <Button
              title={isSubmittingReturn ? 'Submitting...' : 'Submit Return Request'}
              onPress={handleSubmitReturn}
              loading={isSubmittingReturn}
              disabled={isSubmittingReturn}
              fullWidth
            />
            <Button
              title="Cancel"
              onPress={() => setShowReturnModal(false)}
              variant="ghost"
              style={{ marginTop: 8 }}
              fullWidth
            />
          </View>
        </View>
      </Modal>
      {returnSuccess && (
        <View style={{ position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
          <View style={{ backgroundColor: '#d1fae5', borderRadius: 12, padding: 12 }}>
            <Text style={{ color: '#047857', fontWeight: 'bold' }}>Return request submitted!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 2,
    gap: 8, // for RN 0.71+, otherwise use marginRight on containers
  },
  actionButtonContainer: {
    flex: 1,
    minWidth: 110,
    maxWidth: 170,
    marginHorizontal: 2,
  },
  cancelButtonContainer: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 0,
    minHeight: 40,
  },
  actionButtonGreen: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonRed: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
    marginRight: 2,
  },
});

