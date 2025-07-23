import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EditProfileScreen({ navigation, route }) {
  const { user } = route.params;
  const { updateUser } = useAuth();

  // Use firstName and lastName fields
  const [firstName, setFirstName] = useState(user?.firstName || (user?.name?.split(' ')[0] || ''));
  const [lastName, setLastName] = useState(user?.lastName || (user?.name?.split(' ')[1] || ''));
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    if (!firstName || !lastName || !email || !phone) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { firstName, lastName, email, phone };
      console.log('EditProfileScreen update payload:', payload);
      await customerAPI.updateProfile(payload);
      const refreshed = await customerAPI.getProfile();
      console.log('EditProfileScreen backend response:', refreshed.data);
      updateUser(refreshed.data.data);
      console.log('EditProfileScreen context updated with:', refreshed.data.data);
      setIsSaving(false);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</Text>

        <View className="mb-4">
          <Text className="mb-1 text-gray-700 font-medium">First Name</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            className="bg-white rounded-xl p-4 border border-gray-200 text-base"
          />
        </View>
        <View className="mb-4">
          <Text className="mb-1 text-gray-700 font-medium">Last Name</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
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
