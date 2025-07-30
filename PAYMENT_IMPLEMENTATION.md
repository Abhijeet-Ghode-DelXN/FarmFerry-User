# Payment Implementation Guide

## Overview

This document describes the comprehensive payment implementation for the FarmFerry mobile app, including UPI payments, mock payment services, and payment status tracking.

## Features Implemented

### 1. UPI Payment Integration
- **Google Pay** integration
- **PhonePe** integration  
- **Custom UPI ID** support
- **BHIM** and other UPI apps support
- Real-time payment status tracking

### 2. Mock Payment Service
- Simulated payment processing for testing
- Configurable success rates
- Network delay simulation
- Error handling and retry mechanisms

### 3. Payment Status Tracking
- Real-time payment status updates
- Payment success/failure handling
- Retry functionality
- Detailed payment information display

### 4. Payment Configuration
- Centralized payment settings
- Configurable limits and validation rules
- Error message management
- UI configuration options

## File Structure

```
app/
├── services/
│   └── paymentService.js          # Main payment service
├── constants/
│   └── paymentConfig.js           # Payment configuration
├── screens/
│   ├── CheckoutScreen.js          # Checkout with payment options
│   └── PaymentStatusScreen.js     # Payment status tracking
└── navigation/
    └── AppNavigator.js            # Navigation with payment routes
```

## Payment Flow

### 1. Checkout Process
1. User selects items and proceeds to checkout
2. User chooses payment method (COD or Online Payment)
3. For online payment, user selects UPI app or enters custom UPI ID
4. Payment is processed through the selected method
5. User is redirected to payment status screen

### 2. Payment Processing
1. **UPI Payment**: Uses `react-native-upi-pay` library
2. **Mock Payment**: Simulated payment for testing
3. **Validation**: Amount, UPI ID, and order data validation
4. **Error Handling**: Comprehensive error handling and user feedback

### 3. Payment Status Tracking
1. Real-time status updates
2. Success/failure handling
3. Retry functionality
4. Order confirmation

## Configuration

### Payment Limits
```javascript
LIMITS: {
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 100000,
  MAX_RETRIES: 3,
}
```

### UPI Configuration
```javascript
UPI: {
  MERCHANT_ID: 'farmferry@okicici',
  MERCHANT_NAME: 'FarmFerry',
  VALIDATION_REGEX: /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/,
}
```

### Test Configuration
```javascript
TEST: {
  ENABLED: __DEV__, // Enable in development
  SUCCESS_RATE: 0.8, // 80% success rate
  MOCK_DELAY: 2000, // 2 seconds delay
}
```

## Usage Examples

### Basic Payment Processing
```javascript
import PaymentService from '../services/paymentService';

// Process UPI payment
const paymentResult = await PaymentService.processPayment(
  'gpay',
  1000,
  'ORDER_123',
  {}
);

// Process custom UPI payment
const paymentResult = await PaymentService.processPayment(
  'upi_id',
  1000,
  'ORDER_123',
  { upiId: 'user@upi' }
);
```

### Payment Validation
```javascript
import { PaymentValidator } from '../services/paymentService';

// Validate payment amount
PaymentValidator.validatePaymentAmount(1000);

// Validate UPI ID
UPIPaymentService.validateUPIId('user@upi');
```

### Payment Status Tracking
```javascript
import { PaymentStatusTracker } from '../services/paymentService';

// Track payment status
const status = await PaymentStatusTracker.trackPaymentStatus('TXN_123');
```

## Error Handling

### Common Error Messages
- `Invalid payment amount`
- `Payment amount exceeds maximum limit`
- `Invalid UPI ID format`
- `Payment failed. Please try again.`
- `Payment was cancelled by user`

### Error Handling in Components
```javascript
try {
  const result = await PaymentService.processPayment(method, amount, orderId);
  // Handle success
} catch (error) {
  // Handle error
  Alert.alert('Payment Failed', error.message);
}
```

## Testing

### Mock Payment Testing
The mock payment service simulates real payment processing:

```javascript
// Mock payment with 80% success rate
const result = await MockPaymentService.processPayment('card', 1000, 'ORDER_123');
```

### UPI Testing
For UPI testing, use the configured merchant ID or test UPI IDs:

```javascript
// Test with default merchant ID
const result = await UPIPaymentService.processUPIPayment(
  UpiPay.UPI_APPS.GOOGLE_PAY,
  1000,
  'ORDER_123'
);
```

## Security Considerations

### Payment Data
- All payment data is validated before processing
- Sensitive information is not logged
- Transaction IDs are generated securely
- Payment status is verified before order confirmation

### UPI Security
- UPI ID validation using regex patterns
- Payment amount limits enforced
- Transaction reference generation with timestamps
- Error handling for failed transactions

## Future Enhancements

### Planned Features
1. **Razorpay Integration**: Direct Razorpay payment gateway integration
2. **Stripe Integration**: International payment support
3. **Wallet Integration**: Digital wallet payment support
4. **Net Banking**: Direct bank transfer support
5. **Payment Analytics**: Payment success rate tracking
6. **Refund Processing**: Automated refund handling

### Payment Gateway Integration
```javascript
// Future Razorpay integration
export class RazorpayService {
  static async processPayment(paymentData) {
    // Razorpay payment processing
  }
}

// Future Stripe integration
export class StripeService {
  static async processPayment(paymentData) {
    // Stripe payment processing
  }
}
```

## Troubleshooting

### Common Issues

1. **UPI App Not Found**
   - Check if UPI app is installed
   - Verify app package name
   - Test with different UPI apps

2. **Payment Timeout**
   - Check network connectivity
   - Verify UPI app is working
   - Retry payment after delay

3. **Invalid UPI ID**
   - Verify UPI ID format
   - Check for typos
   - Use valid UPI ID format

### Debug Mode
Enable debug logging in development:

```javascript
// In paymentService.js
console.log('Payment debug:', {
  method: paymentMethod,
  amount: amount,
  orderId: orderId
});
```

## API Reference

### PaymentService
- `processPayment(method, amount, orderId, options)`: Process payment
- `getAvailablePaymentMethods()`: Get available payment methods

### UPIPaymentService
- `processUPIPayment(app, amount, orderId, customUpiId)`: Process UPI payment
- `validateUPIId(upiId)`: Validate UPI ID format
- `checkUPIAppsAvailability()`: Check available UPI apps

### PaymentValidator
- `validatePaymentAmount(amount)`: Validate payment amount
- `validateOrderData(orderData)`: Validate order data

### PaymentStatusTracker
- `trackPaymentStatus(transactionId)`: Track payment status

## Support

For payment-related issues:
1. Check the error logs
2. Verify payment configuration
3. Test with mock payments
4. Contact development team

## Version History

- **v1.0.0**: Initial payment implementation with UPI support
- **v1.1.0**: Added payment status tracking
- **v1.2.0**: Enhanced error handling and validation
- **v1.3.0**: Added comprehensive configuration system 