# Invoice Generation Setup

This guide will help you set up the invoice generation feature in the FarmFerry User app.

## Required Packages

The invoice generation feature requires the following Expo packages. Please install them using npm:

```bash
npm install expo-print expo-sharing expo-file-system
```

## Features

The new invoice generation system provides the following features:

### 1. Local PDF Generation
- Generates professional PDF invoices directly inside the app
- No need to download from external servers
- Works offline once order data is loaded

### 2. Beautiful Invoice Design
- Professional HTML-based invoice template
- FarmFerry branding with gradient header
- Responsive design that works on all devices
- Includes all order details, customer info, and supplier info

### 3. Multiple Sharing Options
- **Share Invoice**: Opens native sharing dialog to share via email, messaging, etc.
- **Save to Device**: Saves the PDF to the device's documents folder
- **Cancel**: Dismisses the dialog without taking action

### 4. Enhanced User Experience
- Loading indicators during generation
- Error handling with user-friendly messages
- Success confirmations with file paths
- Works on both iOS and Android

## How It Works

1. **Order Details**: When a user taps the "Invoice" button on a delivered order, the app fetches complete order details including customer and supplier information.

2. **PDF Generation**: The `InvoiceService` generates a professional HTML invoice and converts it to PDF using `expo-print`.

3. **User Options**: The user is presented with options to either share the invoice or save it to their device.

4. **File Management**: The PDF is temporarily stored and can be shared or saved permanently.

## Invoice Content

The generated invoice includes:

- **Header**: FarmFerry branding with tagline
- **Invoice Details**: Order ID, dates, status, payment info
- **Customer Information**: Name, email, phone, delivery address
- **Supplier Information**: Business name, contact details
- **Order Items**: Product list with variations, quantities, prices
- **Price Summary**: Subtotal, discounts, taxes, delivery charges, total
- **Footer**: Thank you message and generation timestamp

## Technical Implementation

### Files Modified:
- `app/services/invoiceService.js` - New invoice generation service
- `app/screens/OrdersScreen.js` - Updated invoice button functionality
- `app/screens/OrderDetailsScreen.js` - Updated invoice button functionality

### Key Components:
- `InvoiceService.generateInvoicePDF()` - Main PDF generation function
- `InvoiceService.generateInvoiceHTML()` - HTML template generation
- `InvoiceService.shareInvoice()` - Native sharing functionality
- `InvoiceService.saveInvoiceToDevice()` - File saving functionality

## Troubleshooting

### Common Issues:

1. **"Sharing not available"**: This may occur on some devices or simulators. The invoice is still generated successfully.

2. **"Failed to save invoice"**: Check if the app has proper file system permissions.

3. **"Failed to generate invoice"**: Ensure all required packages are installed and the order data is complete.

### Debug Information:
- Check console logs for detailed error messages
- Verify that order data includes customer and supplier information
- Ensure the device has sufficient storage space

## Future Enhancements

Potential improvements for the invoice system:

1. **Custom Templates**: Allow users to choose different invoice styles
2. **Email Integration**: Direct email sending from the app
3. **Cloud Storage**: Save invoices to cloud storage services
4. **Digital Signatures**: Add digital signature capabilities
5. **Multi-language Support**: Support for different languages
6. **Tax Calculations**: More sophisticated tax calculation logic

## Support

If you encounter any issues with the invoice generation feature, please check:

1. All required packages are installed
2. Device has sufficient storage space
3. App has proper permissions
4. Order data is complete and valid

For technical support, refer to the console logs and error messages for detailed information. 