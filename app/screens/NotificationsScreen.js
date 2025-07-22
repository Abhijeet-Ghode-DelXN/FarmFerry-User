import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const notifications = [
  { id: '1', title: 'Order Delivered', message: 'Your order #1234 has been delivered.' },
  { id: '2', title: 'New Offer!', message: 'Flat 30% off on spices. Limited time only!' },
  { id: '3', title: 'Welcome!', message: 'Thanks for joining FarmFerry.' },
];

export default function NotificationsScreen() {
  return (
    <View className="flex-1 bg-gray-50 pt-6 px-4">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Notifications</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-1">
              <Ionicons name="notifications-outline" size={18} color="#10B981" />
              <Text className="text-base font-semibold text-gray-800 ml-2">{item.title}</Text>
            </View>
            <Text className="text-sm text-gray-600">{item.message}</Text>
          </View>
        )}
      />
    </View>
  );
}
