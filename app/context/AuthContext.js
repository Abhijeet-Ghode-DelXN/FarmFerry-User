import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';
import { authAPI, customerAPI } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        isLoading: false 
      };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        console.log('AuthContext - Token found:', !!token);
        
        if (token) {
          // You might want to verify the token with the backend here
          console.log('AuthContext - Fetching user profile...');
          const userResponse = await customerAPI.getProfile();
          console.log('AuthContext - userResponse:', userResponse);
          console.log('AuthContext - userResponse.data:', userResponse?.data);
          console.log('AuthContext - userResponse.data.data:', userResponse?.data?.data);
          
          const userData = userResponse?.data?.data;
          console.log('AuthContext - User data to dispatch:', userData);
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: userData, accessToken: token },
          });
        } else {
          console.log('AuthContext - No token found');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('AuthContext - Error in checkAuthStatus:', error);
        // Token might be invalid, so we log out
        await logout();
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('AuthContext - Timeout reached, setting loading to false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 5000); // 5 second timeout

    checkAuthStatus().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login({ email, password });
      console.log('LOGIN RESPONSE:', response.data);
      
      // Check if phone verification is required
      if (response.status === 403 && response.data?.data?.requiresPhoneVerification) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { 
          success: false, 
          requiresPhoneVerification: true,
          customer: response.data.data.customer,
          message: response.data.message
        };
      }
      
      const { customer, accessToken, refreshToken } = response.data.data;
      const user = customer;

      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken },
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Check if it's a phone verification error (403 status)
      if (error.response?.status === 403 && error.response?.data?.data?.requiresPhoneVerification) {
        return { 
          success: false, 
          requiresPhoneVerification: true,
          customer: error.response.data.data.customer,
          message: error.response.data.message
        };
      }
      
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authAPI.register(userData);
      
      // Don't store tokens automatically - user should log in manually
      // Clear any existing tokens to ensure clean state
      await AsyncStorage.multiRemove([
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        CONFIG.STORAGE_KEYS.USER_DATA,
      ]);
      
      // Set loading to false since registration is complete
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Return the full response so the frontend can check if phone verification is required
      return response;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear stored data
      await AsyncStorage.multiRemove([
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        CONFIG.STORAGE_KEYS.USER_DATA,
      ]);

      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    // Update stored user data
    AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify({ ...state.user, ...userData }));
  };

  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword(email);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await authAPI.resetPassword(token, password);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const resetPasswordWithOTP = async (email, otp, password) => {
    try {
      await authAPI.resetPasswordWithOTP(email, otp, password);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const refreshUserData = async () => {
    try {
      console.log('AuthContext - Manual refresh requested');
      const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        throw new Error('No token found');
      }
      
      console.log('AuthContext - Refreshing user profile...');
      const userResponse = await customerAPI.getProfile();
      console.log('AuthContext - Refresh userResponse:', userResponse);
      
      const userData = userResponse?.data?.data;
      console.log('AuthContext - Refresh user data:', userData);
      
      if (userData) {
        dispatch({
          type: 'SET_USER',
          payload: userData,
        });
        return userData;
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('AuthContext - Error refreshing user data:', error);
      throw error;
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
    resetPasswordWithOTP,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 