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
  Dimensions,
} from 'react-native';
import { format } from 'date-fns';
import { customerAPI, ordersAPI, notificationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();
  const profileUser = user && user.customer ? user.customer : user;
  const [activeTab, setActiveTab] = useState('profile');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get screen dimensions for responsive design
  const { width, height } = Dimensions.get('window');
  const isSmallScreen = height < 700;

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
    { icon: Star, label: 'My Reviews', desc: 'View and manage your reviews', color: 'yellow', badge: null, onPress: () => navigation.navigate('MyReviews') },
    { icon: Settings, label: 'Settings', desc: 'App preferences', color: 'indigo', badge: null, onPress: () => navigation.navigate('Settings') },
    { icon: Headphones, label: 'Help & Support', desc: 'Get assistance', color: 'teal', badge: null, onPress: () => navigation.navigate('Support') },
  ];

  const renderProfileTab = () => (
    <View className={`p-4 ${isSmallScreen ? 'space-y-4' : 'space-y-6'}`}>
      <View className={`${isSmallScreen ? 'space-y-3' : 'space-y-4'}`}>
        {profileMenu.map((item, i) => (
          <TouchableOpacity
            key={i}
            className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100"
            onPress={item.onPress}
          >
            <View className="flex-row items-center">
              <View className={`${isSmallScreen ? 'w-10 h-10' : 'w-12 h-12'} rounded-lg items-center justify-center mr-3 ${
                item.color === 'red' ? 'bg-red-50' :
                item.color === 'yellow' ? 'bg-yellow-50' :
                item.color === 'indigo' ? 'bg-indigo-50' :
                item.color === 'teal' ? 'bg-teal-50' : 'bg-gray-50'
              }`}>
                <item.icon
                  size={isSmallScreen ? 18 : 22}
                  color={
                    item.color === 'red' ? '#ef4444' :
                    item.color === 'yellow' ? '#eab308' :
                    item.color === 'indigo' ? '#6366f1' :
                    item.color === 'teal' ? '#14b8a6' : '#6b7280'
                  }
                />
              </View>
              <View className="flex-1">
                <Text className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-medium text-gray-800`}>{item.label}</Text>
                <Text className={`${isSmallScreen ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>{item.desc}</Text>
              </View>
              <ChevronRight size={isSmallScreen ? 16 : 20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <View className={`${isSmallScreen ? 'pt-1' : 'pt-2'}`}>
        <TouchableOpacity 
          onPress={logout} 
          className="w-full flex-row items-center justify-center bg-red-50 p-4 rounded-lg border border-red-100 gap-3"
        >
          <LogOut size={isSmallScreen ? 18 : 20} color="#ef4444" />
          <Text className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-medium text-red-600`}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 pt-6"> {/* Added top padding here */}
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <View className={`${isSmallScreen ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-green-500 items-center justify-center mr-2`}>
            <User size={isSmallScreen ? 16 : 18} color="#ffffff" />
          </View>
          <View>
            <Text className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-semibold text-gray-800`}>Profile</Text>
            <Text className={`${isSmallScreen ? 'text-[10px]' : 'text-xs'} text-gray-500`}>Manage your account</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="relative p-1.5"
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={isSmallScreen ? 18 : 20} color="#4b5563" />
            {notifications?.filter(n => n.unread).length > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-white text-[10px] font-bold">
                  {Math.min(notifications.filter(n => n.unread).length, 9)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Header */}
      {profileUser && (
        <View className={`p-4 bg-white ${isSmallScreen ? 'py-3' : ''}`}>
          <View className="items-center">
            <View className="relative mb-3">
              <View className={`${isSmallScreen ? 'w-14 h-14' : 'w-16 h-16'} rounded-xl bg-green-500 items-center justify-center`}>
                <User size={isSmallScreen ? 24 : 28} color="#ffffff" />
              </View>
              <TouchableOpacity 
                className={`absolute -bottom-1 -right-1 ${isSmallScreen ? 'w-5 h-5' : 'w-6 h-6'} rounded-full bg-white items-center justify-center border-2 border-gray-200`}
                onPress={() => navigation.navigate('EditProfile', { user })}
              >
                <Edit3 size={isSmallScreen ? 10 : 12} color="#16a34a" />
              </TouchableOpacity>
            </View>
            <View>
              <Text className={`${isSmallScreen ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-1 text-center`}>
                {profileUser.firstName || profileUser.lastName ? 
                  `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim() : 
                  profileUser.name}
              </Text>
              <View className="flex-row items-center mb-1 justify-center">
                <Phone size={isSmallScreen ? 10 : 12} color="#4b5563" />
                <Text className={`${isSmallScreen ? 'text-[10px]' : 'text-xs'} text-gray-500 ml-1`}>{profileUser.phone}</Text>
              </View>
              <View className="flex-row items-center justify-center">
                <Mail size={isSmallScreen ? 10 : 12} color="#4b5563" />
                <Text className={`${isSmallScreen ? 'text-[10px]' : 'text-xs'} text-gray-500 ml-1`}>{profileUser.email}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Tab Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: isSmallScreen ? 20 : 30 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={["#10B981"]}
          />
        }
      >
        {renderProfileTab()}
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View className="flex-1 bg-white">
          <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
            <Text className={`${isSmallScreen ? 'text-base' : 'text-lg'} font-semibold text-gray-800`}>Notifications</Text>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              className="p-1.5"
            >
              <X size={isSmallScreen ? 18 : 20} color="#4b5563" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id || item._id || Math.random().toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`p-4 border-b border-gray-100 ${item.unread ? 'bg-blue-50' : ''}`}
              >
                <Text className={`${isSmallScreen ? 'text-sm' : 'text-base'} font-medium text-gray-800`}>{item.title}</Text>
                <Text className={`${isSmallScreen ? 'text-xs' : 'text-sm'} text-gray-500 mt-1`}>{item.desc || item.message}</Text>
                <Text className={`${isSmallScreen ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-1`}>
                  {item.createdAt ? format(new Date(item.createdAt), 'MMM d, h:mm a') : ''}
                </Text>
                {item.unread && (
                  <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center p-8">
                <Text className="text-gray-500">No notifications</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;