# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Scytro** is a self-mobile checkout application built for the Smart India Hackathon by Team Web Shooters from Gandhi Engineering College. It's a React-based PWA that enables customers to scan product barcodes, manage shopping carts, and process payments without traditional checkout queues.

## Architecture

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Frontend**: React 18 with TypeScript and JSX
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React
- **Barcode/QR Scanning**: 
  - MediaPipe Tasks Vision (primary)
  - ZXing Browser Library (fallback)
  - jsQR (QR code fallback)
  - Native BarcodeDetector API (when available)

### Application Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with fonts & metadata
│   │   ├── page.tsx           # Main app component (screen router)
│   │   └── globals.css        # Global styles
│   └── components/            # React components
│       ├── IntroScreen.jsx    # Landing/welcome screen
│       ├── LoginScreen.jsx    # Multi-role authentication
│       ├── UserDashboard.jsx  # Customer dashboard
│       ├── ScannerComponent.jsx    # Advanced barcode scanner
│       ├── QRScannerComponent.jsx  # Receipt QR verification
│       ├── CartComponent.jsx       # Shopping cart management
│       ├── PaymentComponent.jsx    # Payment processing
│       ├── AdminDashboard.tsx      # Inventory management
│       └── SecurityDashboard.jsx   # Receipt verification
```

### User Roles & Authentication
The app supports three user types with different ID formats:
- **Customers**: Phone number + OTP verification
- **Inventory Admin**: ID format `IA####` (e.g., IA1234) + password + OTP
- **Security Staff**: ID format `SA####` (e.g., SA1234) + password + OTP

### Scanning Architecture
The scanner uses a multi-layer detection approach for maximum reliability:

1. **Native BarcodeDetector** (when supported) - Fastest, browser-native
2. **MediaPipe Tasks Vision** - AI-powered, most accurate for complex scenarios
3. **ZXing Browser** - Reliable fallback for standard barcodes  
4. **jsQR** - QR code specific fallback

Key scanner features:
- Continuous autofocus and exposure control
- Torch/flashlight support on capable devices
- Pinch-to-zoom and scroll wheel zoom
- Enhanced image preprocessing for better detection
- Debouncing to prevent duplicate scans (2.5s window)
- Real-time status feedback and error handling

## Development Commands

### Setup & Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Development Server
- **Local URL**: http://localhost:3000
- **Network Access**: Available on local network for mobile testing
- **HTTPS Requirement**: Camera access requires HTTPS in production

### Testing Scanner Functionality
```bash
# Test with mobile device on same network
# Find your local IP
ipconfig  # Windows
# Access via https://YOUR_IP:3000 (may need HTTPS for camera)

# For local testing without physical products:
# Use the "Simulate Scan" buttons in scanner components
```

## Key Implementation Details

### Camera Configuration
The scanner initializes with optimal camera settings:
```javascript
const constraints = {
  video: {
    facingMode: 'environment',  // Back camera
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
    frameRate: { ideal: 30, min: 15 }
  }
};

// Enhanced settings applied after initialization
const settings = {
  advanced: [{
    focusMode: 'continuous',        // Continuous autofocus
    exposureMode: 'continuous',     // Auto exposure
    whiteBalanceMode: 'continuous'  // Auto white balance
  }]
};
```

### Product Database
Mock product database in `src/app/page.tsx`:
```javascript
const mockDatabase = {
  '8901030895146': { id: 1, name: 'Tata Salt', brand: '1kg Pack', price: 28, category: 'Grocery' },
  '8901552490067': { id: 2, name: 'Maggi Noodles', brand: '70g Pack', price: 14, category: 'Instant Food' },
  // ... more products
};
```

### Screen Navigation System
The app uses a state-based screen router:
- `intro` → `login`/`register` → role-specific dashboards
- Screens: intro, login, register, userDashboard, scanner, cart, payment, adminDashboard, securityDashboard, qrScanner

### Animation System
Custom Tailwind animations defined in `tailwind.config.js`:
- `slide-in-from-right`: Screen transitions
- `fade-in`: Element appearances  
- `zoom-in`: Button interactions
- Scanner-specific CSS animations: `scan-pulse`, `scan-focus`, `scanSweep`

## Browser Compatibility & Requirements

### Supported Browsers
- **Chrome/Edge**: Full feature support (recommended)
- **Firefox**: Full support with MediaPipe
- **Safari**: iOS/macOS support with some limitations
- **Mobile browsers**: Full support with camera access

### Requirements
- **HTTPS**: Required for camera access in production
- **Camera permissions**: Essential for scanning functionality
- **Modern JavaScript**: ES6+ features used throughout
- **WebRTC support**: For camera stream access

## Scanner Troubleshooting

### Common Issues & Solutions

**Camera Access Denied**:
- Ensure HTTPS connection
- Check browser permissions
- Verify no other apps using camera
- Try different browser

**Poor Scanning Performance**:
- Use torch/flashlight in low light
- Ensure steady hand positioning
- Clean camera lens
- Try different scanning angles
- Check if barcode is in scanner database

**Scanner Not Working**:
- Refresh page to reinitialize
- Check browser console for errors
- Verify camera device availability
- Test with different barcode types

### Debug Information
Scanner components log detailed information to browser console:
- `[Scanner][MediaPipe]`: MediaPipe detection events
- `[Scanner][ZXing]`: ZXing fallback detection
- `[Scanner][jsQR]`: QR code detection
- `[QRScanner]`: Receipt verification events

## Recent Enhancements (per SCANNER_FIXES.md)

### Major Scanner Improvements
- **Enhanced Camera Initialization**: Proper focus controls, torch support
- **Multi-Detection Pipeline**: MediaPipe → ZXing → jsQR fallback chain
- **Improved Visual Feedback**: Status indicators, scanning animations
- **Better Error Handling**: Graceful fallbacks, user guidance
- **Performance Optimization**: Frame skipping, efficient scanning loops

### Detection Reliability
- **Barcode Detection**: 90%+ improvement in detection rates
- **QR Code Detection**: 85%+ improvement with 50ms scan intervals
- **Focus Performance**: Continuous autofocus for sharp images
- **Error Recovery**: Prevents scanner freezing

## File Organization

### Core Components
- `page.tsx`: Main application state management and screen routing
- `ScannerComponent.jsx`: Advanced barcode scanning with multi-library support
- `QRScannerComponent.jsx`: Receipt verification QR scanner
- `layout.tsx`: App-wide configuration, fonts, and metadata

### Styling
- `globals.css`: Tailwind imports and custom scanner animations
- `tailwind.config.js`: Custom animation definitions and theme extensions
- Component-level: Tailwind utility classes with custom scanner styles

## Development Best Practices

### Code Style
- Use functional components with hooks
- Implement proper error boundaries for camera operations
- Follow React best practices for state management
- Use TypeScript for type safety where applicable

### Scanner Development
- Always test camera initialization error paths
- Implement proper cleanup in useEffect returns
- Use refs for video/canvas elements to avoid re-renders
- Test on actual mobile devices for accuracy

### Mobile Considerations
- Design for mobile-first experience
- Test camera access on various devices
- Ensure touch gestures work properly (pinch-to-zoom)
- Optimize for different screen sizes and orientations

## Testing Strategy

### Manual Testing
- Test all user role login flows
- Verify camera permissions across browsers
- Test scanning with physical products
- Validate payment flow completion
- Check admin inventory management
- Verify security receipt scanning

### Mobile Device Testing
- Test on iOS Safari and Android Chrome
- Verify camera access and torch functionality
- Test barcode scanning in various lighting conditions
- Validate pinch-to-zoom gestures work correctly
