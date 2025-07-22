import { useNavigation } from '@react-navigation/native';
import {
  Bell, ChevronRight, Clock, CreditCard, Edit3,
  Headphones, Lock, LogOut,
  Mail, MapPin, Package,
  Phone, Plus, Receipt, Search, Settings, ShoppingBag, Star, User, X
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { format } from 'date-fns';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({
    name: 'John Doe',
    phone: '+1 234 567 890',
    email: 'john.doe@example.com'
  });

  // Mock API functions
  const ordersAPI = {
    getMyOrders: async () => ({
      data: {
        data: [
          {
            id: 'GR2401',
            _id: '1',
            status: 'Delivered',
            createdAt: new Date(),
            totalAmount: 847,
            rating: 4,
            items: [
              { product: { name: 'Product 1' } },
              { product: { name: 'Product 2' } }
            ]
          }
        ]
      }
    })
  };

  const customerAPI = {
    getProfile: async () => ({
      data: {
        data: {
          addresses: [
            {
              _id: '1',
              addressType: 'Home',
              isDefault: true,
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              postalCode: '10001'
            }
          ]
        }
      }
    })
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchRecentOrders();
    } else if (activeTab === 'addresses') {
      fetchSavedAddresses();
    }
  }, [activeTab]);

  const fetchRecentOrders = async () => {
    setIsLoading(true);
    try {
      const response = await ordersAPI.getMyOrders({ limit: 3, sortBy: 'createdAt:desc' });
      setRecentOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await customerAPI.getProfile();
      setSavedAddresses(response.data.data.addresses);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const notifications = [
    { id: 1, title: 'Order Delivered!', desc: 'Your order #GR2401 has been delivered', time: '5 min ago', unread: true },
    { id: 2, title: 'New Offer Available', desc: 'Get 20% off on your next order', time: '1 hour ago', unread: true },
    { id: 3, title: 'Payment Successful', desc: 'Payment of ₹847 completed', time: '2 hours ago', unread: false },
  ];

  const profileMenu = [
    { icon: Lock, label: 'Change Password', desc: 'Update your password', color: 'red', badge: null },
    { icon: CreditCard, label: 'Payment Methods', desc: 'Manage cards & wallets', color: 'purple', badge: null },
    { icon: Star, label: 'Rate & Review', desc: 'Share your experience', color: 'yellow', badge: null },
    { icon: Settings, label: 'Settings', desc: 'App preferences', color: 'indigo', badge: null },
    { icon: Headphones, label: 'Help & Support', desc: 'Get assistance', color: 'teal', badge: null },
  ];

  const shadowStyle = "shadow-lg shadow-gray-600";

  const renderProfileTab = () => (
    <View className="p-4 space-y-6">
      <View className="space-y-4">
        {profileMenu.map((item, i) => (
          <TouchableOpacity key={i} className={`w-full bg-white rounded-xl p-4 mb-4 ${shadowStyle}`}>
            <View className="flex flex-row items-center">
              <View className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 bg-${item.color}-100`}>
                <item.icon
                  size={24}
                  color={
                    item.color === 'red' ? '#dc2626' :
                    item.color === 'purple' ? '#9333ea' :
                    item.color === 'yellow' ? '#ca8a04' :
                    item.color === 'indigo' ? '#4f46e5' :
                    item.color === 'teal' ? '#0d9488' : '#000'
                  }
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">{item.label}</Text>
                <Text className="text-sm text-gray-500">{item.desc}</Text>
                {item.badge && (
                  <View className="bg-green-100 rounded-xl px-2 py-1 mt-1 self-start">
                    <Text className="text-xs text-green-800">{item.badge}</Text>
                  </View>
                )}
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity className={`w-full flex flex-row items-center justify-center bg-red-100 p-4 rounded-xl gap-2 ${shadowStyle}`}>
        <LogOut size={20} color="#dc2626" />
        <Text className="text-base font-medium text-red-600">Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOrdersTab = () => (
    <View className="p-4 space-y-6">
      <View className="space-y-4">
        {recentOrders.map((item) => (
          <View key={item.id} className={`bg-white rounded-xl p-4 mb-4 ${shadowStyle}`}>
            <View className="flex flex-row justify-between mb-3">
              <View>
                <View className="flex flex-row items-center">
                  <Text className="text-base font-bold text-gray-900">#{item.id}</Text>
                  <View className="bg-green-100 rounded-xl px-2 py-1 ml-2">
                    <Text className="text-xs text-green-800 font-semibold">{item.status}</Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mt-1">{format(new Date(item.createdAt), 'dd MMM yyyy')}</Text>
              </View>
              <View>
                <Text className="text-base font-bold text-gray-900 text-right">₹{item.totalAmount.toFixed(2)}</Text>
                <View className="flex flex-row justify-end mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      color={i < (item.rating || 0) ? '#facc15' : '#d1d5db'}
                      fill={i < (item.rating || 0) ? '#facc15' : 'transparent'}
                    />
                  ))}
                </View>
              </View>
            </View>
            <View className="mb-3">
              <View className="flex flex-row gap-4">
                <View className="flex flex-row items-center">
                  <Package size={14} color="#6b7280" />
                  <Text className="text-xs text-gray-500 ml-1">{item.items.length} items</Text>
                </View>
              </View>
            </View>
            <View className="bg-gray-50 rounded-lg p-3 mb-4">
              <Text className="text-sm text-gray-500">
                <Text className="font-medium text-gray-900">Items: </Text>
                {item.items.map(p => p.product.name).join(', ')}
              </Text>
            </View>
            <View className="flex flex-row gap-2">
              <TouchableOpacity className="flex-1 bg-green-600 rounded-lg p-3 items-center">
                <Text className="text-white text-sm font-medium">Reorder</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
                className="flex-1 bg-gray-100 rounded-lg p-3 items-center"
              >
                <Text className="text-gray-600 text-sm font-medium">View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-blue-100 rounded-lg p-3 items-center justify-center">
                <Receipt size={16} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAddressesTab = () => (
    <View className="p-4 space-y-6">
      <View className="flex flex-row justify-between items-center">
        <View />
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddAddress')}
          className="flex flex-row items-center bg-green-600 rounded-lg px-4 py-2 gap-2"
        >
          <Plus size={16} color="#ffffff" />
          <Text className="text-white text-sm font-medium">Add New</Text>
        </TouchableOpacity>
      </View>
      <View className="mt-4 space-y-4">
        {isLoading ? (
          <ActivityIndicator size="large" color="#16a34a" />
        ) : (
          savedAddresses.map((item) => (
            <View key={item._id} className={`bg-white rounded-xl p-4 mb-4 ${shadowStyle}`}>
              <View className="flex flex-row justify-between items-center mb-3">
                <View className="flex flex-row items-center">
                  <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center mr-4">
                    <MapPin size={24} color="#2563eb" />
                  </View>
                  <View className="flex flex-row items-center">
                    <Text className="text-base font-medium text-gray-900">{item.addressType}</Text>
                    {item.isDefault && (
                      <View className="rounded-xl px-2 py-1 ml-2 bg-green-100">
                        <Text className="text-xs font-semibold text-green-800">DEFAULT</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('EditAddress', { addressId: item._id })}
                  className="p-2 rounded-lg"
                >
                  <Edit3 size={16} color="#16a34a" />
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-500 leading-5 mb-4 ml-16">{`${item.street}, ${item.city}, ${item.state} ${item.postalCode}`}</Text>
              <View className="flex flex-row gap-2 ml-16">
                {!item.isDefault && (
                  <TouchableOpacity className="bg-green-50 rounded-lg p-2">
                    <Text className="text-green-600 text-xs font-medium">Set as Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('EditAddress', { addressId: item._id })}
                  className="bg-blue-50 rounded-lg p-2"
                >
                  <Text className="text-blue-500 text-xs font-medium">Edit Address</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-red-50 rounded-lg p-2">
                  <Text className="text-red-500 text-xs font-medium">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
        <View className="flex flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-green-600 items-center justify-center mr-3">
            <User size={20} color="#ffffff" />
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-900">Profile</Text>
            <Text className="text-xs text-gray-500">Manage your account</Text>
          </View>
        </View>
        <View className="flex flex-row items-center gap-4">
          <TouchableOpacity
            className="relative p-2 rounded-lg"
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} color="#4b5563" />
            <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center">
              <Text className="text-white text-xs font-bold">2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity className="p-2 rounded-lg">
            <Search size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Header */}
      {user && (
        <View className="p-4 bg-white">
          <View className="items-center">
            <View className="relative mb-4">
              <View className="w-16 h-16 rounded-2xl bg-green-600 items-center justify-center">
                <User size={32} color="#ffffff" />
              </View>
              <TouchableOpacity className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white items-center justify-center border-2 border-gray-200">
                <Edit3 size={14} color="#16a34a" />
              </TouchableOpacity>
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900 mb-1 text-center">{user.name}</Text>
              <View className="flex flex-row items-center mb-1 justify-center">
                <Phone size={12} color="#4b5563" />
                <Text className="text-xs text-gray-500 ml-2">{user.phone}</Text>
              </View>
              <View className="flex flex-row items-center mb-1 justify-center">
                <Mail size={12} color="#4b5563" />
                <Text className="text-xs text-gray-500 ml-2">{user.email}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Navigation Tabs */}
      <View className="flex flex-row bg-white border-b border-gray-200">
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'orders', label: 'My Orders', icon: ShoppingBag },
          { key: 'addresses', label: 'Addresses', icon: MapPin },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 flex flex-row items-center justify-center py-4 gap-2 ${
              activeTab === tab.key ? 'border-b-2 border-green-600 bg-green-50' : ''
            }`}
            onPress={() => setActiveTab(tab.key)}
          >
            <tab.icon
              size={16}
              color={activeTab === tab.key ? '#16a34a' : '#6b7280'}
            />
            <Text className={`text-sm ${activeTab === tab.key ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1 bg-white">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'addresses' && renderAddressesTab()}
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View className="flex-1 bg-white">
          <View className="p-4 border-b border-gray-200 flex flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-gray-900">Notifications</Text>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              className="p-2 rounded-lg"
            >
              <X size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`p-4 border-b border-gray-100 relative ${item.unread ? 'bg-blue-50' : ''}`}
              >
                <Text className="text-base font-medium text-gray-900">{item.title}</Text>
                <Text className="text-sm text-gray-500 mt-1">{item.desc}</Text>
                <Text className="text-xs text-gray-400 mt-1">{item.time}</Text>
                {item.unread && (
                  <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;