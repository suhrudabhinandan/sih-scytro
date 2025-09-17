'use client'

import React, { useState } from 'react';
import { ArrowLeft, QrCode, CheckCircle, XCircle } from 'lucide-react';

const QRScannerComponent = ({ setCurrentScreen, slideIn }) => {
  const [scanResult, setScanResult] = useState(null);
  
  const simulateScan = () => {
    const results = ['verified', 'already_scanned', 'invalid'];
    const result = results[Math.floor(Math.random() * results.length)];
    setScanResult(result);
    
    setTimeout(() => {
      setScanResult(null);
      setCurrentScreen('securityDashboard');
    }, 2000);
  };

  return (
    <div className={`min-h-screen bg-black flex flex-col ${slideIn}`}>
      <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => setCurrentScreen('securityDashboard')}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-bold">Scan Receipt QR</h2>
        <div className="w-10 h-10"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {!scanResult ? (
          <div className="relative">
            <div className="w-72 h-72 border-2 border-yellow-400/50 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
              
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400"></div>
              
              <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
                <QrCode className="w-20 h-20 text-white/20" />
              </div>
            </div>
            
            <p className="text-white/80 text-center mt-6 font-bold">Point camera at receipt QR code</p>
          </div>
        ) : (
          <div className="text-center">
            {scanResult === 'verified' && (
              <div className="text-yellow-400">
                <CheckCircle className="w-24 h-24 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Verified!</h3>
                <p className="font-medium">Receipt is legitimate</p>
              </div>
            )}
            {scanResult === 'already_scanned' && (
              <div className="text-red-400">
                <XCircle className="w-24 h-24 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Already Scanned!</h3>
                <p className="font-medium">This receipt was already verified</p>
              </div>
            )}
            {scanResult === 'invalid' && (
              <div className="text-red-400">
                <XCircle className="w-24 h-24 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Invalid!</h3>
                <p className="font-medium">Receipt verification failed</p>
              </div>
            )}
          </div>
        )}
      </div>

      {!scanResult && (
        <div className="p-6">
          <button 
            onClick={simulateScan}
            className="w-full bg-yellow-500 text-white font-bold py-4 rounded-2xl"
          >
            Simulate QR Scan
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScannerComponent;

