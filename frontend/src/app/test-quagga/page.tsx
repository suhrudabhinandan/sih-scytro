'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import QuaggaBarcodeScanner only on client-side to avoid SSR issues
const QuaggaBarcodeScanner = dynamic(() => import('@/components/QuaggaBarcodeScanner'), {
  ssr: false,
  loading: () => <div style={{ 
    textAlign: 'center', 
    padding: '50px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    margin: '20px 0'
  }}>Loading QuaggaJS scanner...</div>
});

export default function TestQuagga() {
  const [detections, setDetections] = useState<{ code: string; timestamp: string; method?: string }[]>([]);
  const [error, setError] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDetection = (barcode: string) => {
    console.log('QuaggaJS detected barcode:', barcode);
    const detection = {
      code: barcode,
      timestamp: new Date().toLocaleTimeString(),
      method: 'QuaggaJS' // Will be updated by the component
    };
    setDetections(prev => [detection, ...prev.slice(0, 9)]); // Keep last 10 detections
    setError(''); // Clear any previous errors
  };

  const handleError = (errorMsg: string) => {
    console.error('QuaggaJS scanner error:', errorMsg);
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
          🔬 QuaggaJS Barcode Scanner Test
        </h1>

        {/* QuaggaJS Info */}
        <div style={{ 
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>🔬 About QuaggaJS:</h3>
          <ul style={{ margin: 0, color: '#0066cc', paddingLeft: '20px' }}>
            <li><strong>Specialized:</strong> Optimized for barcode detection (not QR codes)</li>
            <li><strong>Formats:</strong> Code128, EAN-13/8, Code39, UPC-A/E, Codabar, I2of5</li>
            <li><strong>Performance:</strong> Uses Web Workers for better performance</li>
            <li><strong>Accuracy:</strong> Advanced image processing and pattern recognition</li>
            <li><strong>Fallback:</strong> Auto-falls back to Native API + jsQR if needed</li>
          </ul>
        </div>

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
            <li>Click "Start Scan" to begin QuaggaJS scanning</li>
            <li>Point camera at product barcodes (not QR codes for best results)</li>
            <li>Listen for beep and see detection method used</li>
          </ol>
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <strong>💡 Best Test Items:</strong>
            <br />• Product barcodes (UPC, EAN)
            <br />• Book ISBN barcodes
            <br />• Any Code128/Code39 barcodes
          </div>
        </div>

        {/* Scanner Component */}
        {isClient && (
          <QuaggaBarcodeScanner 
            onDetection={handleDetection}
            onError={handleError}
          />
        )}

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
              📊 QuaggaJS Detections ({detections.length})
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
              No barcodes detected yet. Start scanning to see QuaggaJS results here.
              <br />
              <small style={{ color: '#999' }}>Try pointing at product barcodes for best results</small>
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
                    <div>
                      {index === 0 && '🆕 '}
                      <strong>{detection.code}</strong>
                      <br />
                      <small style={{ color: '#666' }}>
                        Method: {detection.method || 'Unknown'} • Time: {detection.timestamp}
                      </small>
                    </div>
                    <small style={{ color: '#6c757d' }}>
                      #{detections.length - index}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QuaggaJS Performance Info */}
        {isClient && (
          <div style={{ 
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '10px',
            padding: '15px',
            marginTop: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚡ QuaggaJS Performance Features:</h4>
            <div style={{ fontSize: '14px', color: '#856404' }}>
              <div>🔄 <strong>Multi-threading:</strong> Uses Web Workers for non-blocking processing</div>
              <div>🎯 <strong>Smart Detection:</strong> Advanced pattern recognition algorithms</div>
              <div>📐 <strong>Adaptive Processing:</strong> Automatically adjusts for different angles and lighting</div>
              <div>🔧 <strong>Multiple Readers:</strong> Simultaneously tries multiple barcode formats</div>
              <div>⚡ <strong>Optimized:</strong> Efficient canvas processing with patch-based scanning</div>
            </div>
          </div>
        )}

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
              <strong>MediaDevices:</strong> {navigator.mediaDevices ? '✅ Available' : '❌ Not Available'}<br/>
              <strong>Native BarcodeDetector:</strong> {'BarcodeDetector' in window ? '✅ Supported' : '❌ Not Supported'}<br/>
              <strong>QuaggaJS:</strong> Loading dynamically...<br/>
              <strong>Web Workers:</strong> {typeof Worker !== 'undefined' ? '✅ Supported' : '❌ Not Supported'}<br/>
              <strong>Current Time:</strong> {new Date().toLocaleString()}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          marginTop: '30px'
        }}>
          <a 
            href="/test-scanner"
            style={{ 
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            📱 Simple Scanner
          </a>
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
            🏠 Main App
          </a>
        </div>
      </div>
    </div>
  );
}