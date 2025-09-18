'use client';

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

// QuaggaJS will be imported dynamically to avoid SSR issues
let Quagga = null;

const QuaggaBarcodeScanner = ({ onDetection, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const quaggaContainerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Click Start to begin scanning');
  const [cameraStarted, setCameraStarted] = useState(false);
  const [quaggaReady, setQuaggaReady] = useState(false);
  const scanningRef = useRef(false);
  const streamRef = useRef(null);
  const detectionCooldownRef = useRef(0);

  // Audio feedback
  const playBeep = (isSuccess = true) => {
    try {
      const frequency = isSuccess ? 800 : 400;
      const duration = isSuccess ? 0.3 : 0.5;
      
      // Try base64 audio first
      if (isSuccess) {
        const beepSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt459NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y');
        beepSound.volume = 0.5;
        beepSound.play().catch(() => playWebAudioBeep(frequency, 0.3, duration));
      } else {
        playWebAudioBeep(frequency, 0.2, duration);
      }
    } catch (error) {
      console.warn('Audio feedback failed:', error);
    }
  };

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

  // Initialize QuaggaJS dynamically
  const initializeQuagga = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const quaggaModule = await import('quagga');
      Quagga = quaggaModule.default || quaggaModule;
      
      console.log('QuaggaJS loaded successfully');
      setQuaggaReady(true);
      return true;
    } catch (error) {
      console.error('Failed to load QuaggaJS:', error);
      setQuaggaReady(false);
      return false;
    }
  };

  const startCamera = async () => {
    try {
      setStatus('Starting camera...');
      
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      console.log('Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = resolve;
          videoRef.current.onerror = reject;
          setTimeout(() => reject(new Error('Video load timeout')), 5000);
        });
        
        await videoRef.current.play();
        setCameraStarted(true);
        setStatus(`Camera started: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        
        // Initialize QuaggaJS if not already done
        if (!quaggaReady && !Quagga) {
          await initializeQuagga();
        }
        
        console.log('Camera started successfully');
      }
    } catch (error) {
      console.error('Camera start failed:', error);
      setStatus(`Camera error: ${error.message}`);
      onError?.(`Camera failed: ${error.message}`);
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    setIsScanning(false);
    
    // Stop Quagga
    if (Quagga) {
      try {
        Quagga.stop();
        console.log('Quagga stopped');
      } catch (error) {
        console.warn('Error stopping Quagga:', error);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraStarted(false);
    setStatus('Camera stopped');
  };

  const handleDetection = (code, method) => {
    const now = Date.now();
    // Debounce detections within 2 seconds
    if (now - detectionCooldownRef.current < 2000) {
      return;
    }
    detectionCooldownRef.current = now;

    console.log(`🎯 BARCODE DETECTED via ${method}:`, code);
    playBeep(true);
    setStatus(`✅ Detected (${method}): ${code}`);
    onDetection?.(code);
    
    // Resume scanning after brief pause
    setTimeout(() => {
      if (scanningRef.current) {
        setStatus('Scanning for barcodes...');
      }
    }, 2000);
  };

  const startQuaggaScanning = () => {
    if (!Quagga || !videoRef.current || !quaggaContainerRef.current) {
      console.warn('Quagga not ready for scanning');
      return;
    }

    const config = {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: quaggaContainerRef.current,
        constraints: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment"
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 2,
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader", 
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ],
        debug: {
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showRemainingPatchLabels: false,
          boxFromPatches: {
            showTransformed: false,
            showTransformedBox: false,
            showBB: false
          }
        }
      }
    };

    Quagga.init(config, (err) => {
      if (err) {
        console.error('Quagga initialization failed:', err);
        setStatus('Quagga initialization failed');
        // Fall back to manual scanning
        startManualScanning();
        return;
      }
      
      console.log('Quagga initialized successfully');
      Quagga.start();
      
      // Set up detection handler
      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        if (code && code.length > 0) {
          handleDetection(code, 'QuaggaJS');
        }
      });
      
      setStatus('QuaggaJS scanning active...');
    });
  };

  const startManualScanning = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }
    
    const scanLoop = async () => {
      if (!scanningRef.current) return;

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          setTimeout(scanLoop, 100);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        let detected = null;

        // Try native BarcodeDetector first
        if ('BarcodeDetector' in window) {
          try {
            const detector = new BarcodeDetector({
              formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e']
            });
            
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detected = barcodes[0].rawValue;
              handleDetection(detected, 'Native BarcodeDetector');
              return;
            }
          } catch (barcodeError) {
            console.warn('BarcodeDetector failed:', barcodeError);
          }
        }

        // Try jsQR for QR codes
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = jsQR(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: 'dontInvert'
        });
        
        if (qrResult && qrResult.data) {
          handleDetection(qrResult.data, 'jsQR');
          return;
        }

      } catch (error) {
        console.error('Manual scan loop error:', error);
      }

      if (scanningRef.current) {
        setTimeout(scanLoop, 100);
      }
    };

    console.log('Starting manual scanning fallback');
    setStatus('Manual scanning active...');
    scanLoop();
  };

  const startScanning = async () => {
    if (!cameraStarted) {
      setStatus('Please start camera first');
      return;
    }
    
    setIsScanning(true);
    scanningRef.current = true;
    setStatus('Initializing barcode detection...');
    
    // Ensure QuaggaJS is loaded
    if (!quaggaReady && !Quagga) {
      const loaded = await initializeQuagga();
      if (!loaded) {
        console.warn('QuaggaJS failed to load, using fallback methods');
        startManualScanning();
        return;
      }
    }
    
    // Try QuaggaJS first
    if (Quagga) {
      console.log('Starting QuaggaJS scanning');
      startQuaggaScanning();
    } else {
      console.log('QuaggaJS not available, using manual scanning');
      startManualScanning();
    }
  };

  const stopScanning = () => {
    scanningRef.current = false;
    setIsScanning(false);
    
    if (Quagga) {
      try {
        Quagga.stop();
      } catch (error) {
        console.warn('Error stopping Quagga:', error);
      }
    }
    
    setStatus('Scanning stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    // Initialize QuaggaJS when component mounts
    initializeQuagga();
    
    return () => {
      stopCamera();
      if (Quagga) {
        try {
          Quagga.stop();
        } catch (error) {
          console.warn('Error cleaning up Quagga:', error);
        }
      }
    };
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '400px', 
      margin: '0 auto',
      backgroundColor: '#f0f0f0',
      borderRadius: '10px'
    }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>📱 QuaggaJS Barcode Scanner</h2>
      
      {/* Video element for camera stream */}
      <video 
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ 
          width: '100%', 
          height: '300px', 
          backgroundColor: '#000',
          borderRadius: '10px',
          objectFit: 'cover'
        }}
      />
      
      {/* Hidden elements for processing */}
      <canvas 
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* QuaggaJS container (hidden but needed for initialization) */}
      <div 
        ref={quaggaContainerRef}
        style={{ 
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      />
      
      <div style={{ 
        margin: '20px 0',
        padding: '10px',
        backgroundColor: isScanning ? '#d4edda' : '#fff3cd',
        borderRadius: '5px',
        textAlign: 'center',
        border: `2px solid ${isScanning ? '#c3e6cb' : '#ffeaa7'}`
      }}>
        <strong>{status}</strong>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={startCamera}
          disabled={cameraStarted}
          style={{ 
            padding: '10px 20px',
            backgroundColor: cameraStarted ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: cameraStarted ? 'not-allowed' : 'pointer'
          }}
        >
          {cameraStarted ? '✅ Camera On' : '📹 Start Camera'}
        </button>
        
        <button 
          onClick={isScanning ? stopScanning : startScanning}
          disabled={!cameraStarted}
          style={{ 
            padding: '10px 20px',
            backgroundColor: !cameraStarted ? '#6c757d' : (isScanning ? '#dc3545' : '#007bff'),
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !cameraStarted ? 'not-allowed' : 'pointer'
          }}
        >
          {isScanning ? '⏹️ Stop Scan' : '🔍 Start Scan'}
        </button>
        
        <button 
          onClick={stopCamera}
          disabled={!cameraStarted}
          style={{ 
            padding: '10px 20px',
            backgroundColor: !cameraStarted ? '#6c757d' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !cameraStarted ? 'not-allowed' : 'pointer'
          }}
        >
          🛑 Stop Camera
        </button>
      </div>
      
      <div style={{ 
        marginTop: '10px', 
        fontSize: '12px', 
        color: '#666',
        textAlign: 'center'
      }}>
        💡 Enhanced with QuaggaJS for better barcode detection
        <br />
        🔧 QuaggaJS: {quaggaReady ? '✅ Ready' : '⏳ Loading'}
        <br />
        🌐 Native BarcodeDetector: {'BarcodeDetector' in window ? '✅ Supported' : '❌ Not supported'}
        <br />
        📊 jsQR: {typeof jsQR !== 'undefined' ? '✅ Loaded' : '❌ Not loaded'}
        <br />
        📱 Supports: Code128, EAN13/8, Code39, UPC-A/E, QR codes
      </div>
    </div>
  );
};

export default QuaggaBarcodeScanner;