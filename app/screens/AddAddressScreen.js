import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react-native';
import { customerAPI } from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Picker } from '@react-native-picker/picker';

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
      // Try to map backend errors to fields
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
      {/* <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg text-black font-medium">Add New Address</Text>
      </View> */}

      <ScrollView className="p-4">
        {generalError ? (
          <Text className="text-red-500 mb-2 text-center">{generalError}</Text>
        ) : null}
        <Controller
          control={control}
          name="addressType"
          rules={{ required: 'Address type is required' }}
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <Text className="mb-1 text-gray-700 font-medium">Address Type</Text>
              <View className="border border-gray-300 rounded">
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={{ height: 50 }}
                >
                  {ADDRESS_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>
              {errors.addressType?.message && (
                <Text className="text-red-500 text-xs mt-1">{errors.addressType.message}</Text>
              )}
            </View>
          )}
        />
        <Controller
          control={control}
          name="street"
          rules={{ required: 'Street address is required' }}
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
          rules={{ required: 'City is required' }}
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
          rules={{ required: 'State is required' }}
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
          rules={{ required: 'Postal code is required' }}
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
          rules={{ required: 'Country is required' }}
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
            <Input
              label="Phone Number"
              placeholder="Enter phone number"
              value={value}
              onChangeText={onChange}
              error={errors.phone?.message}
              keyboardType="phone-pad"
              maxLength={10}
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
