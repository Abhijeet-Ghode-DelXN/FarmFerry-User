import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';

export default function ResetPasswordScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleReset = () => {
    if (!password || !confirm) {
      Alert.alert('Error', 'Both fields are required');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    Alert.alert('Success', 'Your password has been reset!');
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 justify-center px-5"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text className="text-2xl font-bold text-gray-800 mb-6">Reset Password</Text>

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="New Password"
        secureTextEntry
        className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-4"
      />
      <TextInput
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm Password"
        secureTextEntry
        className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-6"
      />

      <TouchableOpacity
        onPress={handleReset}
        className="bg-green-500 py-4 rounded-2xl items-center"
      >
        <Text className="text-white text-base font-semibold">Reset Password</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
