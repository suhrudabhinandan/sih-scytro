# Scytro - Self-Mobile Checkout App

A modern React-based self-checkout application with barcode scanning, multiple user roles, and payment processing.

## Features

### 🛒 Customer Features
- **Barcode Scanning**: Real camera integration for product scanning
- **Shopping Cart**: Add, remove, and manage items
- **Payment Processing**: Multiple payment methods (Card, QR)
- **User Registration**: Phone number + OTP verification
- **Order History**: Track purchase history

### 👨‍💼 Admin Features
- **Inventory Management**: Add and manage products
- **Sales Analytics**: View daily sales and metrics
- **Product Database**: Mock database with common products

### 🛡️ Security Features
- **Receipt Verification**: QR code scanning for receipt validation
- **Transaction Monitoring**: Track and verify customer purchases
- **Security Dashboard**: Monitor recent verifications

## Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling and animations
- **Lucide React** - Icon library
- **WebRTC** - Camera access for barcode scanning

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd scytro-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/
│   ├── IntroScreen.jsx          # Landing page
│   ├── LoginScreen.jsx          # User login (Customer/Admin/Security)
│   ├── RegisterScreen.jsx       # Registration type selection
│   ├── RegisterUserForm.jsx     # Customer registration
│   ├── UserDashboard.jsx        # Customer dashboard
│   ├── ScannerComponent.jsx     # Barcode scanner
│   ├── CartComponent.jsx        # Shopping cart
│   ├── PaymentComponent.jsx     # Payment processing
│   ├── SecurityDashboard.jsx    # Security staff dashboard
│   ├── QRScannerComponent.jsx   # Receipt QR scanner
│   └── AdminDashboard.jsx       # Admin dashboard
├── App.jsx                      # Main application component
├── main.jsx                     # Application entry point
└── index.css                    # Global styles and Tailwind imports
```

## Usage

### For Customers
1. **Start Shopping**: Click "Start Shopping" on the intro screen
2. **Scan Products**: Use the camera to scan product barcodes
3. **Manage Cart**: Add/remove items and adjust quantities
4. **Checkout**: Proceed to payment and complete purchase

### For Admins
1. **Login**: Select "Inventory Admin" and enter credentials
2. **Manage Products**: Add new products to the database
3. **View Analytics**: Monitor sales and inventory metrics

### For Security Staff
1. **Login**: Select "Security Staff" and enter credentials
2. **Verify Receipts**: Scan QR codes on customer receipts
3. **Monitor Activity**: View recent verification history

## Mock Data

The app includes a mock product database with common items:
- Tata Salt (₹28)
- Maggi Noodles (₹14)
- Britannia Bread (₹45)
- Amul Milk (₹60)
- Fortune Oil (₹165)

## Camera Permissions

The app requires camera access for barcode scanning. When prompted:
1. Click "Allow" to grant camera permissions
2. Point the camera at product barcodes
3. Use the "Simulate Scan" button for testing without physical products

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Customization

- **Styling**: Modify Tailwind classes in component files
- **Products**: Update the `mockDatabase` object in `App.jsx`
- **Animations**: Adjust animation classes in `tailwind.config.js`

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Team

**Team Web Shooters** - Gandhi Engineering College

## License

This project is created for educational purposes as part of the Smart India Hackathon.

