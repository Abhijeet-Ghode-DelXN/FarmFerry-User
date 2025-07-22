import '../global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AppNavigator from './navigation/AppNavigator';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppNavigator />
        <Toast />
        <StatusBar style="auto" />
      </AppProvider>
    </AuthProvider>
  );
}
