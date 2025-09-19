'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Scan, Plus, Minus, Trash2 } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

const WorkingScannerComponent = ({ 
  setCurrentScreen, 
  scannedProducts, 
  simulateBarcodeScan, 
  updateQuantity, 
  removeProduct, 
  slideIn 
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionTimeoutRef = useRef(0);
  const zxingReaderRef = useRef(null);

  const [isScanning, setIsScanning] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [status, setStatus] = useState('Ready to scan');
  const [cameraError, setCameraError] = useState('');
  const [detectionMethod, setDetectionMethod] = useState('None');

  // Auto-initialize scanner and camera
  useEffect(() => {
    let retryTimeout;
    let errorCount = 0;
    const maxRetries = 3;
    
    const initializeScanner = async () => {
      try {
        // Initialize ZXing
        zxingReaderRef.current = new BrowserMultiFormatReader();
        console.log('✅ ZXing initialized');
        
        // Automatically start camera and scanning
        await startCamera();
        setIsScanning(true);
        
      } catch (error) {
        console.error('Scanner initialization failed:', error);
        errorCount++;
        
        if (errorCount < maxRetries) {
          console.log(`Retrying initialization (${errorCount}/${maxRetries})...`);
          retryTimeout = setTimeout(initializeScanner, 2000);
        } else {
          setCameraError('Failed to initialize scanner after multiple attempts. Please try again.');
        }
      }
    };

    initializeScanner();

    // Cleanup function
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      stopCamera();
    };
  }, []);

  // ✅ Play beep on success
  const playSuccessSound = () => {
    try {
      const audio = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2+LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1+LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y'
      );
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  };

  // Automated camera start with error recovery
  const startCamera = async () => {
    try {
      setStatus('Starting camera...');
      setCameraError('');

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 10 },
        },
      };

      // Try to get the best available camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      // Prefer back camera if available
      const backCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('rear')
      );
      
      if (backCamera) {
        constraints.video.deviceId = { exact: backCamera.deviceId };
      }

      console.log('📷 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!videoRef.current) throw new Error('Video element not available');

      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      // Wait for video to be ready with timeout
      await Promise.race([
        new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => resolve();
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Video load timeout')), 10000)
        )
      ]);

      setCameraStarted(true);
      setStatus('Camera ready - scanning for barcodes');

      // Auto-start continuous ZXing scanning
      const reader = zxingReaderRef.current;
      if (!reader) throw new Error('ZXing reader not initialized');

      reader.decodeFromVideoElementContinuously(videoRef.current, (result, err) => {
        if (result) {
          handleBarcodeDetected(result.getText(), 'ZXing');
        } else if (err && !(err instanceof NotFoundException)) {
          // Only log non-"not found" errors
          console.warn('ZXing error:', err);
        }
      });

      // Auto-resume scanning after visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
    } catch (error) {
      console.error('❌ Camera failed:', error);
      let errorMessage = 'Camera access failed: ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on your device';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is in use by another application';
      } else {
        errorMessage += error.message;
      }
      
      setCameraError(errorMessage);
    }
  };

  // Handle visibility changes for auto-resume
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Pause scanning when tab is hidden
      setIsScanning(false);
      setStatus('Scanner paused - tab inactive');
    } else {
      // Auto-resume when tab becomes visible
      setIsScanning(true);
      setStatus('Scanning for barcodes');
    }
  };

  // Enhanced camera cleanup
  const stopCamera = () => {
    setIsScanning(false);

    // Remove visibility change listener
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset ZXing reader
    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch (e) {
        console.warn('ZXing reset error:', e);
      }
    }

    setCameraStarted(false);
    setStatus('Camera stopped');
    setDetectionMethod('None');
  };

  const startScanning = () => {
    setIsScanning(true);
    setStatus('Scanning...');
  };

  const stopScanning = () => {
    setIsScanning(false);
    setStatus('Paused');
  };

  // ✅ Handle detected barcode
  const handleBarcodeDetected = (code, method = 'ZXing') => {
    const now = Date.now();
    if (now - detectionTimeoutRef.current < 2000) return;
    detectionTimeoutRef.current = now;

    console.log(`🎯 BARCODE DETECTED [${method}]: ${code}`);
    setStatus(`✅ Detected: ${code.slice(-8)}`);
    setDetectionMethod(method);

    playSuccessSound();

    const productDb = (typeof window !== 'undefined' && window.productDatabase) || {};
    const product = productDb[code];

    if (product) {
      simulateBarcodeScan({ ...product, quantity: 1 });
    } else {
      simulateBarcodeScan({
        id: Date.now(),
        name: `Unknown Product (${code.slice(-6)})`,
        brand: 'Unrecognized',
        price: 0,
        category: 'Unknown',
        quantity: 1,
      });
    }

     setTimeout(() => {
      if (cameraStarted && isScanning) setStatus('Scanning...');
    }, 2000);
  };
  return (
    <div className={`min-h-screen bg-black flex flex-col ${slideIn}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
        <button
          onClick={() => {
            stopCamera();
            setCurrentScreen('userDashboard');
          }}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-bold">Scan Products</h2>
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
            <span className="text-white text-sm font-bold">
              {scannedProducts.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {cameraError ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-red-400 text-center mb-4">
              <div className="text-xl font-bold mb-2">❌ Camera Error</div>
              <div className="text-sm">{cameraError}</div>
            </div>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl shadow hover:bg-yellow-600 transition"
            >
              🔄 Retry Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-80 border-2 border-yellow-400/50 rounded-3xl relative">
                {/* Scanning Animation */}
                {isScanning && (
                  <div className="absolute inset-0 border-2 border-yellow-400 rounded-3xl animate-pulse">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
                  </div>
                )}

                {/* Corner Brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400"></div>

                {/* Center Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-yellow-400 rounded-full"></div>
                  <div className="absolute w-0.5 h-8 bg-yellow-400 rounded-full"></div>
                </div>

                {/* Detection Method Indicator */}
                {detectionMethod !== 'None' && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                    {detectionMethod}
                  </div>
                )}
              </div>
            </div>

            {/* Scanning Status Indicator */}
            <div className="absolute bottom-24 left-4 right-4 flex justify-center">
              <div className={`px-6 py-3 rounded-xl backdrop-blur-sm ${
                isScanning ? 'bg-green-500/20 border border-green-400/30' : 
                cameraStarted ? 'bg-yellow-500/20 border border-yellow-400/30' : 
                'bg-red-500/20 border border-red-400/30'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isScanning ? 'bg-green-400 animate-pulse' : 
                    cameraStarted ? 'bg-yellow-400' : 
                    'bg-red-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isScanning ? 'text-green-100' : 
                    cameraStarted ? 'text-yellow-100' : 
                    'text-red-100'
                  }`}>{status}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-black/90 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isScanning
                ? 'bg-green-400 animate-pulse'
                : cameraStarted
                ? 'bg-yellow-400'
                : 'bg-red-400'
            }`}
          ></div>
          <p className="text-white/90 text-center font-medium text-sm">
            {status}
          </p>
        </div>

        {/* Detection Capabilities */}
        <div className="flex justify-center space-x-4 text-xs text-white/60">
          <span>📡 ZXing✅</span>
        </div>
      </div>

      {/* Scanned Items */}
      <div className="bg-white rounded-t-3xl p-6 max-h-80 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">
            Scanned Items ({scannedProducts.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {scannedProducts.length === 0 ? (
            <div className="text-center py-8">
              <Scan className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold">No items scanned yet</p>
              <p className="text-gray-400 text-sm font-medium">
                Point camera at barcodes
              </p>
            </div>
          ) : (
            scannedProducts.map((item) => (
              <div
                key={item.id}
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600 font-medium">
                    {item.brand}
                  </p>
                  <p className="font-bold text-yellow-600">₹{item.price}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="font-bold text-gray-900 w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => removeProduct(item.id)}
                    className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {scannedProducts.length > 0 && (
          <button
            onClick={() => {
              stopCamera();
              setCurrentScreen('cart');
            }}
            className="w-full bg-yellow-500 text-white font-bold py-4 rounded-2xl mt-4 transform transition-all duration-200 hover:bg-yellow-600 active:scale-95"
          >
            Proceed to Cart • ₹
            {scannedProducts.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkingScannerComponent;