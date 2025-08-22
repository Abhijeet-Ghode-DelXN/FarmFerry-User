# FarmFerry Registration Flow with OTP Verification

## Overview
This document describes the comprehensive registration flow implemented in the FarmFerry mobile application, which includes a two-step process: user registration followed by phone number verification via OTP.

## Flow Architecture

### 1. Registration Form (Phase 1)
- **Location**: `app/screens/RegisterScreen.js`
- **Purpose**: Collects user information and validates input before proceeding to OTP verification
- **Fields**:
  - Full Name (required)
  - Email Address (required, validated)
  - Phone Number (required, 10-digit format)
  - Password (required, minimum 6 characters)
  - Confirm Password (required, must match password)
- **Backend Action**: Sends data to `/auth/register/validate` for validation (user NOT created yet)

### 2. OTP Verification (Phase 2)
- **Location**: `app/components/forms/OTPVerificationForm.js`
- **Purpose**: Verifies phone number through SMS OTP before completing registration
- **Features**:
  - Automatic OTP sending on component mount
  - 60-second countdown timer for resend functionality
  - Input validation (6-digit code)
  - Error handling and user feedback

### 3. Registration Completion (Phase 3)
- **Purpose**: Finalizes user account creation after successful OTP verification
- **Backend Action**: Sends verified data to `/auth/register/complete` to create the actual user account

## Implementation Details

### State Management
The registration process uses React state to manage:
- Form data (name, email, phone, password, confirmPassword)
- Loading states (registration, OTP sending, verification)
- UI state (show OTP verification, registration data)

### API Integration
- **Registration Validation Endpoint**: `POST /auth/register/validate` (Phase 1)
- **Send OTP Endpoint**: `POST /auth/send-phone-verification` (Phase 2)
- **Verify OTP Endpoint**: `POST /auth/verify-phone-otp` (Phase 2)
- **Registration Completion Endpoint**: `POST /auth/register/complete` (Phase 3)

### Validation Rules
- **Email**: Must be a valid email format
- **Phone**: Must be exactly 10 digits (no country code)
- **Password**: Minimum 6 characters
- **Confirm Password**: Must match password exactly

## User Experience Flow

### Step 1: User Registration (Phase 1)
1. User fills out registration form
2. Client-side validation ensures all fields are properly filled
3. Form data is sent to backend validation endpoint (`/auth/register/validate`)
4. Backend validates data and generates OTP (user account NOT created yet)
5. On successful validation, user is automatically moved to OTP verification step

### Step 2: OTP Verification (Phase 2)
1. OTP is automatically sent to user's phone number
2. User enters the 6-digit code received via SMS
3. Code is verified against backend (`/auth/verify-phone-otp`)
4. On successful verification, proceed to final registration

### Step 3: Registration Completion (Phase 3)
1. Verified data is sent to backend completion endpoint (`/auth/register/complete`)
2. Backend creates the actual user account with verified phone number
3. User is redirected to login screen

### Step 4: Account Activation
1. User can now log in with their registered credentials
2. Phone number is marked as verified in the system
3. Full access to application features is granted

## Error Handling

### Registration Errors
- **Validation Errors**: Client-side validation with user-friendly messages
- **API Errors**: Backend error messages displayed to user
- **Network Errors**: Connection issues handled gracefully

### OTP Errors
- **Invalid OTP**: Clear error message with option to retry
- **Expired OTP**: Automatic resend functionality
- **Network Issues**: Retry mechanisms and user guidance

## Security Features

### Data Protection
- Passwords are never logged or stored in plain text
- Sensitive data is cleared from state after successful registration
- API calls use HTTPS for secure transmission

### OTP Security
- 6-digit numeric codes for verification
- 60-second cooldown between resend attempts
- Automatic expiration handling

### Two-Phase Registration Security
- **No premature account creation**: User accounts are only created after OTP verification
- **Prevents unverified registrations**: Users cannot bypass phone verification
- **Clean state management**: If OTP verification fails, no incomplete user data remains
- **Audit trail**: Complete registration process is tracked and logged

## Component Reusability

### OTPVerificationForm Component
The OTP verification component is designed to be reusable across the application:
- **Props**: Configurable title, subtitle, button text
- **Callbacks**: Success, failure, and back navigation handlers
- **Customization**: Back button visibility and auto-send options

### Usage Examples
```javascript
// Basic usage
<OTPVerificationForm
  phone={userPhone}
  onVerificationSuccess={handleSuccess}
  onVerificationFailure={handleFailure}
/>

// Customized usage
<OTPVerificationForm
  phone={userPhone}
  title="Verify Your Number"
  subtitle="Enter the code sent to"
  buttonText="Complete Verification"
  showBackButton={false}
  autoSendOTP={false}
/>
```

## Backend Integration

### API Endpoints
```javascript
// Phase 1: Registration Validation
POST /api/v1/auth/register/validate
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "securepassword"
}

// Phase 2: Send OTP
POST /api/v1/auth/send-phone-verification
{
  "phone": "1234567890",
  "email": "john@example.com"
}

// Phase 2: Verify OTP
POST /api/v1/auth/verify-phone-otp
{
  "phone": "1234567890",
  "otp": "123456",
  "customerId": "optional_customer_id"
}

// Phase 3: Complete Registration
POST /api/v1/auth/register/complete
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "securepassword",
  "otp": "123456",
  "customerId": "customer_id_from_otp_verification"
}
```

### Response Handling
- **Success Responses**: Proper data extraction and state updates
- **Error Responses**: User-friendly error messages
- **Network Issues**: Graceful fallbacks and retry mechanisms

## Testing Considerations

### Unit Tests
- Form validation logic
- State management
- API integration functions

### Integration Tests
- End-to-end registration flow
- OTP verification process
- Error handling scenarios

### User Acceptance Tests
- Form usability
- Error message clarity
- Navigation flow

## Future Enhancements

### Planned Features
- **Email Verification**: Additional email OTP verification
- **Social Login**: Integration with Google, Facebook, Apple
- **Biometric Authentication**: Fingerprint/Face ID support
- **Two-Factor Authentication**: Enhanced security options

### Performance Optimizations
- **Lazy Loading**: Component-level code splitting
- **Caching**: OTP resend optimization
- **Offline Support**: Basic offline form validation

## Troubleshooting

### Common Issues
1. **OTP Not Received**: Check phone number format and network connectivity
2. **Verification Fails**: Ensure OTP is entered correctly and hasn't expired
3. **Registration Errors**: Validate all required fields and check internet connection
4. **Validation Phase Fails**: Check if backend validation endpoint is working
5. **Completion Phase Fails**: Ensure OTP verification was successful before completion
6. **Partial Registration**: User data is only stored temporarily until OTP verification

### Debug Information
- Console logs for registration process
- Network request/response logging
- State change tracking

## Conclusion

The implemented registration flow provides a secure, user-friendly, and robust user onboarding experience. The two-step verification process ensures account security while maintaining a smooth user experience. The modular component design allows for easy maintenance and future enhancements.
