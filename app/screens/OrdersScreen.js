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
import { ShoppingCart, RotateCcw, FileText, X } from 'lucide-react-native';
import { ordersAPI } from '../services/api';
import { format } from 'date-fns';
import { getStatusColor, getStatusText } from '../utils/helpers';
import Button from '../components/ui/Button';
import { SCREEN_NAMES } from '../types';
import { CONFIG } from '../constants/config';
import InvoiceService from '../services/invoiceService';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function OrdersScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderAgainLoadingId, setOrderAgainLoadingId] = useState(null);
  const [filterOptions, setFilterOptions] = useState(['All']);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [returningOrderId, setReturningOrderId] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returningOrder, setReturningOrder] = useState(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState(null);

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
  }, [selectedFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleOrderAgain = async (order) => {
    if (!order.items || order.items.length === 0 || !order.deliveryAddress || !order.paymentMethod) {
      Alert.alert('Error', 'Order is missing items, address, or payment method.');
      return;
    }
    setOrderAgainLoadingId(order._id);
    try {
      let paymentMethod = order.paymentMethod;
      if (paymentMethod === 'Cash on Delivery') paymentMethod = 'cash_on_delivery';
      else if (paymentMethod === 'Credit Card') paymentMethod = 'credit_card';
      else if (paymentMethod === 'Debit Card') paymentMethod = 'debit_card';
      else if (paymentMethod === 'UPI') paymentMethod = 'upi';
      else if (paymentMethod === 'Bank Transfer') paymentMethod = 'bank_transfer';

      const orderData = {
        items: order.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          variation: item.variation || undefined,
        })),
        supplier: order.supplier?._id || order.supplier,
        paymentMethod,
        deliveryAddress: order.deliveryAddress,
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
    setReturningOrderId(returningOrder._id);
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
      setReturningOrderId(null);
    }
  };

  const handleGenerateInvoice = async (order) => {
    setGeneratingInvoiceId(order._id);
    try {
      const orderResponse = await ordersAPI.getOrderDetails(order._id);
      let orderDetails;
      if (orderResponse.data.data.order) {
        orderDetails = orderResponse.data.data.order;
      } else if (orderResponse.data.data) {
        orderDetails = orderResponse.data.data;
      } else {
        orderDetails = orderResponse.data;
      }

      let finalOrderData = orderDetails;
      let finalCustomerData = orderDetails.customer;
      let finalSupplierData = orderDetails.supplier;

      if (!orderDetails.orderId && !orderDetails._id) {
        finalOrderData = order;
        finalCustomerData = order.customer;
        finalSupplierData = order.supplier;
      }

      if (!finalCustomerData || !finalCustomerData.firstName) {
        if (user) {
          finalCustomerData = {
            firstName: user.firstName || 'Customer',
            lastName: user.lastName || 'Name',
            email: user.email || 'customer@example.com',
            phone: user.phone || 'N/A'
          };
        } else {
          finalCustomerData = {
            firstName: 'Customer',
            lastName: 'Name',
            email: 'customer@example.com',
            phone: 'N/A'
          };
        }
      }

      const pdfUri = await InvoiceService.generateInvoicePDF(
        finalOrderData,
        finalCustomerData,
        finalSupplierData
      );

      Alert.alert(
        'Invoice Generated Successfully! 📄',
        'Your invoice has been created. What would you like to do with it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Invoice',
            onPress: async () => {
              try {
                const shared = await InvoiceService.shareInvoice(pdfUri, order.orderId);
                if (!shared) {
                  Alert.alert(
                    'Sharing Not Available',
                    'Sharing is not available on this device. The invoice has been generated successfully.'
                  );
                }
              } catch (error) {
                console.error('Error sharing invoice:', error);
                Alert.alert('Error', 'Failed to share invoice. Please try again.');
              }
            }
          },
          {
            text: 'Save to Device',
            onPress: async () => {
              try {
                const savedPath = await InvoiceService.saveInvoiceToDevice(pdfUri, order.orderId);
                Alert.alert(
                  'Invoice Saved!',
                  `Invoice has been saved to your device.\nPath: ${savedPath}`,
                  [{ text: 'OK', style: 'default' }]
                );
              } catch (error) {
                console.error('Error saving invoice:', error);
                Alert.alert('Error', 'Failed to save invoice to device. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Invoice generation error:', error);
      Alert.alert(
        'Invoice Generation Failed',
        'Unable to generate invoice at this time. Please try again later.'
      );
    } finally {
      setGeneratingInvoiceId(null);
    }
  };

  const getStatusColorClass = (status) => {
    const color = getStatusColor(status, 'order');
    if (color === '#10b981') return 'bg-green-100 text-green-800';
    if (color === '#ef4444') return 'bg-red-100 text-red-800';
    if (color === '#3b82f6') return 'bg-blue-100 text-blue-800';
    if (color === '#8b5cf6') return 'bg-purple-100 text-purple-800';
    if (color === '#f59e0b') return 'bg-yellow-100 text-yellow-800';
    if (color === '#6b7280') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'All') return orders;
    return orders.filter(order => getStatusText(order.status) === selectedFilter);
  }, [orders, selectedFilter]);

  const renderFilterTab = (filter) => (
    <TouchableOpacity
      key={filter}
      onPress={() => setSelectedFilter(filter)}
      className={`px-4 py-2 mr-3 rounded-full ${selectedFilter === filter ? 'bg-emerald-500' : 'bg-gray-200'}`}
    >
      <Text className={`font-medium ${selectedFilter === filter ? 'text-white' : 'text-gray-600'}`}>
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => {
    let returnAvailable = false;
    let daysLeft = 0;
    // Only allow returns for delivered orders that are not already returned
    if (item.status === 'delivered' && item.status !== 'returned' && item.deliveredAt) {
      const daysSinceDelivery = (new Date() - new Date(item.deliveredAt)) / (1000 * 60 * 60 * 24);
      daysLeft = Math.max(0, 7 - Math.floor(daysSinceDelivery));
      returnAvailable = daysSinceDelivery <= 7;
    }

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
        className="bg-white mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 flex-row items-center">
              {item.items && item.items.length > 0 && item.items[0].product?.images && item.items[0].product.images.length > 0 && item.items[0].product.images[0].url ? (
                <Image
                  source={{ uri: item.items[0].product.images[0].url }}
                  className="w-10 h-10 rounded-lg mr-3"
                />
              ) : (
                <View className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center mr-3">
                  <ShoppingCart size={20} color="#6b7280" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
                  {item.items && item.items.length > 0
                    ? item.items.map(i => i.product?.name || 'Product').join(', ')
                    : 'No Products'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {item.items.length} item{item.items.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View className={`px-2 py-1 rounded-full ${getStatusColorClass(item.status)}`}>
              <View className="flex-row items-center">
                <Ionicons
                  name="ellipse"
                  size={10}
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

          {/* Status Badges */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {item.status === 'delivered' && (
              <View className={`px-2 py-1 rounded-md ${returnAvailable ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Text className={`text-xs font-medium ${returnAvailable ? 'text-green-800' : 'text-gray-500'}`}>
                  {returnAvailable
                    ? `🔄 Return Available (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left)`
                    : '❌ Return Window Expired'}
                </Text>
              </View>
            )}
            {item.status === 'returned' && (
              <View className="px-2 py-1 rounded-md bg-red-100">
                <Text className="text-xs font-medium text-red-800">
                  Returned{item.returnReason ? `: ${item.returnReason}` : ''}
                </Text>
              </View>
            )}
            {item.replacementStatus && (
              <View className="px-2 py-1 rounded-md bg-amber-100">
                <Text className="text-xs font-medium text-amber-800">
                  Replacement: {item.replacementStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
            )}
          </View>

          {/* Order Details */}
          <View className="bg-gray-50 p-3 rounded-xl mb-3">
            <View className="flex-row justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                <Text className="text-xs text-gray-600 ml-2">
                  {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : ''}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="pricetag-outline" size={14} color="#6b7280" />
                <Text className="text-xs text-gray-600 ml-2">₹{item.totalAmount?.toFixed(2) ?? '0.00'}</Text>
              </View>
            </View>
            {item.address && (
              <View className="flex-row items-start mt-1">
                <Ionicons name="location-outline" size={14} color="#6b7280" style={{ marginTop: 2 }} />
                <Text className="text-xs text-gray-500 ml-2 flex-1" numberOfLines={2}>
                  {item.address?.addressLine1 || item.address}
                </Text>
              </View>
            )}
            {item.paymentMethod && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="card-outline" size={14} color="#6b7280" />
                <Text className="text-xs text-gray-500 ml-2 flex-1" numberOfLines={1}>
                  {item.paymentMethod}
                </Text>
              </View>
            )}
          </View>

          {/* Total Amount */}
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm text-gray-600">Total Amount:</Text>
            <Text className="text-lg font-bold text-gray-800">₹{item.totalAmount?.toFixed(2) ?? '0.00'}</Text>
          </View>

          {/* Action Buttons - All in one row */}
          <View className="flex-row justify-between items-center mt-3">
            {/* View Details Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
              className="flex-1 mr-1 rounded-lg overflow-hidden"
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                className="py-2 px-2 items-center justify-center flex-row"
              >
                <Ionicons name="eye-outline" size={16} color="white" />
                <Text className="text-white font-medium text-xs ml-2">Order Details</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Order Again Button - Only for delivered */}
            {item.status === 'delivered' && (
              <TouchableOpacity
                onPress={() => handleOrderAgain(item)}
                disabled={orderAgainLoadingId === item._id}
                className="flex-1 mx-1 rounded-lg overflow-hidden"
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  className="py-2 px-2 items-center justify-center flex-row"
                >
                  {orderAgainLoadingId === item._id ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="repeat-outline" size={16} color="white" />
                      <Text className="text-white font-medium text-xs ml-2">Order Again</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Cancel Button - Only for pending/processing */}
            {(item.status === 'pending' || item.status === 'processing') && (
              <TouchableOpacity
                onPress={() => handleCancelOrder(item)}
                disabled={cancellingOrderId === item._id}
                className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mx-1"
              >
                {cancellingOrderId === item._id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <X size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            )}

            {/* Return Button - Only for delivered orders that are eligible for return */}
            {item.status === 'delivered' && returnAvailable && (
              <TouchableOpacity
                onPress={() => handleOpenReturnModal(item)}
                disabled={returningOrderId === item._id}
                className={`w-8 h-8 rounded-full bg-blue-100 items-center justify-center mx-1`}
              >
                {returningOrderId === item._id ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <RotateCcw size={16} color="#3b82f6" />
                )}
              </TouchableOpacity>
            )}

            {/* Invoice Button - Only for delivered */}
            {item.status === 'delivered' && (
              <TouchableOpacity
                onPress={() => handleGenerateInvoice(item)}
                disabled={generatingInvoiceId === item._id}
                className={`w-8 h-8 rounded-full ${generatingInvoiceId === item._id ? 'bg-gray-100' : 'bg-gray-200'} items-center justify-center ml-1`}
              >
                {generatingInvoiceId === item._id ? (
                  <ActivityIndicator size="small" color="#e5e7eb" />
                ) : (
                  <FileText size={16} color="green" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
        <ShoppingCart size={40} color="#9ca3af" />
      </View>
      <Text className="text-xl font-bold text-gray-800 mb-2">No Orders Yet</Text>
      <Text className="text-gray-500 text-center mb-6">
        {selectedFilter === 'All'
          ? 'Start exploring our products and place your first order!'
          : `No ${selectedFilter.toLowerCase()} orders found`}
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate(SCREEN_NAMES.HOME)}
        className="bg-emerald-500 px-6 py-3 rounded-full"
      >
        <Text className="text-white font-medium">Browse Products</Text>
      </TouchableOpacity>
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
      <View className="bg-white px-4 pt-5 pb-3 shadow-sm">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-3 p-1.5 rounded-full bg-gray-100"
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={20} color="#10B981" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">My Orders</Text>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="py-1"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {filterOptions.map(renderFilterTab)}
        </ScrollView>
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
            contentContainerStyle={{ paddingVertical: 16 }}
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

      {/* Return Modal */}
      <Modal
        visible={showReturnModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReturnModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold">Return Order</Text>
              <TouchableOpacity
                onPress={() => setShowReturnModal(false)}
                className="p-1"
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {returningOrder && (
              <View className="bg-gray-50 p-3 rounded-lg mb-4">
                <Text className="text-sm font-medium text-gray-800 mb-1">
                  Order #{returningOrder.orderId || returningOrder._id}
                </Text>
                <Text className="text-xs text-gray-600">
                  {returningOrder.items?.length || 0} item{(returningOrder.items?.length || 0) > 1 ? 's' : ''} • ₹{returningOrder.totalAmount?.toFixed(2) || '0.00'}
                </Text>
              </View>
            )}
            
            <Text className="text-sm font-medium text-gray-700 mb-2">Return Reason *</Text>
            <TextInput
              value={returnReason}
              onChangeText={setReturnReason}
              placeholder="Please provide a detailed reason for your return request..."
              placeholderTextColor="#9ca3af"
              className="border border-gray-200 rounded-lg p-3 h-24 text-gray-800"
              multiline
              textAlignVertical="top"
            />
            {returnError && <Text className="text-red-500 text-sm mt-2">{returnError}</Text>}
            <View className="mt-4">
              <Button
                title={isSubmittingReturn ? 'Submitting Return Request...' : 'Submit Return Request'}
                onPress={handleSubmitReturn}
                loading={isSubmittingReturn}
                disabled={isSubmittingReturn || !returnReason.trim()}
                fullWidth
              />
              <Button
                title="Cancel"
                onPress={() => setShowReturnModal(false)}
                variant="ghost"
                className="mt-2"
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Return Success Toast */}
      {returnSuccess && (
        <View className="absolute top-20 left-0 right-0 items-center z-10">
          <View className="bg-green-100 px-4 py-2 rounded-lg">
            <Text className="text-green-800 font-medium">Return request submitted successfully!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});