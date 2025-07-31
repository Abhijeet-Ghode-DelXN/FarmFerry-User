import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SCREEN_NAMES } from '../types';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await register({ name, email, phone, password });
      console.log('Registration response:', response);
      console.log('Response data:', response.data);
      console.log('Requires phone verification:', response.data?.data?.requiresPhoneVerification);
      
      // Check if phone verification is required
      if (response.data?.data?.requiresPhoneVerification === true) {
        setShowPhoneVerification(true);
        Alert.alert(
          'Registration Successful', 
          'Please verify your phone number with the OTP sent to your mobile.',
          [{ text: 'OK' }]
        );
      } else {
        // Registration successful, redirect to login
        console.log('Redirecting to login...');
        console.log('Screen name:', SCREEN_NAMES.LOGIN);
        console.log('Navigation object:', navigation);
        
        // Use replace to ensure navigation works
        setTimeout(() => {
          try {
            navigation.replace(SCREEN_NAMES.LOGIN);
            console.log('Navigation successful');
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback: try with string
            navigation.replace('Login');
          }
        }, 100);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneOTP) {
      Alert.alert('Error', 'Please enter the OTP sent to your phone.');
      return;
    }

    setIsVerifying(true);
    try {
      // Call the verify phone OTP API
      const response = await fetch('http://192.168.0.109:9000/api/v1/auth/verify-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          otp: phoneOTP
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success', 
          'Phone number verified successfully! You can now log in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate(SCREEN_NAMES.LOGIN)
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify phone number. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      // Call the send phone verification API
      const response = await fetch('http://192.168.0.109:9000/api/v1/auth/send-phone-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone })
      });

      if (response.ok) {
        Alert.alert('Success', 'New OTP has been sent to your phone.');
      } else {
        Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  if (showPhoneVerification) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-gray-50 justify-center px-5"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text className="text-2xl font-bold text-gray-800 mb-6">Verify Phone Number</Text>
        
        <Text className="text-gray-600 mb-4">
          Enter the 6-digit OTP sent to {phone}
        </Text>

        <TextInput
          value={phoneOTP}
          onChangeText={setPhoneOTP}
          placeholder="Enter 6-digit OTP"
          keyboardType="numeric"
          maxLength={6}
          className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-4"
        />

        <TouchableOpacity
          onPress={handleVerifyPhone}
          disabled={isVerifying}
          className="bg-green-500 py-4 rounded-2xl items-center mb-4"
        >
          <Text className="text-white text-base font-semibold">
            {isVerifying ? 'Verifying...' : 'Verify Phone'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResendOTP}
          className="py-2 items-center"
        >
          <Text className="text-green-500 text-base">
            Didn't receive OTP? Resend
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50 justify-center px-5"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text className="text-2xl font-bold text-gray-800 mb-6">Create Account</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Full Name"
        className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-3"
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-3"
      />
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-3"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-6"
      />

      <TouchableOpacity
        onPress={handleRegister}
        disabled={isLoading}
        className="bg-green-500 py-4 rounded-2xl items-center"
      >
        <Text className="text-white text-base font-semibold">
          {isLoading ? 'Registering...' : 'Register'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
