import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated
} from 'react-native';
import { ArrowLeft, Star, Edit, Trash2, MessageCircle, PlusCircle, CheckCircle, Clock } from 'lucide-react-native';
import { reviewsAPI } from '../services/api';
import { productsAPI } from '../services/api';
import { useAppContext } from '../context/AppContext';

const EMPTY_ILLUSTRATION = 'https://cdn-icons-png.flaticon.com/512/4076/4076549.png';

const MyReviewsScreen = ({ navigation }) => {
  const [reviews, setReviews] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productLoadingId, setProductLoadingId] = useState(null);
  const { user } = useAppContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAllReviews();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const [reviewsRes, pendingRes] = await Promise.all([
        reviewsAPI.getMyReviews(),
        reviewsAPI.getPendingReviews()
      ]);
      setReviews(reviewsRes.data.data.reviews || []);
      setPendingProducts(pendingRes.data.data.pendingProducts || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      Alert.alert('Error', 'Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllReviews();
    setRefreshing(false);
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewsAPI.deleteReview(reviewId);
              Alert.alert('Success', 'Review deleted successfully!');
              await fetchAllReviews();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review');
            }
          }
        }
      ]
    );
  };

  const handleViewProduct = async (productId) => {
    try {
      setProductLoadingId(productId);
      const response = await productsAPI.getProductDetails(productId);
      const fullProduct = response.data.data.product;
      navigation.navigate('ProductDetails', { product: fullProduct });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch product details');
    } finally {
      setProductLoadingId(null);
    }
  };

  const renderStars = (rating) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          color={star <= rating ? '#fbbf24' : '#d1d5db'}
          fill={star <= rating ? '#fbbf24' : 'none'}
        />
      ))}
    </View>
  );

  const renderReviewItem = (review) => (
    <Animated.View
      key={review._id}
      style={{
        opacity: fadeAnim,
        backgroundColor: 'white',
        padding: 18,
        marginBottom: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Product Info */}
      <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center' }}>
        <Image
          source={{ uri: review.product?.images?.[0]?.url || EMPTY_ILLUSTRATION }}
          style={{ width: 60, height: 60, borderRadius: 12, marginRight: 16, borderWidth: 1, borderColor: '#f3f4f6', backgroundColor: '#f9fafb' }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 2 }}>{review.product?.name || 'Product Name'}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{review.product?.categoryId?.name || 'Category'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={{ backgroundColor: '#d1fae5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8, flexDirection: 'row', alignItems: 'center' }}>
              <CheckCircle size={12} color="#10b981" style={{ marginRight: 2 }} />
              <Text style={{ fontSize: 10, color: '#047857', fontWeight: '600' }}>Verified Purchase</Text>
            </View>
            <Text style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(review.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      {/* Rating and Review Content */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {renderStars(review.rating)}
        {review.title ? <Text style={{ fontSize: 13, fontWeight: '600', color: '#1f2937', marginLeft: 10 }}>{review.title}</Text> : null}
      </View>
      <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 }}>{review.comment}</Text>
      {/* Seller Reply */}
      {review.reply && (
        <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#10b981' }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#166534', marginBottom: 4 }}>Seller Response:</Text>
          <Text style={{ fontSize: 12, color: '#047857' }}>{review.reply.content}</Text>
        </View>
      )}
      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: '#f3f4f6',
            borderRadius: 8,
            marginRight: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
          onPress={() => handleViewProduct(review.product._id || review.product.id)}
          activeOpacity={0.8}
          disabled={productLoadingId === (review.product._id || review.product.id)}
        >
          {productLoadingId === (review.product._id || review.product.id) ? (
            <ActivityIndicator size={14} color="#10b981" style={{ marginRight: 4 }} />
          ) : (
            <MessageCircle size={14} color="#10b981" />
          )}
          <Text style={{ fontSize: 12, color: '#10b981', marginLeft: 4 }}>View Product</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: '#10b981',
              borderRadius: 8,
              marginRight: 8,
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.10,
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={() => handleViewProduct(review.product._id || review.product.id)}
            activeOpacity={0.8}
            disabled={productLoadingId === (review.product._id || review.product.id)}
          >
            {productLoadingId === (review.product._id || review.product.id) ? (
              <ActivityIndicator size={14} color="#fff" style={{ marginRight: 4 }} />
            ) : (
              <Edit size={14} color="white" />
            )}
            <Text style={{ fontSize: 12, color: 'white', marginLeft: 4 }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: '#ef4444',
              borderRadius: 8,
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.10,
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={() => handleDeleteReview(review._id)}
            activeOpacity={0.8}
          >
            <Trash2 size={14} color="white" />
            <Text style={{ fontSize: 12, color: 'white', marginLeft: 4 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderPendingProduct = (product) => (
    <Animated.View
      key={product._id}
      style={{
        opacity: fadeAnim,
        backgroundColor: 'white',
        padding: 18,
        marginBottom: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Image
        source={{ uri: product.images?.[0]?.url || EMPTY_ILLUSTRATION }}
        style={{ width: 60, height: 60, borderRadius: 12, marginRight: 16, borderWidth: 1, borderColor: '#f3f4f6', backgroundColor: '#f9fafb' }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1f2937' }} numberOfLines={1} ellipsizeMode='tail'>
          {product.name}
        </Text>
        <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{product.categoryId?.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
            <Text style={{ fontSize: 10, color: '#92400e', fontWeight: '600' }}>Pending Review</Text>
          </View>
          {/* <Clock size={12} color="#92400e" />
          <Text style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4}}>Delivered</Text> */}
        </View>
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: '#10b981',
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: 8,
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.10,
          shadowRadius: 2,
          elevation: 2,
        }}
        onPress={() => {
          navigation.navigate('ProductDetails', {
            product,
            openReviewModal: true
          });
        }}
        activeOpacity={0.85}
      >
        <PlusCircle size={18} color="white" />
        <Text style={{ color: 'white', fontWeight: '700', marginLeft: 8, fontSize: 13 }}>
          Write a Review
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 12, fontSize: 14, color: '#6b7280' }}>
          Loading your reviews...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f3f4f6',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
            activeOpacity={0.8}
          >
            <ArrowLeft width={20} height={20} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {/* <MessageCircle size={20} color="#10b981" style={{ marginRight: 8 }} /> */}
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>
              My Reviews
            </Text>
          </View>
        </View>
      </View>
      {/* Content */}
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#10b981"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Submitted Reviews Section */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <CheckCircle size={18} color="#10b981" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>Your Reviews</Text>
          </View>
          {reviews.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Image source={{ uri: EMPTY_ILLUSTRATION }} style={{ width: 80, height: 80, marginBottom: 16, opacity: 0.7 }} />
              <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 12 }}>
                You haven't written any reviews yet
              </Text>
              <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
                Start reviewing products you've purchased to help other customers
              </Text>
            </View>
          ) : (
            reviews.map(renderReviewItem)
          )}
        </View>
        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#e5e7eb', marginVertical: 16, borderRadius: 1 }} />
        {/* Pending Reviews Section */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Clock size={18} color="#92400e" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>Pending Reviews</Text>
          </View>
          {pendingProducts.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Image source={{ uri: EMPTY_ILLUSTRATION }} style={{ width: 80, height: 80, marginBottom: 16, opacity: 0.7 }} />
              <Text style={{ fontSize: 16, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>
                No pending reviews! You have reviewed all purchased products.
              </Text>
            </View>
          ) : (
            pendingProducts.map(renderPendingProduct)
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default MyReviewsScreen; 