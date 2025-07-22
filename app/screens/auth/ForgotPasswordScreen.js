import React, { useState } from 'react';
import { View, Text, SafeAreaView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { forgotPasswordSchema } from '../../utils/validation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ForgotPasswordScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await forgotPassword(data.email);
      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email address.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Forgot Password?
          </Text>
          <Text className="text-gray-600 text-center">
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        {/* Form */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Ionicons name="mail-outline" size={20} color="#6b7280" />}
              required
            />
          )}
        />

        <Button
          title="Send Reset Instructions"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          fullWidth
          size="large"
        />

        <View className="mt-6">
          <Text className="text-gray-600 text-center text-sm">
            Remember your password?{' '}
            <Text className="text-green-600 font-medium">
              Sign in here
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen; 