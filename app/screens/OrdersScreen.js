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
    // Check for required fields
    if (!order.items || order.items.length === 0 || !order.address || !order.paymentMethod) {
      Alert.alert('Error', 'Order is missing items, address, or payment method.');
      return;
    }
    setOrderAgainLoadingId(order._id);
    try {
      const orderData = {
        items: order.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          variation: item.variation || undefined,
        })),
        supplier: order.supplier?._id || order.supplier,
        paymentMethod: order.paymentMethod,
        address: order.address,
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

  const renderOrderItem = ({ item }) => (
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
              <Text className="text-3xl mr-3">🛒</Text>
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
        {/* Buttons on the same line, at opposite ends */}
        <View className="flex-row mt-4 justify-between items-center">
          <TouchableOpacity
            onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
            className="overflow-hidden rounded-xl"
            style={{
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              className="py-2.5 px-5 flex-row items-center justify-center"
            >
              <Text className="text-white font-semibold text-sm mr-1.5">View Details</Text>
              <Ionicons name="arrow-forward" size={14} color="white" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleOrderAgain(item)}
            disabled={orderAgainLoadingId === item._id}
            className="overflow-hidden rounded-xl"
            style={{
              opacity: orderAgainLoadingId === item._id ? 0.7 : 1,
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              className="py-2.5 px-5 flex-row items-center justify-center"
            >
              <ShoppingCart size={20} color="#ffffff" />
              <Text className="text-white font-semibold text-base ml-2">
                {orderAgainLoadingId === item._id ? 'Ordering...' : 'Order Again'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    </SafeAreaView>
  );
}

