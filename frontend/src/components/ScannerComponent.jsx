'use client'

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Scan, Plus, Minus, Trash2, Zap, ZapOff } from 'lucide-react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/browser';
import { BinaryBitmap, HybridBinarizer, RGBLuminanceSource } from '@zxing/library';
import jsQR from 'jsqr';
// MediaPipe is imported dynamically at runtime to avoid build-time export issues across versions

const ScannerComponent = ({ 
  videoRef, 
  canvasRef, 
  startCamera, 
  stopCamera, 
  setCurrentScreen, 
  scannedProducts, 
  simulateBarcodeScan, 
  updateQuantity, 
  removeProduct, 
  slideIn 
}) => {
  const codeReaderRef = useRef(null);
  const isScanningRef = useRef(false);
  const [statusText, setStatusText] = useState('Scanning...');
  const mpScannerRef = useRef(null);
  const rafIdRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const cameraCapsRef = useRef(null);
  const supportsZoomRef = useRef(false);
  const baseZoomRef = useRef(1);
  const currentZoomRef = useRef(1);
  const pinchStartDistRef = useRef(0);
  const pinchStartZoomRef = useRef(1);
  const pointersRef = useRef(new Map());
  const [cssScale, setCssScale] = useState(1);
  const frameSkipRef = useRef(0);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  // Enhanced camera initialization with proper focus and torch support
  const initializeCamera = async () => {
    try {
      setStatusText('Initializing camera...');
      
      // Get list of available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Select the best back camera
      let selectedDeviceId = null;
      for (const device of videoDevices) {
        if (device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') || 
            device.label.toLowerCase().includes('environment')) {
          selectedDeviceId = device.deviceId;
          break;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          facingMode: selectedDeviceId ? undefined : 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 }
        }
      });

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      videoRef.current.srcObject = stream;
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = resolve;
      });
      
      const track = stream.getVideoTracks()[0];
      cameraTrackRef.current = track;
      
      // Configure optimal settings
      const capabilities = track.getCapabilities();
      cameraCapsRef.current = capabilities;
      
      const settings = {
        advanced: [{
          focusMode: capabilities.focusMode?.includes('continuous') ? 'continuous' : 'manual',
          exposureMode: capabilities.exposureMode?.includes('continuous') ? 'continuous' : 'manual',
          whiteBalanceMode: capabilities.whiteBalanceMode?.includes('continuous') ? 'continuous' : 'manual'
        }]
      };
      
      await track.applyConstraints(settings);
      
      if (capabilities.torch) {
        setTorchSupported(true);
      }
      
      setScannerReady(true);
      setStatusText('Camera ready - scanning...');
      
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setStatusText(`Camera error: ${error.message}`);
      setScannerReady(false);
      throw error;
    }
  };

  useEffect(() => {
    // Initialize scanner with enhanced configuration
    const initializeScanner = async () => {
      await initializeCamera();
      
      // Configure ZXing reader with multiple formats
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      
      codeReaderRef.current = new BrowserMultiFormatReader(hints);
      isScanningRef.current = true;

      const successBeep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y');

      // MediaPipe initialization with better error handling
      const initializeMediaPipe = async () => {
        try {
          setStatusText('Loading MediaPipe...');
          const MP = await import('@mediapipe/tasks-vision');
          const { FilesetResolver, BarcodeScanner } = MP;
          
          if (!FilesetResolver || !BarcodeScanner) {
            throw new Error('MediaPipe components not available');
          }
          
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
          );
          
          mpScannerRef.current = await BarcodeScanner.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/barcode_scanner/barcode_scanner/float16/latest/barcode_scanner.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO'
          });
          
          setStatusText('MediaPipe ready - scanning...');
          return true;
        } catch (error) {
          console.warn('[Scanner] MediaPipe initialization failed:', error);
          setStatusText('Using ZXing scanner...');
          mpScannerRef.current = null;
          return false;
        }
      };

      // In dispatchDetection, use the real product database if available
      const dispatchDetection = (text) => {
        console.log('[Scanner][DispatchDetection] Barcode/QR detected:', text);
        // Try to match barcode with real product database if available
        if (typeof window !== 'undefined' && window.mockDatabase) {
          const product = window.mockDatabase[text];
          if (product) {
            simulateBarcodeScan({ ...product, quantity: 1 });
            setStatusText(`✓ Added: ${product.name}`);
          } else {
            // Unknown barcode
            simulateBarcodeScan({ id: Date.now(), name: `Unknown (${text})`, brand: 'Unrecognized', price: 0, quantity: 1 });
            setStatusText(`Unknown barcode: ${text}`);
          }
        } else {
          // Fallback to mock product
          const mockProduct = {
            id: Date.now(),
            name: `Product ${text}`,
            brand: 'Test Brand',
            price: Math.floor(Math.random() * 1000) + 100,
            quantity: 1
          };
          simulateBarcodeScan(mockProduct);
          setStatusText(`✓ Added: ${mockProduct.name}`);
        }
        setTimeout(() => {
          if (scannerReady) setStatusText('Scanning...');
        }, 2000);
      };
      
      // Enhanced ZXing scanning with better detection
      const zxingScanLoop = async () => {
        if (!isScanningRef.current || !videoRef.current || !codeReaderRef.current || !scannerReady) {
          return;
        }
        
        try {
          // Increase contrast and brightness for better detection
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            const video = videoRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Enhance image
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
              imageData.data[i] = imageData.data[i] * 1.2; // Red
              imageData.data[i + 1] = imageData.data[i + 1] * 1.2; // Green
              imageData.data[i + 2] = imageData.data[i + 2] * 1.2; // Blue
            }
            context.putImageData(imageData, 0, 0);
            
            // ZXing barcode detection
            const result = await codeReaderRef.current.decodeFromCanvas(canvas);
            if (result && result.getText) {
              const text = result.getText();
              console.log('[Scanner][ZXing] Detected:', text);
              dispatchDetection(text);
              
              setTimeout(() => {
                if (isScanningRef.current) {
                  zxingScanLoop();
                }
              }, 1500);
              return;
            }
            // jsQR fallback for QR code
            const imageDataForQR = context.getImageData(0, 0, canvas.width, canvas.height);
            const qrResult = jsQR(imageDataForQR.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' });
            if (qrResult && qrResult.data) {
              console.log('[Scanner][jsQR] QR Detected:', qrResult.data);
              dispatchDetection(qrResult.data);
              
              setTimeout(() => {
                if (isScanningRef.current) {
                  zxingScanLoop();
                }
              }, 1500);
              return;
            }
          }
        } catch (error) {
          console.warn('[Scanner][ZXing/jsQR] Scan error:', error);
        }
        
        // Continue scanning with shorter interval
        if (isScanningRef.current) {
          setTimeout(zxingScanLoop, 100);
        }
      };

      // Optimized MediaPipe scanning loop
      const mediaPipeScanLoop = () => {
        if (!isScanningRef.current || !videoRef.current || !mpScannerRef.current || !scannerReady) {
          return;
        }
        
        try {
          // Skip frames on slower devices but not too aggressively
          frameSkipRef.current = (frameSkipRef.current + 1) % 3;
          
          if (frameSkipRef.current === 0) {
            const now = performance.now();
            const result = mpScannerRef.current.detectForVideo(videoRef.current, now);
            
            if (result?.barcodes?.length > 0) {
              const barcode = result.barcodes[0];
              const code = barcode.rawValue || barcode.displayValue;
              
              if (code && code.length > 0) {
                console.log('[Scanner][MediaPipe] Detected:', code);
                successBeep.play().catch(() => {});
                dispatchDetection(code);
                
                // Pause briefly to avoid duplicates
                setTimeout(() => {
                  if (isScanningRef.current) {
                    rafIdRef.current = requestAnimationFrame(mediaPipeScanLoop);
                  }
                }, 1500);
                return;
              }
            }
          }
        } catch (error) {
          console.warn('[Scanner][MediaPipe] Scan error:', error);
        }
        
        if (isScanningRef.current) {
          rafIdRef.current = requestAnimationFrame(mediaPipeScanLoop);
        }
      };

      // Start scanning with preferred method
      const startScanning = async () => {
        if (!scannerReady) {
          setTimeout(startScanning, 500);
          return;
        }
        
        // Try MediaPipe first for better accuracy
        const mediaPipeReady = await initializeMediaPipe();
        
        if (mediaPipeReady && mpScannerRef.current) {
          console.log('[Scanner] Using MediaPipe scanner');
          rafIdRef.current = requestAnimationFrame(mediaPipeScanLoop);
        } else {
          console.log('[Scanner] Using ZXing scanner');
          setTimeout(zxingScanLoop, 500);
        }
      };
      
      startScanning();
    };
    
    initializeScanner();

    return () => {
      isScanningRef.current = false;
      setScannerReady(false);
      
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      try {
        mpScannerRef.current?.close?.();
        mpScannerRef.current = null;
      } catch (error) {
        console.warn('Error closing MediaPipe scanner:', error);
      }
      
      try {
        codeReaderRef.current?.reset();
        codeReaderRef.current = null;
      } catch (error) {
        console.warn('Error resetting ZXing reader:', error);
      }
      
      stopCamera();
    };
  }, []);

  // Torch/flashlight control
  const toggleTorch = async () => {
    if (!torchSupported || !cameraTrackRef.current) {
      setStatusText('Flashlight not supported');
      setTimeout(() => setStatusText('Scanning...'), 1500);
      return;
    }
    
    try {
      const newTorchState = !torchEnabled;
      await cameraTrackRef.current.applyConstraints({
        advanced: [{ torch: newTorchState }]
      });
      setTorchEnabled(newTorchState);
      setStatusText(newTorchState ? 'Flashlight ON' : 'Flashlight OFF');
      setTimeout(() => setStatusText('Scanning...'), 1000);
    } catch (error) {
      console.warn('Failed to toggle torch:', error);
      setStatusText('Flashlight control failed');
      setTimeout(() => setStatusText('Scanning...'), 1500);
    }
  };

  // Zoom helpers
  const applyZoom = async (value) => {
    const track = cameraTrackRef.current;
    const caps = cameraCapsRef.current;
    if (supportsZoomRef.current && track && caps) {
      const min = caps.zoom.min ?? 1;
      const max = caps.zoom.max ?? 5;
      const clamped = Math.min(max, Math.max(min, value));
      try {
        await track.applyConstraints({ advanced: [{ zoom: clamped }] });
        currentZoomRef.current = clamped;
        setStatusText(`Zoom: ${clamped.toFixed(2)}x`);
        setTimeout(() => setStatusText('Scanning...'), 800);
      } catch {
        // fallback to CSS scale
        const css = Math.min(3, Math.max(1, value));
        setCssScale(css);
        setStatusText(`Zoom (preview): ${css.toFixed(2)}x`);
        setTimeout(() => setStatusText('Scanning...'), 800);
      }
    } else {
      const css = Math.min(3, Math.max(1, value));
      setCssScale(css);
      setStatusText(`Zoom (preview): ${css.toFixed(2)}x`);
      setTimeout(() => setStatusText('Scanning...'), 800);
    }
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = currentZoomRef.current;
    }
  };

  const onPointerMove = (e) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && pinchStartDistRef.current > 0) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        const scale = dist / pinchStartDistRef.current;
        const target = pinchStartZoomRef.current * scale;
        applyZoom(target);
      }
    }
  };

  const onPointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchStartDistRef.current = 0;
    }
  };

  const onWheel = (e) => {
    const delta = e.deltaY;
    const step = -delta * 0.0015; // small increments
    const next = (currentZoomRef.current || 1) + step;
    applyZoom(next);
  };

  return (
    <div className={`min-h-screen bg-black flex flex-col ${slideIn}`}>
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
          {torchSupported && (
            <button 
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border transition-colors ${
                torchEnabled 
                  ? 'bg-yellow-500/30 border-yellow-400/50 text-yellow-400' 
                  : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              {torchEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}
          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-yellow-400/30">
            <span className="text-yellow-400 text-sm font-bold">{scannedProducts.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: cssScale !== 1 ? `scale(${cssScale})` : undefined, transformOrigin: 'center center' }}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-72 h-72 border-2 rounded-3xl relative transition-all duration-300 ${
            scannerReady ? 'border-yellow-400/70 scan-pulse' : 'border-yellow-400/40'
          }`}>
            {/* Focus ring animation */}
            {scannerReady && <div className="scan-focus"></div>}
            
            {/* Corner indicators */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400 scan-corner"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400 scan-corner"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400 scan-corner"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400 scan-corner"></div>

            {/* Enhanced scanning line */}
            {scannerReady && <div className="scan-line"></div>}
            
            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-yellow-400/60 rounded-full"></div>
              <div className="absolute w-0.5 h-8 bg-yellow-400/60 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-1/4 left-4 right-4 text-center">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 ${
            scannerReady 
              ? 'bg-green-500/20 border border-green-400/30 text-green-300'
              : 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              scannerReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-bounce'
            }`}></div>
            <span>{statusText}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl p-6 max-h-80 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Scanned Items ({scannedProducts.length})</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {scannedProducts.length === 0 ? (
            <div className="text-center py-8">
              <Scan className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold">No items scanned yet</p>
              <p className="text-gray-400 text-sm font-medium">Point camera at barcode</p>
            </div>
          ) : (
            scannedProducts.map((item) => (
              <div key={item.id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600 font-medium">{item.brand}</p>
                  <p className="font-bold text-yellow-600">₹{item.price}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
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
            Proceed to Cart • ₹{scannedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
          </button>
        )}
      </div>
    </div>
  );
};

export default ScannerComponent;

