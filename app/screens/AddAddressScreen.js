import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react-native';
import { customerAPI } from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

// Responsive sizing helper
const responsiveValue = (mobile, tablet) => {
  return width >= 768 ? tablet : mobile;
};

const ADDRESS_TYPES = [
  { label: 'Home', value: 'Home' },
  { label: 'Work', value: 'Work' },
  { label: 'Other', value: 'Other' },
];

const AddAddressScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      addressType: 'Home',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phone: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setGeneralError('');
    try {
      await customerAPI.addAddress(data);
      Alert.alert('Success', 'Address added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const backendErrors = error.response?.data?.errors;
      const backendMessage = error.response?.data?.message;
      let mapped = false;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => {
          if (err.field && err.message) {
            setError(err.field, { type: 'server', message: err.message });
            mapped = true;
          }
        });
      }
      if (!mapped) {
        setGeneralError(backendMessage || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      {/* AppBar with back arrow */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={responsiveValue(20, 24)} color="black" />
        </TouchableOpacity>
        <Text className={`${responsiveValue('text-base', 'text-lg')} text-black font-medium`}>Add Address</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: responsiveValue(16, 24),
          paddingVertical: responsiveValue(16, 20),
          paddingBottom: responsiveValue(24, 32)
        }}
      >
        {generalError ? (
          <Text 
            className="text-red-500 mb-4 text-center"
            style={{ fontSize: responsiveValue(14, 16) }}
          >
            {generalError}
          </Text>
        ) : null}

        {/* Address Type Picker */}
        <Controller
          control={control}
          name="addressType"
          rules={{ required: 'Address type is required' }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Text 
                className="mb-2 text-gray-700 font-medium"
                style={{ fontSize: responsiveValue(14, 16) }}
              >
                Address Type
              </Text>
              <View className="border border-gray-300 rounded-lg">
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={{ 
                    height: responsiveValue(50, 52)
                  }}
                >
                  {ADDRESS_TYPES.map((type) => (
                    <Picker.Item 
                      key={type.value} 
                      label={type.label} 
                      value={type.value} 
                    />
                  ))}
                </Picker>
              </View>
              {errors.addressType?.message && (
                <Text 
                  className="text-red-500 text-xs mt-1"
                  style={{ fontSize: responsiveValue(12, 14) }}
                >
                  {errors.addressType.message}
                </Text>
              )}
            </View>
          )}
        />

        {/* Street Address */}
        <Controller
          control={control}
          name="street"
          rules={{ required: 'Street address is required' }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Input
                label="Street Address"
                placeholder="Enter street address"
                value={value}
                onChangeText={onChange}
                error={errors.street?.message}
                fontSize={responsiveValue(14, 16)}
                inputHeight={responsiveValue(48, 52)}
              />
            </View>
          )}
        />

        {/* City */}
        <Controller
          control={control}
          name="city"
          rules={{ required: 'City is required' }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Input
                label="City"
                placeholder="Enter city"
                value={value}
                onChangeText={onChange}
                error={errors.city?.message}
                fontSize={responsiveValue(14, 16)}
                inputHeight={responsiveValue(48, 52)}
              />
            </View>
          )}
        />

        {/* State */}
        <Controller
          control={control}
          name="state"
          rules={{ required: 'State is required' }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Input
                label="State"
                placeholder="Enter state"
                value={value}
                onChangeText={onChange}
                error={errors.state?.message}
                fontSize={responsiveValue(14, 16)}
                inputHeight={responsiveValue(48, 52)}
              />
            </View>
          )}
        />

        {/* Postal Code */}
        <Controller
          control={control}
          name="postalCode"
          rules={{ required: 'Postal code is required' }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Input
                label="Postal Code"
                placeholder="Enter postal code"
                value={value}
                onChangeText={onChange}
                error={errors.postalCode?.message}
                keyboardType="numeric"
                fontSize={responsiveValue(14, 16)}
                inputHeight={responsiveValue(48, 52)}
              />
            </View>
          )}
        />

        {/* Country */}
        <Controller
          control={control}
          name="country"
          rules={{ required: 'Country is required' }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Input
                label="Country"
                placeholder="Enter country"
                value={value}
                onChangeText={onChange}
                error={errors.country?.message}
                fontSize={responsiveValue(14, 16)}
                inputHeight={responsiveValue(48, 52)}
              />
            </View>
          )}
        />

        {/* Phone Number */}
        <Controller
          control={control}
          name="phone"
          rules={{
            required: 'Phone number is required',
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'Phone number must be 10 digits',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-6">
              <Input
                label="Phone Number"
                placeholder="Enter phone number"
                value={value}
                onChangeText={onChange}
                error={errors.phone?.message}
                keyboardType="phone-pad"
                maxLength={10}
                fontSize={responsiveValue(14, 16)}
                inputHeight={responsiveValue(48, 52)}
              />
            </View>
          )}
        />

        {/* Save Button */}
        <Button
          title="Save Address"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          fullWidth
          size={responsiveValue('medium', 'large')}
          fontSize={responsiveValue(16, 18)}
          buttonHeight={responsiveValue(50, 56)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddAddressScreen;