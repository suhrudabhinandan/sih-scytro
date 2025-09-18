'use client';

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const SimpleBarcodeScanner = ({ onDetection, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Click Start to begin scanning');
  const [cameraStarted, setCameraStarted] = useState(false);
  const scanningRef = useRef(false);
  const streamRef = useRef(null);

  // Audio feedback
  const playBeep = () => {
    try {
      const beepSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt459NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y');
      beepSound.volume = 0.5;
      beepSound.play().catch(() => {
        console.log('Audio failed - trying Web Audio API');
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
      });
    } catch (error) {
      console.warn('Audio feedback failed:', error);
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
        
        // Wait for video to load
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = resolve;
          videoRef.current.onerror = reject;
          setTimeout(() => reject(new Error('Video load timeout')), 5000);
        });
        
        await videoRef.current.play();
        setCameraStarted(true);
        setStatus(`Camera started: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        
        console.log('Camera started successfully:', {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        });
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

  const startScanning = () => {
    if (!cameraStarted) {
      setStatus('Please start camera first');
      return;
    }
    
    setIsScanning(true);
    scanningRef.current = true;
    setStatus('Scanning for barcodes...');
    console.log('Starting scan loop');
    
    scanLoop();
  };

  const stopScanning = () => {
    scanningRef.current = false;
    setIsScanning(false);
    setStatus('Scanning stopped');
  };

  const scanLoop = async () => {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Make sure video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setTimeout(scanLoop, 100);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for scanning
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Try multiple detection methods
      let detected = null;

      // 1. Try native BarcodeDetector first (fastest if available)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new BarcodeDetector({
            formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e']
          });
          
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            detected = barcodes[0].rawValue;
            console.log('BarcodeDetector found:', detected);
          }
        } catch (barcodeError) {
          console.warn('BarcodeDetector failed:', barcodeError);
        }
      }

      // 2. Try jsQR for QR codes if no barcode detected
      if (!detected) {
        const qrResult = jsQR(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: 'dontInvert'
        });
        
        if (qrResult && qrResult.data) {
          detected = qrResult.data;
          console.log('jsQR found:', detected);
        }
      }

      // 3. Try with enhanced contrast
      if (!detected) {
        // Enhance image contrast
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = Math.min(255, imageData.data[i] * 1.3);     // Red
          imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] * 1.3); // Green
          imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] * 1.3); // Blue
        }
        context.putImageData(imageData, 0, 0);

        const qrResultEnhanced = jsQR(imageData.data, canvas.width, canvas.height, {
          inversionAttempts: 'dontInvert'
        });
        
        if (qrResultEnhanced && qrResultEnhanced.data) {
          detected = qrResultEnhanced.data;
          console.log('jsQR enhanced found:', detected);
        }
      }

      if (detected) {
        console.log('🎯 BARCODE DETECTED:', detected);
        playBeep();
        setStatus(`✅ Detected: ${detected}`);
        onDetection?.(detected);
        
        // Brief pause before continuing
        setTimeout(() => {
          if (scanningRef.current) {
            setStatus('Scanning for barcodes...');
            scanLoop();
          }
        }, 2000);
        return;
      }

    } catch (error) {
      console.error('Scan loop error:', error);
      setStatus(`Scan error: ${error.message}`);
    }

    // Continue scanning
    if (scanningRef.current) {
      setTimeout(scanLoop, 100);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
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
      <h2 style={{ textAlign: 'center', color: '#333' }}>📱 Simple Barcode Scanner</h2>
      
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
      
      <canvas 
        ref={canvasRef}
        style={{ display: 'none' }}
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
        💡 Tip: Point camera at QR codes or barcodes. Works best with good lighting.
        <br />
        🌐 Native BarcodeDetector: {'BarcodeDetector' in window ? '✅ Supported' : '❌ Not supported'}
        <br />
        📊 jsQR: {typeof jsQR !== 'undefined' ? '✅ Loaded' : '❌ Not loaded'}
      </div>
    </div>
  );
};

export default SimpleBarcodeScanner;