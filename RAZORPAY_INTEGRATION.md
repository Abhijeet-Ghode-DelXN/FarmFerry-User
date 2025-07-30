# Razorpay Integration - FarmFerry User App

## Overview
Razorpay payment gateway integration for FarmFerry User app with test credentials.

## Test Credentials
```
RAZORPAY_KEY_ID: rzp_test_Sbs1ZuKmKT2RXE
RAZORPAY_KEY_SECRET: 0qbempWNDNxKOu5QYGKe7Jvz
```

## Features
- ✅ Razorpay Checkout Integration
- ✅ Multiple Payment Methods (Cards, UPI, Net Banking)
- ✅ Test Mode Support
- ✅ Error Handling
- ✅ Payment Validation

## Files Modified
1. `app/constants/paymentConfig.js` - Added Razorpay config
2. `app/services/razorpayService.js` - New Razorpay service
3. `app/services/paymentService.js` - Integrated Razorpay
4. `app/screens/CheckoutScreen.js` - Added Razorpay option
5. `app/screens/RazorpayTestScreen.js` - Test screen
6. `app/navigation/AppNavigator.js` - Added test screen route

## Testing
1. Go to Settings → "Test Razorpay Payment"
2. Use test card: 4111 1111 1111 1111
3. Any future expiry date
4. Any 3-digit CVV

## Usage
Razorpay is now available as a payment option in checkout with full integration. 