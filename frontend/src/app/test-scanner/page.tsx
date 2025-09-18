'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import SimpleBarcodeScanner only on client-side to avoid SSR issues
const SimpleBarcodeScanner = dynamic(() => import('@/components/SimpleBarcodeScanner'), {
  ssr: false,
  loading: () => <div style={{ 
    textAlign: 'center', 
    padding: '50px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    margin: '20px 0'
  }}>Loading scanner...</div>
});

export default function TestScanner() {
  const [detections, setDetections] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  
  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDetection = (barcode: string) => {
    console.log('Barcode detected:', barcode);
    setDetections(prev => [barcode, ...prev.slice(0, 9)]); // Keep last 10 detections
    setError(''); // Clear any previous errors
  };

  const handleError = (errorMsg: string) => {
    console.error('Scanner error:', errorMsg);
    setError(errorMsg);
  };

  const clearDetections = () => {
    setDetections([]);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#333',
          marginBottom: '30px' 
        }}>
          🧪 Barcode Scanner Test
        </h1>

        {/* Instructions */}
        <div style={{ 
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>📋 Test Instructions:</h3>
          <ol style={{ margin: 0, color: '#0c5460' }}>
            <li>Click "Start Camera" to initialize camera</li>
            <li>Allow camera permissions when prompted</li>
            <li>Click "Start Scan" to begin scanning</li>
            <li>Point camera at QR codes or barcodes</li>
            <li>Should hear beep and see detection below</li>
          </ol>
        </div>

        {/* Scanner Component */}
        <SimpleBarcodeScanner 
          onDetection={handleDetection}
          onError={handleError}
        />

        {/* Error Display */}
        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '10px',
            padding: '15px',
            marginTop: '20px',
            color: '#721c24'
          }}>
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {/* Detection Results */}
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          marginTop: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>
              📊 Detections ({detections.length})
            </h3>
            {detections.length > 0 && (
              <button 
                onClick={clearDetections}
                style={{ 
                  padding: '5px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Clear
              </button>
            )}
          </div>

          {detections.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#6c757d',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px'
            }}>
              No barcodes detected yet. Start scanning to see results here.
            </div>
          ) : (
            <div>
              {detections.map((detection, index) => (
                <div 
                  key={index}
                  style={{ 
                    backgroundColor: index === 0 ? '#d4edda' : '#f8f9fa',
                    border: `1px solid ${index === 0 ? '#c3e6cb' : '#dee2e6'}`,
                    borderRadius: '5px',
                    padding: '10px',
                    marginBottom: '10px',
                    fontFamily: 'monospace'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      {index === 0 && '🆕 '}
                      <strong>{detection}</strong>
                    </span>
                    <small style={{ color: '#6c757d' }}>
                      #{detections.length - index}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Debug Info */}
        {/* Debug Info - Only show on client */}
        {isClient && (
          <div style={{ 
            backgroundColor: '#343a40',
            color: 'white',
            borderRadius: '10px',
            padding: '15px',
            marginTop: '20px',
            fontSize: '12px'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>🔧 Debug Information:</h4>
            <div>
              <strong>Protocol:</strong> {window.location.protocol}<br/>
              <strong>Hostname:</strong> {window.location.hostname}<br/>
              <strong>User Agent:</strong> {navigator.userAgent.slice(0, 80)}...<br/>
              <strong>MediaDevices:</strong> {navigator.mediaDevices ? '✅ Available' : '❌ Not Available'}<br/>
              <strong>BarcodeDetector:</strong> {'BarcodeDetector' in window ? '✅ Native Support' : '❌ Not Supported'}<br/>
              <strong>Current Time:</strong> {new Date().toLocaleString()}
            </div>
          </div>
        )}

        {/* Back to Main App */}
        <div style={{ 
          textAlign: 'center',
          marginTop: '30px'
        }}>
          <a 
            href="/"
            style={{ 
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
}