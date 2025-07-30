import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { authAPI } from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your registered email.');
      return;
    }

    setIsSending(true);

    try {
      const response = await authAPI.forgotPassword(email);
      console.log('Forgot password response:', response.data);
      
      Alert.alert(
        'Email Sent', 
        'Password reset link has been sent to your email. Please check your inbox and follow the instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ResetPassword')
          }
        ]
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50 justify-center px-5"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text className="text-2xl font-bold text-gray-800 mb-6">Forgot Password</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-4"
      />

      <TouchableOpacity
        className="bg-green-500 py-4 rounded-2xl items-center"
        onPress={handleSend}
        disabled={isSending}
      >
        <Text className="text-white font-semibold text-base">
          {isSending ? 'Sending...' : 'Send Reset Link'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
