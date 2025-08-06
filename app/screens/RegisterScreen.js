import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SCREEN_NAMES } from '../types';
import { CONFIG } from '../constants/config';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { register, login } = useAuth();

  // Ref to track verification state immediately
  const verificationStateRef = useRef(false);

  // Sync ref with state whenever state changes
  useEffect(() => {
    verificationStateRef.current = showPhoneVerification;
  }, [showPhoneVerification]);

  // For demonstration: you can expand checkForPendingVerification logic if needed
  useEffect(() => {
    const checkForPendingVerification = async () => {
      // Placeholder for any persisted verification check
      // e.g. from AsyncStorage or context
    };
    checkForPendingVerification();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Starting registration process...');
      console.log('📝 Registration data:', { name, email, phone });

      const response = await register({ name, email, phone, password });
      console.log('✅ Registration response received:', response);

      // Evaluate if phone verification is needed
      const requiresVerification =
        response.data?.data?.requiresPhoneVerification === true ||
        response.data?.requiresPhoneVerification === true ||
        response.data?.data?.customer?.isPhoneVerified === false;

      if (requiresVerification) {
        console.log('✅ Phone verification required. Showing verification screen.');
        setShowPhoneVerification(true);
        verificationStateRef.current = true;

        Alert.alert(
          '✅ Registration Successful!',
          'Please check your phone for the verification code.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowPhoneVerification(true);
                verificationStateRef.current = true;
              }
            }
          ]
        );
        return; // Do not navigate away, wait for verification
      } else {
        console.log('⚠️ No phone verification needed, fallback triggered.');
        Alert.alert(
          'Registration Successful',
          'Please verify your phone number to continue.',
          [
            {
              text: 'OK',
              onPress: () => setShowPhoneVerification(true)
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
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
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: phoneOTP }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login user after successful verification
        try {
          const loginResult = await login(email, password);
          if (loginResult.success) {
            Alert.alert(
              '🎉 Welcome to FarmFerry!',
              'Your phone number has been verified successfully! You can now start shopping.',
              [{ text: 'Get Started' }]
            );
            // AuthContext or parent should handle navigation after login
          } else {
            Alert.alert(
              '✅ Verification Successful',
              'Your phone number has been verified! Please log in to continue.',
              [{ text: 'Go to Login', onPress: () => navigation.navigate(SCREEN_NAMES.LOGIN) }]
            );
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          Alert.alert(
            '✅ Verification Successful',
            'Your phone number has been verified! Please log in to continue.',
            [{ text: 'Go to Login', onPress: () => navigation.navigate(SCREEN_NAMES.LOGIN) }]
          );
        }
      } else {
        Alert.alert('❌ Verification Failed', data.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      Alert.alert('Error', 'Failed to verify phone number. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/send-phone-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        Alert.alert('📱 OTP Sent', 'A new verification code has been sent to your phone number.');
      } else {
        const data = await response.json();
        Alert.alert('❌ Error', data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('❌ Error', 'Failed to resend OTP. Please check your internet and try again.');
    }
  };

  if (showPhoneVerification || verificationStateRef.current) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-gradient-to-b from-blue-50 to-white justify-center px-8"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="items-center mb-8">
          <Image
            source={require('../../assets/images/icon.png')}
            className="w-38 h-38"
            resizeMode="contain"
          />
        </View>

        <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">Verify Your Phone</Text>
        <Text className="text-gray-500 mb-4 text-center">
          We've sent a 6-digit verification code to
        </Text>
        <Text className="text-gray-700 font-semibold text-lg mb-8 text-center">
          {phone}
        </Text>

        <View className="mb-6">
          <Text className="text-gray-700 mb-2 font-medium">Enter Verification Code</Text>
          <TextInput
            value={phoneOTP}
            onChangeText={setPhoneOTP}
            placeholder="000000"
            keyboardType="numeric"
            maxLength={6}
            className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg mb-2 shadow-sm text-center tracking-widest font-bold"
            style={{ fontSize: 24, letterSpacing: 8 }}
          />
          <Text className="text-gray-500 text-sm text-center">
            Enter the 6-digit code from your SMS
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleVerifyPhone}
          disabled={isVerifying || phoneOTP.length !== 6}
          className={`py-4 rounded-xl items-center mb-4 shadow-md ${
            isVerifying || phoneOTP.length !== 6 ? 'bg-gray-400' : 'bg-blue-600'
          }`}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-bold">
            {isVerifying ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center items-center mb-4">
          <Text className="text-gray-500 mr-1">Didn't receive the code?</Text>
          <TouchableOpacity onPress={handleResendOTP}>
            <Text className="text-blue-600 font-bold">Resend OTP</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            setShowPhoneVerification(false);
            verificationStateRef.current = false;
            setPhoneOTP('');
          }}
          className="items-center"
        >
          <Text className="text-gray-500">Back to Registration</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gradient-to-b from-blue-50 to-white justify-center px-8"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text className="text-3xl font-bold text-gray-800 mb-1">Create Account</Text>
      <Text className="text-gray-500 mb-6">Join us today! It takes only few minutes</Text>

      <View className="space-y-4 mb-6">
        <View>
          <Text className="text-gray-700 mb-1">Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
          />
        </View>

        <View>
          <Text className="text-gray-700 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
          />
        </View>

        <View>
          <Text className="text-gray-700 mb-1">Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 234 567 890"
            keyboardType="phone-pad"
            className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
          />
        </View>

        <View>
          <Text className="text-gray-700 mb-1">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleRegister}
        disabled={isLoading}
        className="bg-green-700 py-4 rounded-xl items-center shadow-md"
        activeOpacity={0.8}
      >
        <Text className="text-white text-lg font-bold">
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      {/* Debug button - remove in production */}
      <TouchableOpacity
        onPress={() => {
          console.log('🔧 Debug: Manually setting showPhoneVerification to true');
          setShowPhoneVerification(true);
          verificationStateRef.current = true;
        }}
        className="bg-red-500 py-2 rounded-xl items-center mt-4"
        activeOpacity={0.8}
      >
        <Text className="text-white text-sm font-bold">
          🔧 Debug: Show Phone Verification
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center mt-4">
        <Text className="text-gray-500">Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate(SCREEN_NAMES.LOGIN)}>
          <Text className="text-green-800 font-bold">Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
