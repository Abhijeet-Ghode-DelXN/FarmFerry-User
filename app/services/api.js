import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Do not add Authorization header for login, register, refresh-token
    const authEndpoints = [
      CONFIG.ENDPOINTS.AUTH.LOGIN,
      CONFIG.ENDPOINTS.AUTH.REGISTER,
      CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN,
    ];
    if (authEndpoints.some((ep) => config.url.endsWith(ep))) {
      return config;
    }
    try {
      const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      console.log('🔐 API Request - URL:', config.url);
      console.log('🔐 API Request - Token:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing');
      console.log('🔐 API Request - Method:', config.method?.toUpperCase());
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ API Request - Authorization header set');
      } else {
        console.log('❌ API Request - No token found');
      }
    } catch (error) {
      console.error('❌ Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Response - Success:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.log('API Response - Error:', error.config?.url, error.response?.status, error.response?.data);
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
        
        if (refreshToken) {
          const response = await axios.post(
            `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed, redirect to login
        await AsyncStorage.multiRemove([
          CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
          CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
          CONFIG.STORAGE_KEYS.USER_DATA,
        ]);
        
        // You can emit an event here to notify the app to redirect to login
        // EventBus.emit('AUTH_EXPIRED');
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post(CONFIG.ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => api.post(CONFIG.ENDPOINTS.AUTH.REGISTER, userData),
  logout: () => api.post(CONFIG.ENDPOINTS.AUTH.LOGOUT),
  forgotPassword: (email) => api.post(CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (token, password) => api.post(`${CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD}/${token}`, { password }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const customerAPI = {
  getProfile: () => api.get(CONFIG.ENDPOINTS.CUSTOMER.PROFILE),
  updateProfile: (data) => api.put(CONFIG.ENDPOINTS.CUSTOMER.UPDATE_PROFILE, data),
  addAddress: (addressData) => api.post(CONFIG.ENDPOINTS.CUSTOMER.ADD_ADDRESS, addressData),
  updateAddress: (id, addressData) => api.put(`${CONFIG.ENDPOINTS.CUSTOMER.UPDATE_ADDRESS}/${id}`, addressData),
  deleteAddress: (id) => api.delete(`${CONFIG.ENDPOINTS.CUSTOMER.DELETE_ADDRESS}/${id}`),
};

export const productsAPI = {
  getProducts: (params) => api.get(CONFIG.ENDPOINTS.PRODUCTS.LIST, { params }),
  getProductDetails: (id) => api.get(`${CONFIG.ENDPOINTS.PRODUCTS.DETAILS}/${id}`),
  searchProducts: (query) => api.get(`${CONFIG.ENDPOINTS.PRODUCTS.SEARCH}?q=${query}`),
};

export const ordersAPI = {
  createOrder: (orderData) => api.post(CONFIG.ENDPOINTS.ORDERS.CREATE, orderData),
  getMyOrders: (params) => api.get(CONFIG.ENDPOINTS.ORDERS.LIST, { params }),
  getOrderDetails: (id) => api.get(`${CONFIG.ENDPOINTS.ORDERS.DETAILS}/${id}`),
};

export const cartAPI = {
  getCart: () => api.get(CONFIG.ENDPOINTS.CART.GET),
  addToCart: (item) => api.post(CONFIG.ENDPOINTS.CART.ADD, item),
  updateCartItem: (id, quantity) => api.put(`${CONFIG.ENDPOINTS.CART.UPDATE}/${id}`, { quantity }),
  removeCartItem: (id) => api.delete(`${CONFIG.ENDPOINTS.CART.REMOVE}/${id}`),
};

export const categoriesAPI = {
  getCategories: () => api.get(CONFIG.ENDPOINTS.CATEGORIES.LIST),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export default api; 