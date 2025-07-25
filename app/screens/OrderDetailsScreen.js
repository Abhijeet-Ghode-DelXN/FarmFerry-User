import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ordersAPI } from '../services/api';
import { advancedDeliveryAPI } from '../services/api';
import { formatDateTime } from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Image as RNImage } from 'react-native';

export default function OrderDetailsScreen() {
  const route = useRoute();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementReason, setReplacementReason] = useState('');
  const [replacementDescription, setReplacementDescription] = useState('');
  const [replacementPriority, setReplacementPriority] = useState('normal');
  const [isRequestingReplacement, setIsRequestingReplacement] = useState(false);
  const [replacementSuccess, setReplacementSuccess] = useState(false);
  const [replacementError, setReplacementError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrError, setQrError] = useState('');

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching order details for orderId:', orderId);
      const response = await ordersAPI.getOrderDetails(orderId);
      console.log('Order details API response:', response?.data);
      if (response?.data?.data?.order) {
        setOrder(response.data.data.order);
      } else {
        setError('Order not found.');
      }
    } catch (err) {
      console.log('Order details fetch error:', err);
      setError('Failed to fetch order details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    console.log('OrderDetailsScreen: orderId param:', orderId);
    if (orderId) fetchOrder();
    else setError('No order ID provided.');
  }, [orderId, fetchOrder]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrder();
  }, [fetchOrder]);

  // Helper: check if replacement is allowed (delivered and within 7 days)
  const isReplacementAllowed = order && order.status === 'delivered' && order.deliveredAt &&
    (new Date() - new Date(order.deliveredAt)) / (1000 * 60 * 60 * 24) <= 7;

  // Helper: check if delivery verification is needed (delivered, not verified)
  const isDeliveryVerificationNeeded = order && order.status === 'delivered' && !order.deliveryVerified;

  const handleRequestReplacement = async () => {
    if (!replacementReason) {
      setReplacementError('Please select a reason.');
      return;
    }
    setIsRequestingReplacement(true);
    setReplacementError('');
    try {
      await advancedDeliveryAPI.requestReplacement(order._id, {
        reason: replacementReason,
        description: replacementDescription,
        priority: replacementPriority,
      });
      setReplacementSuccess(true);
      setShowReplacementModal(false);
      setTimeout(() => setReplacementSuccess(false), 2000);
      fetchOrder();
    } catch (err) {
      setReplacementError(err?.response?.data?.message || 'Failed to request replacement.');
    } finally {
      setIsRequestingReplacement(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
      await advancedDeliveryAPI.verifyDeliveryOTP(order._id, { otp: otpValue });
      setOtpSuccess(true);
      setShowOtpModal(false);
      setTimeout(() => setOtpSuccess(false), 2000);
      fetchOrder();
    } catch (err) {
      setOtpError(err?.response?.data?.message || 'Failed to verify OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleShowQr = async () => {
    setIsLoadingQr(true);
    setQrError('');
    try {
      const res = await advancedDeliveryAPI.getDeliveryQRCode(order._id);
      setQrCodeUrl(res.data?.qrCode || res.data?.qrCodeDataURL || '');
      setShowQrModal(true);
    } catch (err) {
      setQrError(err?.response?.data?.message || 'Failed to load QR code.');
    } finally {
      setIsLoadingQr(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-xl font-bold text-red-600 mb-2">{error}</Text>
        <Button title="Retry" onPress={fetchOrder} color="#10B981" />
      </View>
    );
  }

  if (!order) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#10B981"]} />}
    >
      {/* Back Button */}
      {/* <View className="flex-row items-center mt-4 mb-2 px-2">
        <Ionicons name="arrow-back" size={26} color="#10B981" style={{ marginRight: 8 }} onPress={() => route.params?.navigation?.goBack?.()} />
        <Text className="text-xl font-bold text-gray-800">Order Details</Text>
      </View> */}
      {/* Order Summary Card with gradient */}
      <View style={{ borderRadius: 24, overflow: 'hidden', marginHorizontal: 8, marginBottom: 16, marginTop: 4, shadowColor: '#059669', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
        <View style={{ backgroundColor: '#f0fdf4', padding: 20 }}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xl font-bold text-gray-800">
              Order #{(order.orderId || order._id || order.id || '').toString().slice(-6)}
            </Text>
            {/* Status Badge */}
            <View style={{
              backgroundColor: order.status === 'delivered' ? '#10b981' : order.status === 'pending' ? '#f59e0b' : order.status === 'cancelled' ? '#ef4444' : '#3b82f6',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{order.status?.toUpperCase()}</Text>
            </View>
          </View>
          {/* Express Delivery Badge */}
          {order.isExpressDelivery && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="flash" size={16} color="#f59e0b" />
              <Text className="ml-2 text-yellow-600 font-semibold text-xs">Express Delivery</Text>
            </View>
          )}
          {order.createdAt && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text className="text-gray-500 ml-2">{formatDateTime(order.createdAt)}</Text>
            </View>
          )}
          {order.paymentMethod && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="card-outline" size={16} color="#6b7280" />
              <Text className="text-gray-500 ml-2">{order.paymentMethod}</Text>
            </View>
          )}
          {order.supplier && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="business-outline" size={16} color="#6b7280" />
              <Text className="text-gray-500 ml-2">{order.supplier.businessName || order.supplier.name || order.supplier.email || ''}</Text>
            </View>
          )}
          {order.deliveryAddress && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text className="text-gray-500 ml-2">
                {order.deliveryAddress.addressLine1 
                  || [order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.postalCode, order.deliveryAddress.country]
                      .filter(Boolean)
                      .join(', ')
                  || ''}
              </Text>
            </View>
          )}
          {order.customer && (
            <View className="flex-row items-center mb-1">
              <Ionicons name="person-outline" size={16} color="#6b7280" />
              <Text className="text-gray-500 ml-2">{order.customer.firstName ? `${order.customer.firstName} ${order.customer.lastName}` : order.customer.email || order.customer.phone || ''}</Text>
            </View>
          )}
          {/* Order Notes */}
          {order.notes && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="document-text-outline" size={16} color="#10b981" />
              <Text className="ml-2 text-green-700 italic">{order.notes}</Text>
            </View>
          )}
        </View>
      </View>
      {/* Divider */}
      <View className="h-0.5 bg-gray-200 mx-6 mb-4 rounded-full" />
      {/* Items Section */}
      <Text className="text-lg font-bold text-gray-800 mb-2 px-4">Order Items</Text>
      {order.items && order.items.length > 0 ? (
        <View className="px-2">
          {order.items.map((item, index) => (
            <View
              key={index}
              className="flex-row bg-white p-4 mb-3 rounded-2xl items-center border border-gray-100"
              style={{ shadowColor: '#059669', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
            >
              {item.product?.images && item.product.images.length > 0 && item.product.images[0].url ? (
                <Image source={{ uri: item.product.images[0].url }} className="w-16 h-16 mr-4 rounded-xl" resizeMode="cover" />
              ) : (
                <View className="w-16 h-16 mr-4 bg-gray-200 rounded-xl items-center justify-center">
                  <Text>🛒</Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 text-base mb-1">{item.product?.name || 'Product'}</Text>
                <Text className="text-sm text-gray-500 mb-1">Qty: {item.quantity || item.qty}</Text>
                <Text className="text-sm text-gray-700 font-semibold">₹{item.price}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-gray-500 px-4">No items in this order.</Text>
      )}
      {/* Total Section */}
      <View className="mt-6 mx-2 mb-8 bg-green-50 rounded-2xl p-5 flex-row items-center justify-between border border-green-200">
        <Text className="text-lg font-bold text-green-700">Total</Text>
        <Text className="text-2xl font-extrabold text-green-700">₹{order.totalAmount || order.total}</Text>
      </View>
      {/* Replacement Button (if allowed) */}
      {isReplacementAllowed && (
        <View className="mx-4 mb-4">
          <Button
            title="Request Replacement"
            onPress={() => setShowReplacementModal(true)}
            variant="outline"
            size="large"
            fullWidth
          />
        </View>
      )}
      {/* Delivery Verification (OTP/QR) Buttons */}
      {isDeliveryVerificationNeeded && (
        <View className="mx-4 mb-4 flex-row justify-between">
          <Button
            title="Verify Delivery (OTP)"
            onPress={() => setShowOtpModal(true)}
            variant="primary"
            size="large"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title={isLoadingQr ? 'Loading QR...' : 'Show Delivery QR Code'}
            onPress={handleShowQr}
            variant="outline"
            size="large"
            style={{ flex: 1 }}
            disabled={isLoadingQr}
          />
        </View>
      )}
      {/* Replacement Modal */}
      <Modal
        visible={showReplacementModal}
        onClose={() => setShowReplacementModal(false)}
        title="Request Replacement"
        size="medium"
      >
        <View>
          <Text className="mb-2 font-semibold">Reason</Text>
          <View className="mb-3">
            <Button title="Damaged product" onPress={() => setReplacementReason('damaged_product')} variant={replacementReason==='damaged_product'?'primary':'outline'} size="small" style={{marginBottom:4}} />
            <Button title="Wrong product" onPress={() => setReplacementReason('wrong_product')} variant={replacementReason==='wrong_product'?'primary':'outline'} size="small" style={{marginBottom:4}} />
            <Button title="Expired product" onPress={() => setReplacementReason('expired_product')} variant={replacementReason==='expired_product'?'primary':'outline'} size="small" style={{marginBottom:4}} />
            <Button title="Missing items" onPress={() => setReplacementReason('missing_items')} variant={replacementReason==='missing_items'?'primary':'outline'} size="small" style={{marginBottom:4}} />
            <Button title="Quality issues" onPress={() => setReplacementReason('quality_issues')} variant={replacementReason==='quality_issues'?'primary':'outline'} size="small" style={{marginBottom:4}} />
            <Button title="Other" onPress={() => setReplacementReason('other')} variant={replacementReason==='other'?'primary':'outline'} size="small" />
          </View>
          <Text className="mb-2 font-semibold">Description (optional)</Text>
          <View className="mb-3">
            <TextInput
              value={replacementDescription}
              onChangeText={setReplacementDescription}
              placeholder="Describe the issue (optional)"
              className="border border-gray-200 rounded-lg p-2 mb-2"
              multiline
              numberOfLines={3}
            />
          </View>
          <Text className="mb-2 font-semibold">Priority</Text>
          <View className="mb-3 flex-row">
            <Button title="Normal" onPress={() => setReplacementPriority('normal')} variant={replacementPriority==='normal'?'primary':'outline'} size="small" style={{marginRight:8}} />
            <Button title="High" onPress={() => setReplacementPriority('high')} variant={replacementPriority==='high'?'primary':'outline'} size="small" />
          </View>
          {replacementError ? <Text className="text-red-600 mb-2">{replacementError}</Text> : null}
          <Button
            title={isRequestingReplacement ? 'Requesting...' : 'Submit Replacement Request'}
            onPress={handleRequestReplacement}
            loading={isRequestingReplacement}
            disabled={isRequestingReplacement}
            fullWidth
          />
        </View>
      </Modal>
      {replacementSuccess && (
        <View className="mx-4 mb-4 bg-green-100 rounded-xl p-3 items-center">
          <Text className="text-green-700 font-semibold">Replacement request submitted!</Text>
        </View>
      )}
      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Verify Delivery (OTP)"
        size="medium"
      >
        <View>
          <Text className="mb-2 font-semibold">Enter the 6-digit OTP sent to your phone/email</Text>
          <TextInput
            value={otpValue}
            onChangeText={setOtpValue}
            placeholder="Enter OTP"
            keyboardType="number-pad"
            maxLength={6}
            className="border border-gray-200 rounded-lg p-2 mb-2 text-center tracking-widest"
          />
          {otpError ? <Text className="text-red-600 mb-2">{otpError}</Text> : null}
          <Button
            title={isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
            onPress={handleVerifyOtp}
            loading={isVerifyingOtp}
            disabled={isVerifyingOtp}
            fullWidth
          />
        </View>
      </Modal>
      {otpSuccess && (
        <View className="mx-4 mb-4 bg-green-100 rounded-xl p-3 items-center">
          <Text className="text-green-700 font-semibold">Delivery verified successfully!</Text>
        </View>
      )}
      {/* QR Code Modal */}
      <Modal
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Delivery QR Code"
        size="medium"
      >
        <View className="items-center justify-center p-4">
          {qrCodeUrl ? (
            <RNImage source={{ uri: qrCodeUrl }} style={{ width: 200, height: 200 }} resizeMode="contain" />
          ) : qrError ? (
            <Text className="text-red-600">{qrError}</Text>
          ) : (
            <ActivityIndicator size="large" color="#10B981" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}
