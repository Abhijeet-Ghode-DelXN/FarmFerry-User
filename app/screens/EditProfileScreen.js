import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen({ navigation, route }) {
  const { user } = route.params;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    }, 800);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</Text>

        <View className="mb-4">
          <Text className="mb-1 text-gray-700 font-medium">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter full name"
            className="bg-white rounded-xl p-4 border border-gray-200 text-base"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-1 text-gray-700 font-medium">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="Enter email"
            className="bg-white rounded-xl p-4 border border-gray-200 text-base"
          />
        </View>

        <View className="mb-6">
          <Text className="mb-1 text-gray-700 font-medium">Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
            className="bg-white rounded-xl p-4 border border-gray-200 text-base"
          />
        </View>

        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isSaving}
          className="bg-green-500 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-semibold text-base">
            {isSaving ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
