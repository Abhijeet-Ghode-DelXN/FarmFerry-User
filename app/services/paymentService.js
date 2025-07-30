import UpiPay from 'react-native-upi-pay';
import PAYMENT_CONFIG from '../constants/paymentConfig';
import RazorpayService from './razorpayService';
import RazorpayWebService from './razorpayWebService';

// Test UpiPay library availability
console.log('UpiPay library loaded:', !!UpiPay);
console.log('UpiPay.UPI_APPS:', UpiPay?.UPI_APPS);
console.log('UpiPay.initializePayment:', !!UpiPay?.initializePayment);

// Mock Payment Service for testing
export class MockPaymentService {
  static async processPayment(paymentMethod, amount, orderId) {
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Use configured success rate
        const isSuccess = Math.random() > (1 - PAYMENT_CONFIG.TEST.SUCCESS_RATE);
        
        if (isSuccess) {
          resolve({
            success: true,
            transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: amount,
            orderId: orderId,
            paymentMethod: paymentMethod,
            timestamp: new Date().toISOString()
          });
        } else {
          reject(new Error(PAYMENT_CONFIG.ERRORS.PAYMENT_FAILED));
        }
      }, PAYMENT_CONFIG.TEST.MOCK_DELAY);
    });
  }
}

// UPI Payment Service
export class UPIPaymentService {
  static async processUPIPayment(app, amount, orderId, customUpiId = null) {
    try {
      // Check if UpiPay library is available and working
      if (!UpiPay || !UpiPay.initializePayment) {
        console.warn('UpiPay library not available, falling back to mock payment');
        return await MockPaymentService.processPayment('upi', amount, orderId);
      }

      const upiId = customUpiId || PAYMENT_CONFIG.UPI.MERCHANT_ID;
      const payeeName = PAYMENT_CONFIG.UPI.MERCHANT_NAME;
      const transactionRef = `FF${orderId}_${Date.now()}`;
      
      console.log('Initiating UPI payment:', {
        vpa: upiId,
        payeeName,
        amount,
        transactionRef,
        app
      });

      const response = await UpiPay.initializePayment({
        vpa: upiId,
        payeeName,
        amount: amount.toFixed(2),
        transactionRef,
        app: app || 'google_pay',
      });

      console.log('UPI Payment response:', response);

      if (response && response.Status) {
        const status = response.Status.toLowerCase();
        if (status === 'success') {
          return {
            success: true,
            transactionId: response.TxnId || transactionRef,
            amount: amount,
            orderId: orderId,
            paymentMethod: 'upi',
            timestamp: new Date().toISOString(),
            upiResponse: response
          };
        } else if (status === 'failure') {
          throw new Error(response.ErrorMessage || PAYMENT_CONFIG.ERRORS.PAYMENT_FAILED);
        } else if (status === 'cancelled') {
          throw new Error(PAYMENT_CONFIG.ERRORS.USER_CANCELLED);
        } else {
          throw new Error('Payment status unknown');
        }
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      console.error('UPI Payment error:', error);
      throw error;
    }
  }

  // Check if UPI apps are available
  static async checkUPIAppsAvailability() {
    try {
      // For now, return a list of common UPI apps
      // The actual UpiPay.getUPIApps() might not be available in all versions
      return [
        'google_pay',
        'phonepe', 
        'paytm',
        'bhim',
        'amazon_pay',
        'whatsapp'
      ];
    } catch (error) {
      console.error('Error checking UPI apps:', error);
      return [];
    }
  }

  // Validate UPI ID format
  static validateUPIId(upiId) {
    return PAYMENT_CONFIG.UPI.VALIDATION_REGEX.test(upiId);
  }
}

// Payment Gateway Service (for future integration with Razorpay, Stripe, etc.)
export class PaymentGatewayService {
  static async processCardPayment(cardDetails, amount, orderId) {
    // This would integrate with actual payment gateways
    return MockPaymentService.processPayment('card', amount, orderId);
  }

  static async processWalletPayment(walletType, amount, orderId) {
    // This would integrate with wallet services
    return MockPaymentService.processPayment('wallet', amount, orderId);
  }
}

// Payment Status Tracker
export class PaymentStatusTracker {
  static async trackPaymentStatus(transactionId) {
    // This would check payment status with the payment gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          transactionId: transactionId,
          timestamp: new Date().toISOString()
        });
      }, 1000);
    });
  }
}

// Payment Validation
export class PaymentValidator {
  static validatePaymentAmount(amount) {
    if (!amount || amount <= 0) {
      throw new Error(PAYMENT_CONFIG.ERRORS.INVALID_AMOUNT);
    }
    if (amount < PAYMENT_CONFIG.LIMITS.MIN_AMOUNT) {
      throw new Error(PAYMENT_CONFIG.ERRORS.AMOUNT_TOO_LOW);
    }
    if (amount > PAYMENT_CONFIG.LIMITS.MAX_AMOUNT) {
      throw new Error(PAYMENT_CONFIG.ERRORS.AMOUNT_TOO_HIGH);
    }
    return true;
  }

  static validateOrderData(orderData) {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    if (!orderData.deliveryAddress) {
      throw new Error('Delivery address is required');
    }
    return true;
  }
}

// UPI Apps Configuration for PaymentService
const UPI_APPS_CONFIG = {
  GOOGLE_PAY: 'google_pay',
  PHONEPE: 'phonepe',
  PAYTM: 'paytm',
  BHIM: 'bhim',
};

// Main Payment Service
export class PaymentService {
  static async processPayment(paymentMethod, amount, orderId, options = {}) {
    try {
      // Validate payment
      PaymentValidator.validatePaymentAmount(amount);

      let paymentResult = null;

      switch (paymentMethod) {
        case 'razorpay':
        case 'razorpay_web':
          try {
            // Prepare payment data for Razorpay
            const paymentData = {
              amount: amount,
              orderId: `order_${orderId}_${Date.now()}`,
              customerName: options.customerName || 'Customer',
              customerEmail: options.customerEmail || 'customer@farmferry.com',
              customerPhone: options.customerPhone || '',
              description: `Payment for order ${orderId}`,
              prefill: options.prefill || {},
              notes: {
                order_id: orderId,
                ...options.notes
              }
            };

            // Validate payment data
            RazorpayService.validatePaymentData(paymentData);

            // Use web service for razorpay_web, native for razorpay
            if (paymentMethod === 'razorpay_web') {
              console.log('Using Razorpay web integration');
              paymentResult = await RazorpayWebService.processPayment(paymentData);
            } else if (RazorpayService.isAvailable()) {
              console.log('Using native Razorpay integration');
              paymentResult = await RazorpayService.processPayment(paymentData);
            } else {
              console.log('Native Razorpay not available, using web version');
              paymentResult = await RazorpayWebService.processPayment(paymentData);
            }
          } catch (error) {
            console.error('Razorpay payment failed:', error);
            throw error;
          }
          break;

        case 'gpay':
          try {
            paymentResult = await UPIPaymentService.processUPIPayment(
              UPI_APPS_CONFIG.GOOGLE_PAY,
              amount,
              orderId
            );
          } catch (error) {
            console.error('Google Pay payment failed:', error);
            // Fallback to mock payment for testing
            paymentResult = await MockPaymentService.processPayment('gpay', amount, orderId);
          }
          break;

        case 'phonepe':
          try {
            paymentResult = await UPIPaymentService.processUPIPayment(
              UPI_APPS_CONFIG.PHONEPE,
              amount,
              orderId
            );
          } catch (error) {
            console.error('PhonePe payment failed:', error);
            // Fallback to mock payment for testing
            paymentResult = await MockPaymentService.processPayment('phonepe', amount, orderId);
          }
          break;

        case 'upi_id':
          if (!options.upiId) {
            throw new Error('UPI ID is required');
          }
          if (!UPIPaymentService.validateUPIId(options.upiId)) {
            throw new Error('Invalid UPI ID format');
          }
          try {
            paymentResult = await UPIPaymentService.processUPIPayment(
              null,
              amount,
              orderId,
              options.upiId
            );
          } catch (error) {
            console.error('Custom UPI payment failed:', error);
            // Fallback to mock payment for testing
            paymentResult = await MockPaymentService.processPayment('upi_id', amount, orderId);
          }
          break;

        case 'card':
          paymentResult = await PaymentGatewayService.processCardPayment(
            options.cardDetails,
            amount,
            orderId
          );
          break;

        case 'wallet':
          paymentResult = await PaymentGatewayService.processWalletPayment(
            options.walletType,
            amount,
            orderId
          );
          break;

        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      return paymentResult;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  static async getAvailablePaymentMethods() {
    try {
      const upiApps = await UPIPaymentService.checkUPIAppsAvailability();
      return {
        razorpay: true, // Razorpay is always available
      razorpay_web: true, // Razorpay web is always available
        upi: upiApps.length > 0,
        card: true, // Always available (mock)
        wallet: false, // Not implemented yet
        cod: true // Always available
      };
    } catch (error) {
      console.error('Error getting available payment methods:', error);
      return {
        razorpay: true,
        upi: false,
        card: true,
        wallet: false,
        cod: true
      };
    }
  }
}

// Default export
export default PaymentService; 