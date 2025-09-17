'use client'

import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Scan, Plus, Minus, Trash2 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';

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

  useEffect(() => {
    startCamera();
    codeReaderRef.current = new BrowserMultiFormatReader();
    isScanningRef.current = true;

    const successBeep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y');

    const startScanning = () => {
      if (!videoRef.current || !isScanningRef.current || !codeReaderRef.current) return;
      
      const scanFrame = async () => {
        if (!isScanningRef.current || !videoRef.current) return;
        
        try {
          const result = await codeReaderRef.current.decodeOnceFromVideoElement(videoRef.current);
          if (result && result.getText) {
            console.log('Barcode detected:', result.getText());
            // play beep
            successBeep.play().catch(() => {});
            // Use existing simulate path: push product by barcode if in mock DB via page-level handler
            const event = new CustomEvent('barcode-scanned', { detail: { text: result.getText() } });
            window.dispatchEvent(event);
            // Stop scanning briefly to avoid duplicate scans
            isScanningRef.current = false;
            setTimeout(() => {
              isScanningRef.current = true;
              startScanning();
            }, 1000);
            return;
          }
        } catch (e) {
          // ignore decode errors, continue scanning
        }
        
        // Continue scanning
        if (isScanningRef.current) {
          setTimeout(scanFrame, 100);
        }
      };

      scanFrame();
    };

    // Start scanning after a short delay to ensure video is ready
    setTimeout(startScanning, 1000);

    return () => {
      isScanningRef.current = false;
      try { codeReaderRef.current?.reset(); } catch {}
      stopCamera();
    };
  }, []);

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

      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 border-2 border-yellow-400/70 rounded-3xl relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
            
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400"></div>
          </div>
        </div>
        
        
        <p className="absolute bottom-1/4 left-0 right-0 text-white/80 text-center font-bold bg-black/30 py-2">
          Point camera at product barcode
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

