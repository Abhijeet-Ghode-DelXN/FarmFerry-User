import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

export default function SupportScreen() {
  const contactEmail = 'support@farmferry.com';

  return (
    <View className="flex-1 bg-gray-50 p-5">
      <Text className="text-2xl font-bold text-gray-800 mb-4">Support</Text>

      <Text className="text-base text-gray-700 mb-4">
        If you need help with your order, account, or app features, feel free to reach out.
      </Text>

      <TouchableOpacity
        className="bg-white p-4 rounded-2xl border border-gray-200"
        onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
      >
        <Text className="text-green-600 font-semibold text-base">Email: {contactEmail}</Text>
      </TouchableOpacity>
    </View>
  );
}
