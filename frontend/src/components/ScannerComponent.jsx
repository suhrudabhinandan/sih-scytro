'use client'

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Scan, Plus, Minus, Trash2 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
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

  useEffect(() => {
    const enhancedStart = async () => {
      await startCamera();
      try {
        const stream = videoRef.current?.srcObject;
        const track = stream?.getVideoTracks?.()[0];
        if (track?.applyConstraints) {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
        }
        cameraTrackRef.current = track || null;
        const caps = track?.getCapabilities?.() || null;
        cameraCapsRef.current = caps;
        if (caps && typeof caps.zoom === 'object' && typeof caps.zoom.min === 'number') {
          supportsZoomRef.current = true;
          // Initialize zoom near default if provided
          baseZoomRef.current = track.getSettings?.().zoom ?? 1;
          currentZoomRef.current = baseZoomRef.current;
        }
      } catch {}
    };

    enhancedStart();
    codeReaderRef.current = new BrowserMultiFormatReader();
    isScanningRef.current = true;

    const successBeep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y');

    const startMediapipe = async () => {
      try {
        const MP = await import('@mediapipe/tasks-vision');
        const FilesetResolver = MP.FilesetResolver;
        const BarcodeScanner = MP.BarcodeScanner;
        if (!FilesetResolver || !BarcodeScanner) {
          throw new Error('MediaPipe BarcodeScanner unavailable');
        }
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm');
        mpScannerRef.current = await BarcodeScanner.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/barcode_scanner/barcode_scanner/float16/1/barcode_scanner.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO'
        });
        return true;
      } catch (e) {
        console.warn('[Scanner] MediaPipe init failed, falling back to ZXing', e);
        mpScannerRef.current = null;
        return false;
      }
    };

    const dispatchDetection = (text) => {
      const event = new CustomEvent('barcode-scanned', { detail: { text } });
      window.dispatchEvent(event);
      setStatusText(`Detected: ${String(text).slice(0, 24)}`);
      setTimeout(() => setStatusText('Scanning...'), 1500);
    };

    const loopMediapipe = () => {
      if (!isScanningRef.current || !videoRef.current || !mpScannerRef.current) return;
      try {
        // Light throttling for performance on low-end devices
        frameSkipRef.current = (frameSkipRef.current + 1) % 2;
        const now = performance.now();
        const result = frameSkipRef.current === 0 ? mpScannerRef.current.detectForVideo(videoRef.current, now) : null;
        const code = result?.barcodes?.[0]?.rawValue || result?.barcodes?.[0]?.displayValue;
        if (code) {
          console.debug('[Scanner][MP] Detected barcode:', code);
          successBeep.play().catch(() => {});
          dispatchDetection(code);
          // brief pause to avoid rapid duplicates
          setTimeout(() => {
            if (isScanningRef.current) {
              rafIdRef.current = requestAnimationFrame(loopMediapipe);
            }
          }, 1000);
          return;
        }
      } catch {}
      if (isScanningRef.current) {
        rafIdRef.current = requestAnimationFrame(loopMediapipe);
      }
    };

    const startScanning = () => {
      if (!videoRef.current || !isScanningRef.current || !codeReaderRef.current) return;
      
      const scanFrame = async () => {
        if (!isScanningRef.current || !videoRef.current) return;
        
        try {
          const result = await codeReaderRef.current.decodeOnceFromVideoElement(videoRef.current);
          if (result && result.getText) {
            const text = result.getText();
            console.debug('[Scanner] Detected barcode:', text);
            successBeep.play().catch(() => {});
            dispatchDetection(text);
            isScanningRef.current = false;
            setTimeout(() => {
              isScanningRef.current = true;
              startScanning();
            }, 1000);
            return;
          }
        } catch (e) {
          // Soft-fail: keep scanning
        }
        
        if (isScanningRef.current) {
          setTimeout(scanFrame, 100);
        }
      };

      scanFrame();
    };

    (async () => {
      // Try MediaPipe first
      const ok = await startMediapipe();
      if (ok && mpScannerRef.current) {
        isScanningRef.current = true;
        rafIdRef.current = requestAnimationFrame(loopMediapipe);
      } else {
        // Fallback to ZXing
        setTimeout(startScanning, 800);
      }
    })();

    return () => {
      isScanningRef.current = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      try { mpScannerRef.current?.close?.(); } catch {}
      try { codeReaderRef.current?.reset(); } catch {}
      stopCamera();
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
        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-yellow-400/30">
          <span className="text-yellow-400 text-sm font-bold">{scannedProducts.reduce((sum, item) => sum + item.quantity, 0)}</span>
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
          <div className="w-72 h-72 border-2 border-yellow-400/70 rounded-3xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
            
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400"></div>

            <div className="scan-line"></div>
          </div>
        </div>
        
        <p className="absolute bottom-1/4 left-4 right-4 text-white/90 text-center font-bold bg-black/40 py-2 rounded-xl">
          {statusText}
        </p>
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

