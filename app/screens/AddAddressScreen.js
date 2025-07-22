import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react-native';
import { customerAPI } from '../services/api';
import { addressSchema } from '../utils/validation';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const AddAddressScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressType: 'Home',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await customerAPI.addAddress(data);
      Alert.alert('Success', 'Address added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'Failed to Add Address',
        error.response?.data?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg text-black font-medium">Add New Address</Text>
      </View>

      <ScrollView className="p-4">
        <Controller
          control={control}
          name="addressType"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Address Type"
              placeholder="e.g., Home, Work"
              value={value}
              onChangeText={onChange}
              error={errors.addressType?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="street"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Street Address"
              placeholder="Enter street address"
              value={value}
              onChangeText={onChange}
              error={errors.street?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, value } }) => (
            <Input
              label="City"
              placeholder="Enter city"
              value={value}
              onChangeText={onChange}
              error={errors.city?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="state"
          render={({ field: { onChange, value } }) => (
            <Input
              label="State"
              placeholder="Enter state"
              value={value}
              onChangeText={onChange}
              error={errors.state?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="postalCode"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Postal Code"
              placeholder="Enter postal code"
              value={value}
              onChangeText={onChange}
              error={errors.postalCode?.message}
              keyboardType="numeric"
            />
          )}
        />
        <Controller
          control={control}
          name="country"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Country"
              placeholder="Enter country"
              value={value}
              onChangeText={onChange}
              error={errors.country?.message}
            />
          )}
        />
        <Button
          title="Save Address"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          fullWidth
          size="large"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddAddressScreen;
