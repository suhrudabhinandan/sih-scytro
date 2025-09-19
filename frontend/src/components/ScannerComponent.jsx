'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Scan, Plus, Minus, Trash2 } from 'lucide-react';

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
  const isScanningRef = useRef(false);
  const [statusText, setStatusText] = useState('Scanning...');
  const [cameraError, setCameraError] = useState('');
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
  const [scannerReady, setScannerReady] = useState(false);

  // Enhanced camera initialization with proper focus and torch support
  const initializeCamera = async () => {
    try {
      setStatusText('Initializing camera...');
      setCameraError('');
      
      // Enhanced camera constraints for better barcode scanning
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!videoRef.current) {
        throw new Error('Video element not available');
      }
      
      videoRef.current.srcObject = stream;
      
      // Wait for video to load
      await new Promise((resolve, reject) => {
        videoRef.current.onloadedmetadata = () => resolve();
        videoRef.current.onerror = reject;
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Video load timeout')), 10000);
      });
      
      await videoRef.current.play();
      
      const track = stream.getVideoTracks()[0];
      cameraTrackRef.current = track;
      
      // Configure optimal settings for barcode scanning
      try {
        const capabilities = track.getCapabilities();
        cameraCapsRef.current = capabilities;
        
        const advancedConstraints = [];
        
        // Set continuous autofocus if available
        if (capabilities.focusMode?.includes('continuous')) {
          advancedConstraints.push({ focusMode: 'continuous' });
        }
        
        // Set exposure mode
        if (capabilities.exposureMode?.includes('continuous')) {
          advancedConstraints.push({ exposureMode: 'continuous' });
        }
        
        // Set white balance
        if (capabilities.whiteBalanceMode?.includes('continuous')) {
          advancedConstraints.push({ whiteBalanceMode: 'continuous' });
        }
        
        if (advancedConstraints.length > 0) {
          await track.applyConstraints({ advanced: advancedConstraints });
        }
        
        // Check zoom support
        if (capabilities.zoom) {
          supportsZoomRef.current = true;
          baseZoomRef.current = capabilities.zoom.min || 1;
          currentZoomRef.current = baseZoomRef.current;
        }
        
      } catch (constraintError) {
        console.warn('Failed to apply camera constraints:', constraintError);
        // Continue anyway - basic camera should still work
      }
      
      setScannerReady(true);
      setStatusText('Camera ready - scanning...');
      
    } catch (error) {
      console.error('Camera initialization failed:', error);
      let errorMessage = 'Camera access failed';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure your device has a camera.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported. Try using HTTPS or a different browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      setStatusText(errorMessage);
      setCameraError(errorMessage + '\n\nTip: For best results, use HTTPS and allow camera permissions.');
      setScannerReady(false);
    }
  };

  // Comprehensive camera cleanup function
  const cleanupCamera = async (fullCleanup = true) => {
    try {
      console.log('[Scanner] Cleaning up camera...', { fullCleanup });
      
      // Stop all scanning processes
      isScanningRef.current = false;
      
      // Cancel animation frames
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      if (fullCleanup) {
        // Only do full cleanup when actually leaving the scanner
        setScannerReady(false);
        
        // Close MediaPipe scanner
        try {
          mpScannerRef.current?.close?.();
          mpScannerRef.current = null;
        } catch (error) {
          console.warn('[Scanner] Error closing MediaPipe scanner:', error);
        }
        
        // Stop camera stream
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          const tracks = stream.getTracks();
          
          tracks.forEach(track => {
            console.log(`[Scanner] Stopping track: ${track.kind}`);
            track.stop();
          });
          
          videoRef.current.srcObject = null;
        }
        
        // Clear camera references
        cameraTrackRef.current = null;
        cameraCapsRef.current = null;
        
        // Call parent's stopCamera as backup
        stopCamera();
      }
      
      console.log('[Scanner] Camera cleanup completed');
    } catch (error) {
      console.error('[Scanner] Error during camera cleanup:', error);
    }
  };

  // Enhanced audio feedback for successful scan
  const playFeedback = (isSuccess = true) => {
    try {
      // Try to play the base64 beep sound first (more reliable)
      if (isSuccess) {
        const beepSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y');
        beepSound.volume = 0.5;
        beepSound.play().catch(() => {
          // Fallback to Web Audio API if base64 audio fails
          playWebAudioBeep(800, 0.3, 0.3); // Success tone
        });
      } else {
        // Different tone for unknown/error
        playWebAudioBeep(400, 0.2, 0.5); // Lower tone for unknown product
      }
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  };
  
  // Web Audio API fallback for beep sounds
  const playWebAudioBeep = (frequency, volume, duration) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Web Audio beep failed:', error);
    }
  };

  // Enhanced detection with better product database integration
  const dispatchDetection = (text) => {
    console.log('[Scanner][DispatchDetection] Barcode/QR detected:', text);
    
    // Play appropriate beep sound based on result
    playFeedback(product ? true : false);
    
    // Try to match barcode with real product database
    const productDb = (typeof window !== 'undefined' && window.productDatabase) || {};
    const product = productDb[text];
    
    if (product) {
      // Found product in database
      simulateBarcodeScan({ ...product, quantity: 1 });
      setStatusText(`✓ Added: ${product.name}`);
      
      // Flash green background briefly to indicate success
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.style.filter = 'sepia(100%) hue-rotate(60deg) saturate(2)';
        setTimeout(() => {
          if (videoElement) videoElement.style.filter = '';
        }, 300);
      }
    } else {
      // Unknown barcode - still add it so user gets feedback
      const unknownProduct = {
        id: Date.now(),
        name: `Unknown Product (${text.slice(-6)})`,
        brand: 'Unrecognized',
        price: 0,
        category: 'Unknown',
        quantity: 1
      };
      simulateBarcodeScan(unknownProduct);
      setStatusText(`⚠ Unknown barcode: ${text.slice(-8)}`);
      
      // Flash orange background to indicate unknown product
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.style.filter = 'sepia(100%) hue-rotate(30deg) saturate(1.5)';
        setTimeout(() => {
          if (videoElement) videoElement.style.filter = '';
        }, 300);
      }
    }
    
    // Reset status text after delay
    setTimeout(() => {
      if (scannerReady) setStatusText('Scanning...');
    }, 2000);
  };

  // Optimized ZXing scanning with better detection
  const zxingScanLoop = async () => {
    if (!isScanningRef.current || !videoRef.current || !codeReaderRef.current || !scannerReady) {
      return;
    }
    
    try {
      if (canvasRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const video = videoRef.current;
        
        // Set canvas size to match video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Try different image processing approaches for better detection
        const attempts = [
          // Original image
          () => context.getImageData(0, 0, canvas.width, canvas.height),
          // Enhanced contrast/brightness
          () => {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < imageData.data.length; i += 4) {
              imageData.data[i] = Math.min(255, imageData.data[i] * 1.3);     // Red
              imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] * 1.3); // Green
              imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] * 1.3); // Blue
            }
            context.putImageData(imageData, 0, 0);
            return imageData;
          }
        ];
        
        for (const attemptFn of attempts) {
          try {
            const imageData = attemptFn();
            
            // Try ZXing barcode detection
            const result = await codeReaderRef.current.decodeFromCanvas(canvas);
            if (result && result.getText && result.getText().length > 0) {
              const text = result.getText();
              console.log('[Scanner][ZXing] Detected:', text);
              dispatchDetection(text);
              return; // Stop scanning briefly after detection
            }
            
            // Try jsQR for QR codes
            const qrResult = jsQR(imageData.data, canvas.width, canvas.height, {
              inversionAttempts: 'dontInvert'
            });
            if (qrResult && qrResult.data && qrResult.data.length > 0) {
              console.log('[Scanner][jsQR] QR Detected:', qrResult.data);
              dispatchDetection(qrResult.data);
              return; // Stop scanning briefly after detection
            }
            
          } catch (attemptError) {
            console.warn('[Scanner] Detection attempt failed:', attemptError);
            continue; // Try next approach
          }
        }
      }
    } catch (error) {
      console.warn('[Scanner][ZXing/jsQR] Scan error:', error);
    }
    
    // Continue scanning at optimal rate
    if (isScanningRef.current) {
      setTimeout(zxingScanLoop, 150); // Slightly slower for better performance
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

  // Scanner initialization effect
  useEffect(() => {
    // Initialize camera first
    initializeCamera();

    const initializeScanner = async () => {
      isScanningRef.current = true;

      const initializeMediaPipe = async () => {
        try {
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

      // Native BarcodeDetector API (fastest and most reliable when available)
      let barcodeDetector = null;
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          barcodeDetector = new window.BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix']
          });
          console.log('[Scanner] Native BarcodeDetector initialized');
        } catch (e) {
          console.warn('[Scanner] BarcodeDetector initialization failed:', e);
        }
      }

      const barcodeDetectorScanLoop = async () => {
        if (!isScanningRef.current || !videoRef.current || !barcodeDetector || !scannerReady) {
          return;
        }
        
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            const text = barcodes[0].rawValue;
            console.log('[Scanner][BarcodeDetector] Detected:', text);
            dispatchDetection(text);
            // Pause briefly after successful detection
            setTimeout(() => {
              if (isScanningRef.current) barcodeDetectorScanLoop();
            }, 2000);
            return;
          }
        } catch (error) {
          console.warn('[Scanner][BarcodeDetector] Scan error:', error);
        }
        
        if (isScanningRef.current) {
          setTimeout(barcodeDetectorScanLoop, 100);
        }
      };

      // Start MediaPipe scanning
      const startScanning = async () => {
        if (!scannerReady) {
          setTimeout(startScanning, 500);
          return;
        }
        
        const mediaPipeReady = await initializeMediaPipe();
        if (mediaPipeReady && mpScannerRef.current) {
          console.log('[Scanner] Using MediaPipe scanner');
          rafIdRef.current = requestAnimationFrame(mediaPipeScanLoop);
        } else {
          setStatusText('Failed to initialize scanner');
          console.error('[Scanner] MediaPipe initialization failed');
        }
      };
      
      startScanning();
    };
    
    initializeScanner();

    // Add cleanup on page unload
    const handleBeforeUnload = () => {
      cleanupCamera();
    };
    
    // Add visibility change handler to pause scanning when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Scanner] Tab hidden - pausing scanning');
        // Just pause scanning, don't stop camera completely
        isScanningRef.current = false;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      } else {
        console.log('[Scanner] Tab visible - resuming scanning');
        if (scannerReady && !isScanningRef.current) {
          isScanningRef.current = true;
          // Restart scanning loops based on what was active
          setTimeout(() => {
            if (mpScannerRef.current) {
              rafIdRef.current = requestAnimationFrame(mediaPipeScanLoop);
            } else if (codeReaderRef.current) {
              setTimeout(zxingScanLoop, 100);
            }
          }, 100);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      cleanupCamera();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


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
        setCssScale(clamped);
      }
    }
  };

  // Zoom in/out buttons
  const handleZoomIn = async () => {
    await applyZoom(currentZoomRef.current + 0.5);
  };

  const handleZoomOut = async () => {
    await applyZoom(currentZoomRef.current - 0.5);
  };

  // Touch gesture handlers for pinch zoom
  const handlePointerDown = (e) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const points = Array.from(pointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y
      );
      pinchStartZoomRef.current = currentZoomRef.current;
    }
  };

  const handlePointerMove = (e) => {
    if (pointersRef.current.size !== 2) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const points = Array.from(pointersRef.current.values());
    const currentDist = Math.hypot(
      points[0].x - points[1].x,
      points[0].y - points[1].y
    );
    const scale = currentDist / pinchStartDistRef.current;
    applyZoom(pinchStartZoomRef.current * scale);
  };

  const handlePointerUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchStartDistRef.current = 0;
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
    e.currentTarget.releasePointerCapture?.(e.pointerId); // Add cleanup
  };

  // Removed stray markdown code block that caused syntax errors
  // (Accidentally included a bash code fence in JSX file.)

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
          onClick={async () => {
            await cleanupCamera();
            setCurrentScreen('userDashboard');
          }}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-bold">Scan Products</h2>
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
            <span className="text-white text-sm font-bold">{scannedProducts.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
        {cameraError ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-red-500 text-lg font-bold mb-4">{cameraError}</div>
            <button
              onClick={initializeCamera}
              className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-xl shadow hover:bg-yellow-600 transition"
            >
              Retry Camera Access
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
              style={{ transform: cssScale !== 1 ? `scale(${cssScale})` : undefined, transformOrigin: 'center center' }}
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 border-2 border-white/50 rounded-3xl relative">
                {/* Simple center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-white/80 rounded-full"></div>
                  <div className="absolute w-0.5 h-8 bg-white/80 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-1/4 left-4 right-4 text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-bold bg-black/50 border border-white/30 text-white">
                <div className={`w-2 h-2 rounded-full ${
                  scannerReady ? 'bg-green-400' : 'bg-white'
                }`}></div>
                <span>{statusText}</span>
              </div>
            </div>
          </>
        )}
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
            onClick={async () => {
              await cleanupCamera();
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

