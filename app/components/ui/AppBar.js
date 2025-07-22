
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MapPin, Bell, User, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { useUserLocation } from '../../hooks/useUserLocation';

export default function AppBar({ showBack = false, title = "FarmFerry" }) {
  const navigation = useNavigation();
  const { cartItems } = useAppContext();
  const { address } = useUserLocation(); 
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 3,
      }}
      className="mt-7"
    >
      {/* Left: Logo or Back Arrow */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginRight: 12,
              backgroundColor: '#f0fdf4',
              borderRadius: 9999,
              padding: 8,
            }}
          >
            <ArrowLeft size={20} color="#16a34a" />
          </TouchableOpacity>
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#4b5563',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{
                uri: 'https://cdn.dribbble.com/userupload/13059119/file/original-b9ef38b6d36a6cdff474156872acdaaa.jpg?format=webp&resize=400x300&vertical=center',
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        )}
        <View>
           <Text className="text-lg font-bold text-green-700">FarmFerry</Text>
          <View className="flex-row items-center">
            <MapPin size={14} color="green" className="mr-1" />
            <Text className="text-base font-xl text-green-700">
              {address || 'Locating...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Right: Icons */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: '#f0fdf4',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 12,
            position: 'relative',
            borderWidth: 1,
            borderColor: '#dcfce7',
          }}
        >
          {cartItems.length > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: 'red',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
                borderWidth: 2,
                borderColor: '#f0fdf4',
              }}
            >
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>
                {cartItems.length}
              </Text>
            </View>
          )}
          <Bell width={22} height={22} color="#16a34a" />
        </View>

        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: '#f0fdf4',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 12,
            borderWidth: 1,
            borderColor: '#dcfce7',
          }}
        >
          <User width={22} height={22} color="#16a34a" />
        </View>
      </View>
    </View>
  );
}
