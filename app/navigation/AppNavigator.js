//import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { SCREEN_NAMES } from '../types';

// Auth Screens
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import PhoneVerificationScreen from '../screens/PhoneVerificationScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main App Screens
import MainTabNavigator from './MainTabNavigator';
import ProductStackNavigator from './ProductsStackNavigator';

// Extra Feature Screens (Add/Edit/Profile)
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import DeleteAddressScreen from '../screens/DeleteAddressScreen';
import SettingScreen from '../screens/SettingScreen';

// Loading Screen
import LoadingScreen from '../screens/LoadingScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AddAddressScreen from '../screens/AddAddressScreen';

const Stack = createStackNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name={SCREEN_NAMES.LOGIN}
      component={LoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name={SCREEN_NAMES.REGISTER}
      component={RegisterScreen}
      options={{ headerShown: true, title: 'Register' }}
    />
    <Stack.Screen
      name={SCREEN_NAMES.PHONE_VERIFICATION}
      component={PhoneVerificationScreen}
      options={{ headerShown: true, title: 'Verify Phone' }}
    />
    <Stack.Screen
      name={SCREEN_NAMES.FORGOT_PASSWORD}
      component={ForgotPasswordScreen}
      options={{ headerShown: true, title: 'Forgot Password' }}
    />
    <Stack.Screen
      name={SCREEN_NAMES.RESET_PASSWORD}
      component={ResetPasswordScreen}
      options={{ headerShown: true, title: 'Reset Password' }}
    />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="MainApp"
      component={MainTabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProductStack"
      component={ProductStackNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="DeleteAddress"
      component={DeleteAddressScreen}
      options={{ headerShown: true, title: 'Delete Address' }}
    />
    <Stack.Screen
      name={SCREEN_NAMES.PRODUCT_DETAILS}
      component={ProductDetailsScreen}
      options={{ headerShown: true }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <AppStack key="app" /> : <AuthStack key="auth" />;
};

export default AppNavigator;
