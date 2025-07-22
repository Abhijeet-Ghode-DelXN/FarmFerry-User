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
        if (token) {
          // You might want to verify the token with the backend here
          const userResponse = await customerAPI.getProfile();
          console.log('userResponse: ', userResponse);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: userResponse.data.data, accessToken: token },
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        // Token might be invalid, so we log out
        await logout();
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login({ email, password });
      console.log('LOGIN RESPONSE:', response.data); // <-- Added for debugging
      const { user, accessToken, refreshToken } = response.data.data;

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
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authAPI.register(userData);
      const { user, accessToken, refreshToken } = response.data.data;

      // Do not log in the user automatically after registration
      // The user should log in manually
      
      return { success: true };
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

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
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