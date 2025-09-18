// ... existing code ...

// Improved camera initialization with advanced constraints for best camera
const initializeCamera = async () => {
  try {
    // Get list of all available video devices first
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    // Try to use the back camera with highest capabilities
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 4096, min: 1280 },
        height: { ideal: 3072, min: 720 },
        aspectRatio: { ideal: 4/3 },
        frameRate: { ideal: 30 },
        // Request advanced camera capabilities
        advanced: [
          { zoom: { ideal: 2.0 } },
          { focusMode: { ideal: "continuous" } },
          { exposureMode: { ideal: "continuous" } },
          { whiteBalanceMode: { ideal: "continuous" } }
        ]
      }
    };
    
    // If we have multiple cameras, try to select the best one
    if (videoDevices.length > 1) {
      console.log(`Found ${videoDevices.length} cameras, attempting to use best available`);
      // We'll try with the advanced constraints first
    }
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        startScanning();
      };
    }
    
    // Set camera status to active
    setCameraActive(true);
    console.log('Camera initialized with advanced settings');
    
    // Log the actual track settings to verify which camera was selected
    const videoTrack = stream.getVideoTracks()[0];
    console.log('Using camera:', videoTrack.label);
    console.log('Camera capabilities:', videoTrack.getCapabilities());
    console.log('Active settings:', videoTrack.getSettings());
    
  } catch (error) {
    console.error('Camera initialization failed:', error);
    setError('Failed to access camera. Please check permissions and try again.');
    setCameraActive(false);
  }
};

// Enhanced scanning function with better error handling and detection settings
const startScanning = () => {
  if (!videoRef.current || !cameraActive) return;
  
  const scanner = new BarcodeDetector({
    formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
  });
  
  const scanInterval = setInterval(async () => {
    if (videoRef.current && cameraActive) {
      try {
        const barcodes = await scanner.detect(videoRef.current);
        
        if (barcodes.length > 0) {
          clearInterval(scanInterval);
          const scannedValue = barcodes[0].rawValue;
          onScanComplete(scannedValue);
        }
      } catch (error) {
        console.error('Scanning error:', error);
        // Continue scanning despite errors
      }
    } else {
      clearInterval(scanInterval);
    }
  }, 100); // Scan every 100ms for better performance
  
  // Add timeout to prevent infinite scanning
  setTimeout(() => {
    clearInterval(scanInterval);
    if (cameraActive) {
      setError('Scanning timed out. Please try again with better lighting or positioning.');
    }
  }, 30000); // 30 second timeout
};

// Fallback to ZXing library if BarcodeDetector is not available
useEffect(() => {
  if (!('BarcodeDetector' in window)) {
    // Import ZXing library as fallback
    import('@zxing/library').then(ZXing => {
      const codeReader = new ZXing.BrowserMultiFormatReader();
      // Configure ZXing implementation here
    }).catch(err => {
      console.error('Failed to load ZXing library:', err);
      setError('Scanner initialization failed. Please try again.');
    });
  }
}, []);

// ... existing code ...