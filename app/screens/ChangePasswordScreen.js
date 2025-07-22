import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [secure, setSecure] = useState(true);

  const handleSubmit = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Password changed successfully!');
      navigation.goBack();
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">Change Password</Text>

        {/* Old Password */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-1">Old Password</Text>
          <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
            <TextInput
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
              secureTextEntry={secure}
              className="flex-1 py-4 text-base"
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons name={secure ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-1">New Password</Text>
          <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry={secure}
              className="flex-1 py-4 text-base"
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons name={secure ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-1">Confirm Password</Text>
          <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry={secure}
              className="flex-1 py-4 text-base"
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons name={secure ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-green-500 py-4 rounded-2xl items-center"
          disabled={isLoading}
          onPress={handleSubmit}
        >
          <Text className="text-white text-base font-semibold">
            {isLoading ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
