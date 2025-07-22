import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';

export default function PhoneVerificationScreen({ navigation }) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP sent to your phone.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      Alert.alert('Verified', 'Your phone number has been verified.');
      navigation.navigate('Home');
    }, 1000);
  };

  return (
    <View className="flex-1 bg-gray-50 justify-center px-5">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Phone Verification</Text>
      <Text className="text-gray-600 mb-4">Enter the 6-digit code sent to your phone</Text>

      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="Enter OTP"
        className="bg-white border border-gray-200 rounded-xl p-4 text-base mb-6 text-center tracking-widest"
      />

      <TouchableOpacity
        className="bg-green-500 py-4 rounded-2xl items-center"
        onPress={handleVerify}
        disabled={isVerifying}
      >
        <Text className="text-white font-semibold text-base">
          {isVerifying ? 'Verifying...' : 'Verify'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
