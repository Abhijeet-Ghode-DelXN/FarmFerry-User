// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image, } from 'react-native';
// import { useAuth } from '../context/AuthContext';
// import { SCREEN_NAMES } from '../types';
// import { CONFIG } from '../constants/config';

// export default function RegisterScreen({ navigation }) {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPhoneVerification, setShowPhoneVerification] = useState(false);
//   const [phoneOTP, setPhoneOTP] = useState('');
//   const [isVerifying, setIsVerifying] = useState(false);
//   const { register, login } = useAuth();

//   const handleRegister = async () => {
//     if (!name || !email || !phone || !password) {
//       Alert.alert('Error', 'Please fill in all fields.');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const response = await register({ name, email, phone, password });
//       console.log('Registration response:', response);
//       console.log('Registration response.data:', response.data);
//       console.log('Registration response.data.data:', response.data?.data);
//       console.log('requiresPhoneVerification:', response.data?.data?.requiresPhoneVerification);

//       // Registration always requires phone verification now
//       if (response.data?.data?.requiresPhoneVerification === true) {
//         console.log('Setting showPhoneVerification to true');
//         setShowPhoneVerification(true);
//         Alert.alert(
//           'Registration Successful',
//           response.data?.message || 'Please verify your phone number with the OTP sent to your mobile.',
//           [{
//             text: 'OK', onPress: () => {
//               console.log('Setting showPhoneVerification to true via fallback');
//               setShowPhoneVerification(true);
//             }
//           }]
//         );
//       } else {
//         console.log('requiresPhoneVerification is not true, fallback triggered');
//         // Fallback - should not happen with new flow but keeping for safety
//         // Alert.alert(
//         //   'Registration Successful',
//         //   'Please verify your phone number to continue.',
//         //   [{
//         //     text: 'OK', onPress: () => {
//         //       console.log('Setting showPhoneVerification to true via fallback');
//         //       setShowPhoneVerification(true);
//         //     }
//         //   }]
//         // );

//         // After successful registration
//         Alert.alert(
//           'Registration Successful',
//           'Please verify your phone number.',
//           [
//             {
//               text: 'OK',
//               onPress: () => navigation.navigate(SCREEN_NAMES.PHONE_VERIFICATION, { phone }),
//             },
//           ]
//         );
//       }
//     } catch (error) {
//       console.error('Registration error:', error);
//       Alert.alert(
//         'Registration Failed',
//         error.response?.data?.message || 'An unexpected error occurred. Please try again.'
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerifyPhone = async () => {
//     if (!phoneOTP) {
//       Alert.alert('Error', 'Please enter the OTP sent to your phone.');
//       return;
//     }

//     setIsVerifying(true);
//     try {
//       const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify-phone-otp`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           phone,
//           otp: phoneOTP
//         })
//       });

//       const data = await response.json();

//       if (response.ok) {
//         // Auto-login the user after successful phone verification
//         try {
//           const loginResult = await login(email, password);
//           if (loginResult.success) {
//             Alert.alert(
//               'Success',
//               'Phone number verified successfully! Welcome to FarmFerry!',
//               [{ text: 'OK' }]
//             );
//             // Navigation will be handled automatically by AuthContext when user is logged in
//           } else {
//             // If auto-login fails, redirect to login page
//             Alert.alert(
//               'Verification Successful',
//               'Phone number verified! Please log in to continue.',
//               [
//                 {
//                   text: 'OK',
//                   onPress: () => navigation.navigate(SCREEN_NAMES.LOGIN)
//                 }
//               ]
//             );
//           }
//         } catch (loginError) {
//           console.error('Auto-login error after verification:', loginError);
//           // If auto-login fails, redirect to login page
//           Alert.alert(
//             'Verification Successful',
//             'Phone number verified! Please log in to continue.',
//             [
//               {
//                 text: 'OK',
//                 onPress: () => navigation.navigate(SCREEN_NAMES.LOGIN)
//               }
//             ]
//           );
//         }
//       } else {
//         Alert.alert('Verification Failed', data.message || 'Invalid OTP. Please try again.');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to verify phone number. Please try again.');
//     } finally {
//       setIsVerifying(false);
//     }
//   };

//   const handleResendOTP = async () => {
//     try {
//       const response = await fetch(`${CONFIG.API_BASE_URL}/auth/send-phone-verification`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ phone })
//       });

//       if (response.ok) {
//         Alert.alert('Success', 'New OTP has been sent to your phone.');
//       } else {
//         Alert.alert('Error', 'Failed to resend OTP. Please try again.');
//       }
//     } catch (error) {
//       Alert.alert('Error', 'Failed to resend OTP. Please try again.');
//     }
//   };

//   if (showPhoneVerification) {
//     return (
//       <KeyboardAvoidingView
//         className="flex-1 bg-gradient-to-b from-blue-50 to-white justify-center px-8"
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <View className="items-center mb-8">
//           <Image
//             source={require('../../assets/images/icon.png')}
//             className="w-38 h-38"
//             resizeMode="contain"
//           />
//         </View>

//         <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">Verify Phone</Text>
//         <Text className="text-gray-500 mb-8 text-center">
//           We've sent a verification code to {'\n'}
//           <Text className="font-semibold text-gray-700">{phone}</Text>
//         </Text>

//         <View className="mb-6">
//           <Text className="text-gray-700 mb-2">Enter OTP</Text>
//           <TextInput
//             value={phoneOTP}
//             onChangeText={setPhoneOTP}
//             placeholder="Enter 6-digit code"
//             keyboardType="numeric"
//             maxLength={6}
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg mb-2 shadow-sm"
//           />
//         </View>

//         <TouchableOpacity
//           onPress={handleVerifyPhone}
//           disabled={isVerifying}
//           className="bg-blue-600 py-4 rounded-xl items-center mb-4 shadow-md"
//           activeOpacity={0.8}
//         >
//           <Text className="text-white text-lg font-bold">
//             {isVerifying ? 'Verifying...' : 'Verify & Continue'}
//           </Text>
//         </TouchableOpacity>

//         <View className="flex-row justify-center items-center">
//           <Text className="text-gray-500 mr-1">Didn't receive code?</Text>
//           <TouchableOpacity onPress={handleResendOTP}>
//             <Text className="text-blue-600 font-bold">Resend OTP</Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       className="flex-1 bg-gradient-to-b from-blue-50 to-white justify-center px-8"
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       {/* <View className="items-center mb-8">
//         <Image 
//           source={require('../../assets/images/OutlookLogo2.png')} 
//           className="w-56 h-56"
//           resizeMode="contain"
//         />
//       </View> */}

//       <Text className="text-3xl font-bold text-gray-800 mb-1">Create Account</Text>
//       <Text className="text-gray-500 mb-6">Join us today! It takes only few minutes</Text>

//       <View className="space-y-4 mb-6">
//         <View>
//           <Text className="text-gray-700 mb-1">Full Name</Text>
//           <TextInput
//             value={name}
//             onChangeText={setName}
//             placeholder="John Doe"
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
//           />
//         </View>

//         <View>
//           <Text className="text-gray-700 mb-1">Email</Text>
//           <TextInput
//             value={email}
//             onChangeText={setEmail}
//             placeholder="your@email.com"
//             keyboardType="email-address"
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
//           />
//         </View>

//         <View>
//           <Text className="text-gray-700 mb-1">Phone Number</Text>
//           <TextInput
//             value={phone}
//             onChangeText={setPhone}
//             placeholder="+1 234 567 890"
//             keyboardType="phone-pad"
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
//           />
//         </View>

//         <View>
//           <Text className="text-gray-700 mb-1">Password</Text>
//           <TextInput
//             value={password}
//             onChangeText={setPassword}
//             placeholder="••••••••"
//             secureTextEntry
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
//           />
//         </View>
//       </View>

//       <TouchableOpacity
//         onPress={handleRegister}
//         disabled={isLoading}
//         className="bg-green-700 py-4 rounded-xl items-center shadow-md"
//         activeOpacity={0.8}
//       >
//         <Text className="text-white text-lg font-bold">
//           {isLoading ? 'Creating Account...' : 'Sign Up'}
//         </Text>
//       </TouchableOpacity>

//       <View className="flex-row justify-center mt-4">
//         <Text className="text-gray-500">Already have an account? </Text>
//         <TouchableOpacity onPress={() => navigation.navigate(SCREEN_NAMES.LOGIN)}>
//           <Text className="text-green-800 font-bold">Sign In</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { useAuth } from '../context/AuthContext';
// import { SCREEN_NAMES } from '../types';

// export default function RegisterScreen({ navigation }) {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [phone, setPhone] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
  
//   const { register } = useAuth();

//   const handleRegister = async () => {
//     if (!name || !email || !phone || !password) {
//       Alert.alert('Error', 'Please fill in all fields.');
//       return;
//     }

//     setIsLoading(true);
    
//     try {
//       const response = await register({ name, email, phone, password });
      
//       if (response?.success || response?.data?.success) {
//         // Navigate to login screen first
//         navigation.navigate(SCREEN_NAMES.LOGIN);
        
//         // Then show success alert with phone verification option
//         setTimeout(() => {
//           Alert.alert(
//             'Registration Successful',
//             'Please verify your phone number to complete your account setup.',
//             [
//               {
//                 text: 'Send OTP',
//                 onPress: () => navigation.navigate(SCREEN_NAMES.PHONE_VERIFICATION, { phone }),
//               },
//             ]
//           );
//         }, 500);
//       } else {
//         Alert.alert(
//           'Registration Failed',
//           response?.data?.message || response?.message || 'An unexpected error occurred. Please try again.'
//         );
//       }
//     } catch (error) {
//       console.error('Registration error:', error);
//       Alert.alert(
//         'Registration Failed',
//         error.response?.data?.message || error.message || 'An unexpected error occurred. Please try again.'
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       className="flex-1 bg-gradient-to-b from-blue-50 to-white justify-center px-8"
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       <Text className="text-3xl font-bold text-gray-800 mb-1">Create Account</Text>
//       <Text className="text-gray-500 mb-6">Join us today! It takes only few minutes</Text>

//       <View className="space-y-4 mb-6">
//         <View>
//           <Text className="text-gray-700 mb-1">Full Name</Text>
//           <TextInput
//             value={name}
//             onChangeText={setName}
//             placeholder="John Doe"
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
//           />
//         </View>

//         <View>
//           <Text className="text-gray-700 mb-1">Email</Text>
//           <TextInput
//             value={email}
//             onChangeText={setEmail}
//             placeholder="your@email.com"
//             keyboardType="email-address"
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
//           />
//         </View>

//         <View>
//           <Text className="text-gray-700 mb-1">Phone Number</Text>
//           <TextInput
//             value={phone}
//             onChangeText={setPhone}
//             placeholder="+1 234 567 890"
//             keyboardType="phone-pad"
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
//           />
//         </View>

//         <View>
//           <Text className="text-gray-700 mb-1">Password</Text>
//           <TextInput
//             value={password}
//             onChangeText={setPassword}
//             placeholder="••••••••"
//             secureTextEntry
//             className="bg-white border-2 border-gray-200 rounded-xl p-4 text-lg shadow-sm"
//           />
//         </View>
//       </View>

//       <TouchableOpacity
//         onPress={handleRegister}
//         disabled={isLoading}
//         className="bg-green-700 py-4 rounded-xl items-center shadow-md"
//         activeOpacity={0.8}
//       >
//         {isLoading ? (
//           <View className="flex-row items-center">
//             <ActivityIndicator size="small" color="#fff" />
//             <Text className="text-white text-lg font-bold ml-3">Creating Account...</Text>
//           </View>
//         ) : (
//           <Text className="text-white text-lg font-bold">Sign Up</Text>
//         )}
//       </TouchableOpacity>

//       <View className="flex-row justify-center mt-4">
//         <Text className="text-gray-500">Already have an account? </Text>
//         <TouchableOpacity onPress={() => navigation.navigate(SCREEN_NAMES.LOGIN)}>
//           <Text className="text-green-800 font-bold">Sign In</Text>
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }






import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SCREEN_NAMES } from '../types';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();

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
      console.log('Registration response:', response);

      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate(SCREEN_NAMES.LOGIN),
          },
        ]
      );
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

