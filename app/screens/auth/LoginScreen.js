import React from 'react';
import { View, ScrollView, Image, SafeAreaView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LoginForm from '../../components/forms/LoginForm';
import { SCREEN_NAMES } from '../../types';

const LoginScreen = () => {
  const navigation = useNavigation();

  const handleLoginSuccess = () => {
    /*
      After a successful login, AuthContext already flips
      `isAuthenticated` to true which causes <AppNavigator /> to
      switch from <AuthStack /> to <AppStack />. In order to ensure
      that the Login screen is removed from the navigation history
      (so the user can’t go back to it) and the first screen of the
      authenticated stack is shown immediately, we reset the root
      navigation state to the `MainApp` stack that contains the tab
      navigator (which itself will land the user on the Home tab).
    */
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  const handleForgotPassword = () => {
    navigation.navigate(SCREEN_NAMES.FORGOT_PASSWORD);
  };

  const handleRegister = () => {
    navigation.navigate(SCREEN_NAMES.REGISTER);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Logo and Branding */}
          <View style={{ alignItems: 'center' }}>
            <Image source={require('../../../assets/images/Icon2.jpeg')} style={{ width: 200, height: 200, resizeMode: 'contain' }} />
          </View>
          {/* Login Form */}
          <LoginForm
            onSuccess={handleLoginSuccess}
            onForgotPassword={handleForgotPassword}
            onRegister={handleRegister}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen; 