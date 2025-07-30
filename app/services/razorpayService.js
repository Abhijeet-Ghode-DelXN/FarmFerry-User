import PAYMENT_CONFIG from '../constants/paymentConfig';

// Try to import RazorpayCheckout, but handle the case where it's not available
let RazorpayCheckout = null;
try {
  const razorpayModule = require('react-native-razorpay');
  RazorpayCheckout = razorpayModule.default || razorpayModule;
  
  // Verify that the module is properly loaded
  if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
    console.log('Razorpay library loaded successfully');
  } else {
    console.warn('Razorpay library loaded but open method not available');
    RazorpayCheckout = null;
  }
} catch (error) {
  console.warn('Razorpay library not available:', error.message);
  RazorpayCheckout = null;
}

export class RazorpayService {
  static async processPayment(paymentData) {
    try {
      const {
        amount,
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        description = PAYMENT_CONFIG.RAZORPAY.MERCHANT_DESCRIPTION,
        prefill = {},
        notes = {},
        theme = {}
      } = paymentData;

      // Validate required fields
      if (!amount || !orderId || !customerName || !customerEmail) {
        throw new Error('Missing required payment data');
      }

      // Check if Razorpay library is available
      if (!RazorpayCheckout) {
        console.warn('Razorpay library not available, using mock payment');
        return await this.processMockPayment(paymentData);
      }

      // Additional check for RazorpayCheckout.open method
      if (!RazorpayCheckout.open || typeof RazorpayCheckout.open !== 'function') {
        console.warn('RazorpayCheckout.open method not available, using mock payment');
        return await this.processMockPayment(paymentData);
      }

      // Prepare Razorpay options
      const options = {
        key: PAYMENT_CONFIG.RAZORPAY.KEY_ID,
        amount: Math.round(amount * 100), // Convert to paise
        currency: PAYMENT_CONFIG.RAZORPAY.CURRENCY,
        name: PAYMENT_CONFIG.RAZORPAY.MERCHANT_NAME,
        description: description,
        order_id: orderId,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
          ...prefill
        },
        notes: {
          order_id: orderId,
          ...notes
        },
        theme: {
          color: PAYMENT_CONFIG.RAZORPAY.THEME_COLOR,
          ...theme
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
          }
        }
      };

      console.log('Initiating Razorpay payment:', {
        amount: options.amount,
        orderId: options.order_id,
        customerName: options.prefill.name
      });

             // Initialize Razorpay checkout
       const paymentResponse = await RazorpayCheckout.open(options);

       console.log('Razorpay payment response:', paymentResponse);

      // Handle successful payment
      if (paymentResponse && paymentResponse.razorpay_payment_id) {
        return {
          success: true,
          transactionId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          signature: paymentResponse.razorpay_signature,
          amount: amount,
          paymentMethod: 'razorpay',
          timestamp: new Date().toISOString(),
          response: paymentResponse
        };
      } else {
        throw new Error('Invalid payment response from Razorpay');
      }

         } catch (error) {
       console.error('Razorpay payment error:', error);
       
       // Check if it's a null reference error (library not properly linked)
       if (error.message && (
         error.message.includes('Cannot read property') && error.message.includes('null') ||
         error.message.includes('open') && error.message.includes('null') ||
         error.message.includes('RazorpayCheckout') && error.message.includes('null')
       )) {
         console.warn('Razorpay library not properly linked, falling back to mock payment');
         return await this.processMockPayment(paymentData);
       }
       
       // Handle specific Razorpay error codes
       if (error.code === 'PAYMENT_CANCELLED') {
         throw new Error('Payment was cancelled by user');
       } else if (error.code === 'NETWORK_ERROR') {
         throw new Error('Network error. Please check your connection.');
       } else if (error.code === 'INVALID_PAYMENT_METHOD') {
         throw new Error('Invalid payment method selected.');
       } else {
         throw new Error(error.message || 'Payment failed. Please try again.');
       }
     }
  }

  // Mock payment fallback when Razorpay is not available
  static async processMockPayment(paymentData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 80% success rate for mock payments
        const isSuccess = Math.random() > 0.2;
        
        if (isSuccess) {
          resolve({
            success: true,
            transactionId: `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId: paymentData.orderId,
            signature: 'mock_signature',
            amount: paymentData.amount,
            paymentMethod: 'razorpay_mock',
            timestamp: new Date().toISOString(),
            response: { mock: true }
          });
        } else {
          reject(new Error('Mock payment failed. Please try again.'));
        }
      }, 2000); // 2 second delay to simulate processing
    });
  }

  static async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      // This would typically call your backend to create a Razorpay order
      // For now, we'll generate a local order ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        id: orderId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  static async verifyPayment(paymentId, orderId, signature) {
    try {
      // This would typically call your backend to verify the payment
      // For now, we'll return a mock verification
      console.log('Verifying payment:', { paymentId, orderId, signature });
      
      return {
        verified: true,
        paymentId: paymentId,
        orderId: orderId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new Error('Payment verification failed');
    }
  }

  static getSupportedPaymentMethods() {
    return [
      'card',
      'netbanking',
      'wallet',
      'upi',
      'paylater'
    ];
  }

  static validatePaymentData(paymentData) {
    const { amount, customerName, customerEmail } = paymentData;
    
    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    if (!customerName || customerName.trim().length === 0) {
      throw new Error('Customer name is required');
    }
    
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      throw new Error('Valid customer email is required');
    }
    
    return true;
  }

     // Check if Razorpay is available
   static isAvailable() {
     return RazorpayCheckout !== null && RazorpayCheckout.open !== null;
   }
}

export default RazorpayService; 