import { useNavigation } from '@react-navigation/native';
import {
  Bell, ChevronRight, Clock, CreditCard, Edit3,
  Headphones, Lock, LogOut,
  Mail, MapPin, Package,
  Phone, Plus, Receipt, Search, Settings, ShoppingBag, Star, User, X, Trash2
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { customerAPI, ordersAPI, notificationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();
  console.log('ProfileScreen user:', user);
  const profileUser = user && user.customer ? user.customer : user;
  const [activeTab, setActiveTab] = useState('profile');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      setNotifications(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Only refresh profile
    try {
      const response = await customerAPI.getProfile();
      updateUser(response.data.data);
    } catch (e) {
      // Optionally show error
    }
    setRefreshing(false);
  };

  const profileMenu = [
    { icon: Lock, label: 'Change Password', desc: 'Update your password', color: 'red', badge: null, onPress: () => navigation.navigate('ChangePassword') },
    { icon: Star, label: 'Rate & Review', desc: 'Share your experience', color: 'yellow', badge: null, onPress: () => navigation.navigate('RateReview') },
    { icon: Settings, label: 'Settings', desc: 'App preferences', color: 'indigo', badge: null, onPress: () => navigation.navigate('Settings') },
    { icon: Headphones, label: 'Help & Support', desc: 'Get assistance', color: 'teal', badge: null, onPress: () => navigation.navigate('Support') },
  ];

  const shadowStyle = "shadow-lg shadow-gray-600";

  const renderProfileTab = () => (
    <View className="p-4 space-y-6">
      <View className="space-y-4">
        {profileMenu.map((item, i) => (
          <TouchableOpacity
            key={i}
            className={`w-full bg-white rounded-xl p-4 mb-4 ${shadowStyle}`}
            onPress={item.onPress}
          >
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
      <TouchableOpacity onPress={logout} className={`w-full flex flex-row items-center justify-center bg-red-100 p-4 rounded-xl gap-2 ${shadowStyle}`}>
        <LogOut size={20} color="#dc2626" />
        <Text className="text-base font-medium text-red-600">Logout</Text>
      </TouchableOpacity>
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
              <Text className="text-white text-xs font-bold">{Array.isArray(notifications) ? notifications.filter(n => n.unread).length : 0}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity className="p-2 rounded-lg">
            <Search size={20} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Header */}
      {profileUser && (
        <View className="p-4 bg-white">
          <View className="items-center">
            <View className="relative mb-4">
              <View className="w-16 h-16 rounded-2xl bg-green-600 items-center justify-center">
                <User size={32} color="#ffffff" />
              </View>
              <TouchableOpacity 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white items-center justify-center border-2 border-gray-200"
                onPress={() => navigation.navigate('EditProfile', { user })}
              >
                <Edit3 size={14} color="#16a34a" />
              </TouchableOpacity>
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900 mb-1 text-center">{profileUser.firstName || profileUser.lastName ? `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim() : profileUser.name}</Text>
              <View className="flex flex-row items-center mb-1 justify-center">
                <Phone size={12} color="#4b5563" />
                <Text className="text-xs text-gray-500 ml-2">{profileUser.phone}</Text>
              </View>
              <View className="flex flex-row items-center mb-1 justify-center">
                <Mail size={12} color="#4b5563" />
                <Text className="text-xs text-gray-500 ml-2">{profileUser.email}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Navigation Tabs */}
      <View className="flex flex-row bg-white border-b border-gray-200">
        {[
          // { key: 'profile', label: 'Profile', icon: User },
          // Removed addresses tab
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
      <ScrollView
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'profile' && renderProfileTab()}
        {/* Removed addresses tab content */}
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
            keyExtractor={(item) => (item.id || item._id || Math.random().toString())}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`p-4 border-b border-gray-100 relative ${item.unread ? 'bg-blue-50' : ''}`}
              >
                <Text className="text-base font-medium text-gray-900">{item.title}</Text>
                <Text className="text-sm text-gray-500 mt-1">{item.desc || item.message}</Text>
                <Text className="text-xs text-gray-400 mt-1">{item.time || ''}</Text>
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