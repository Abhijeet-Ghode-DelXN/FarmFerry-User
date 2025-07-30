import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { authAPI } from '../services/api';

export default function ResetPasswordScreen({ navigation, route }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Get reset token from route params or URL
  const resetToken = route?.params?.token || '';

  const handleReset = async () => {
    if (!password || !confirm) {
      Alert.alert('Error', 'Both fields are required');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (!resetToken) {
      Alert.alert('Error', 'Invalid reset token. Please request a new password reset.');
      return;
    }

    setIsResetting(true);

    try {
      const response = await authAPI.resetPassword(resetToken, password);
      console.log('Reset password response:', response.data);
      
      Alert.alert(
        'Success', 
        'Your password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsResetting(false);
    }
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
        disabled={isResetting}
        className="bg-green-500 py-4 rounded-2xl items-center"
      >
        <Text className="text-white text-base font-semibold">
          {isResetting ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
