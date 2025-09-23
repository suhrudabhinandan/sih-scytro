'use client'

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, QrCode, CheckCircle, XCircle, Camera, StopCircle, Zap, ZapOff } from 'lucide-react';
import jsQR from 'jsqr';

const QRScannerComponent = ({ setCurrentScreen, slideIn }) => {
	const [scanResult, setScanResult] = useState(null);
	const [isStarting, setIsStarting] = useState(false);
	const [error, setError] = useState('');
	const [statusText, setStatusText] = useState('Initializing camera...');
	const [torchEnabled, setTorchEnabled] = useState(false);
	const [torchSupported, setTorchSupported] = useState(false);
	const [scannerReady, setScannerReady] = useState(false);
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const streamRef = useRef(null);
	const isScanningRef = useRef(false);
	const cameraTrackRef = useRef(null);
	const lastDetectionTimeRef = useRef(0);

	const startCamera = async () => {
		// Ensure clean state before starting
		if (isStarting || streamRef.current) {
			await stopCamera();
			// Small delay to ensure cleanup is complete
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
		setError('');
		setStatusText('Requesting camera access...');
		setIsStarting(true);
		
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { 
					facingMode: { ideal: 'environment' },
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false,
			});
			
			streamRef.current = stream;
			const track = stream.getVideoTracks()[0];
			cameraTrackRef.current = track;
			
			// Check camera capabilities
			const capabilities = track.getCapabilities();
			
			// Configure camera for QR scanning
			const constraints = { advanced: [] };
			
			// Set focus for close-up scanning
			if (capabilities.focusMode?.includes('continuous')) {
				constraints.advanced.push({ focusMode: 'continuous' });
			} else if (capabilities.focusMode?.includes('single-shot')) {
				constraints.advanced.push({ focusMode: 'single-shot' });
			}
			
			// Check torch support
			if (capabilities.torch) {
				setTorchSupported(true);
			}
			
			// Apply constraints
			if (constraints.advanced.length > 0) {
				await track.applyConstraints(constraints);
			}
			
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				try {
					// Add loading timeout to handle stalled video loading
					const playPromise = videoRef.current.play();
					const timeoutPromise = new Promise((_, reject) => {
						setTimeout(() => reject(new Error('Video play timeout')), 5000);
					});
					
					await Promise.race([playPromise, timeoutPromise]);
				} catch (playError) {
					if (playError.name === 'AbortError') {
						// Suppress warning during hot reload
						return;
					} else if (playError.message === 'Video play timeout') {
						throw new Error('Camera initialization timed out. Please try again.');
					}
					throw playError;
				}
			}
			
			isScanningRef.current = true;
			setScannerReady(true);
			setStatusText('Ready - scanning for QR codes...');
			
			// Start scanning with a slight delay
			setTimeout(() => {
				scanLoop();
			}, 500);
			
		} catch (e) {
			console.error('Camera access failed:', e);
			if (e.name === 'NotAllowedError') {
				setError('Camera access denied. Please grant camera permission in your browser settings.');
				setStatusText('Permission denied - Click to retry');
				// Add button to retry camera access
				const retryButton = document.createElement('button');
				retryButton.innerHTML = 'Retry Camera Access';
				retryButton.className = 'bg-yellow-500 text-black px-4 py-2 rounded-lg mt-4';
				retryButton.onclick = startCamera;
				document.querySelector('.camera-error-container')?.appendChild(retryButton);
			} else if (e.name === 'NotFoundError') {
				setError('No camera found. Please ensure your device has a working camera.');
				setStatusText('No camera detected');
			} else {
				setError('Camera access failed. Please try again or use a different device.');
				setStatusText('Camera error');
			}
		} finally {
			setIsStarting(false);
		}
	};

	const stopCamera = () => {
		isScanningRef.current = false;
		setScannerReady(false);
		
		// Clean up video tracks
		if (streamRef.current) {
			const tracks = streamRef.current.getTracks();
			tracks.forEach(track => {
				try {
					track.stop();
				} catch (e) {
					console.warn('Error stopping track:', e);
				}
			});
			streamRef.current = null;
		}
		
		// Clean up video element
		if (videoRef.current) {
			try {
				videoRef.current.pause();
				videoRef.current.srcObject = null;
			} catch (e) {
				console.warn('Error cleaning up video element:', e);
			}
		}
		
		cameraTrackRef.current = null;
		setTorchEnabled(false);
	};
	
	// Torch/flashlight control
	const toggleTorch = async () => {
		if (!torchSupported || !cameraTrackRef.current) {
			setStatusText('Flashlight not supported');
			setTimeout(() => setStatusText('Scanning for QR codes...'), 1500);
			return;
		}
		
		try {
			const newTorchState = !torchEnabled;
			await cameraTrackRef.current.applyConstraints({
				advanced: [{ torch: newTorchState }]
			});
			setTorchEnabled(newTorchState);
			setStatusText(newTorchState ? 'Flashlight ON' : 'Flashlight OFF');
			setTimeout(() => setStatusText('Scanning for QR codes...'), 1000);
		} catch (error) {
			console.warn('Failed to toggle torch:', error);
			setStatusText('Flashlight control failed');
			setTimeout(() => setStatusText('Scanning for QR codes...'), 1500);
		}
	};

	useEffect(() => {
		let mounted = true;
		let retryTimeout = null;
		let retryCount = 0;
		const MAX_RETRIES = 3;
		
		const initCamera = async () => {
			if (!mounted) return;
			
			try {
				await startCamera();
				retryCount = 0; // Reset retry count on success
			} catch (error) {
				console.error('Failed to start camera:', error);
				
				// Retry logic for initialization failures
				if (mounted && retryCount < MAX_RETRIES) {
					retryCount++;
					console.log(`Retrying camera initialization (${retryCount}/${MAX_RETRIES})...`);
					retryTimeout = setTimeout(initCamera, 1000); // Retry after 1 second
				}
			}
		};

		// Initial camera start
		initCamera();

		return () => {
			mounted = false;
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}
			stopCamera();
		};
	}, []);
	
	// Handle page visibility changes and focus
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden) {
				stopCamera();
			} else {
				// Small delay before restarting camera when page becomes visible
				setTimeout(startCamera, 300);
			}
		};

		const handleFocus = () => {
			if (!streamRef.current && !document.hidden) {
				startCamera();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('focus', handleFocus);
		
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.addEventListener('focus', handleFocus);
		};
	}, []);

	const successBeep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y');

	const scanLoop = () => {
		if (!isScanningRef.current || !videoRef.current || !scannerReady) {
			return;
		}
		
		const video = videoRef.current;
		
		// Ensure video is loaded and has dimensions
		if (video.videoWidth === 0 || video.videoHeight === 0) {
			setTimeout(scanLoop, 100);
			return;
		}
		
		// Create or reuse canvas
		if (!canvasRef.current) {
			canvasRef.current = document.createElement('canvas');
		}
		
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		
		if (!ctx) {
			setTimeout(scanLoop, 100);
			return;
		}
		
		try {
			// Set canvas size to match video
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			
			// Draw current frame
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			
			// Try different image processing techniques for better detection
			const attempts = [
				// Original image - try both normal and inverted
				() => {
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					return jsQR(imageData.data, canvas.width, canvas.height, {
						inversionAttempts: 'attemptBoth'
					});
				},
				// High contrast
				() => {
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					for (let i = 0; i < imageData.data.length; i += 4) {
						imageData.data[i] = Math.min(255, imageData.data[i] * 1.8);     // Red
						imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] * 1.8); // Green
						imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] * 1.8); // Blue
					}
					return jsQR(imageData.data, canvas.width, canvas.height, {
						inversionAttempts: 'attemptBoth'
					});
				},
				// Grayscale with higher contrast
				() => {
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					for (let i = 0; i < imageData.data.length; i += 4) {
						const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
						const enhanced = Math.min(255, avg * 2.0); // Higher contrast
						imageData.data[i] = enhanced;     // Red
						imageData.data[i + 1] = enhanced; // Green
						imageData.data[i + 2] = enhanced; // Blue
					}
					return jsQR(imageData.data, canvas.width, canvas.height, {
						inversionAttempts: 'attemptBoth'
					});
				},
				// Edge enhancement
				() => {
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					const data = imageData.data;
					const width = canvas.width;
					for (let i = 0; i < data.length; i += 4) {
						const x = (i / 4) % width;
						const y = Math.floor((i / 4) / width);
						if (x > 0 && x < width - 1 && y > 0 && y < canvas.height - 1) {
							const idx = i;
							const leftIdx = idx - 4;
							const rightIdx = idx + 4;
							
							for (let c = 0; c < 3; c++) {
								const current = data[idx + c];
								const left = data[leftIdx + c];
								const right = data[rightIdx + c];
								data[idx + c] = Math.min(255, Math.max(0, 
									current * 2 - (left + right) / 2
								));
							}
						}
					}
					return jsQR(data, canvas.width, canvas.height, {
						inversionAttempts: 'attemptBoth'
					});
				}
			];
			
			// Try each detection method until one works
			let code = null;
			for (const attempt of attempts) {
				try {
					code = attempt();
					if (code && code.data) {
						// Validate QR code format
						try {
							const qrData = JSON.parse(code.data);
							if (qrData && qrData.type === 'receipt' && qrData.id) {
								break; // Valid QR format found
							}
						} catch (e) {
							console.warn('Invalid QR format, continuing scan...');
							code = null;
							continue;
						}
					}
				} catch (error) {
					console.warn('QR detection attempt failed:', error);
					continue;
				}
			}
			
			if (code && code.data) {
				// Debounce detection to avoid duplicates
				const now = Date.now();
				if (now - lastDetectionTimeRef.current < 2000) {
					setTimeout(scanLoop, 100);
					return;
				}
				
				lastDetectionTimeRef.current = now;
				console.log('[QRScanner][jsQR] QR Code detected:', code.data);
				
				try {
					const qrData = JSON.parse(code.data);
					
					// Play success beep
					successBeep.play().catch(() => {});
					
					// Verify the receipt status
					// Verify the receipt
					const lastDigit = parseInt(qrData.id.slice(-1));
					let status;
					
					if (lastDigit >= 0 && lastDigit <= 5) {
						status = 'verified';
					} else if (lastDigit >= 6 && lastDigit <= 8) {
						status = 'already_scanned';
					} else {
						status = 'invalid';
					}
					
					// Update UI based on verification result
					setStatusText(
						status === 'verified' 
							? '✓ Receipt is legitimate' 
							: status === 'already_scanned' 
								? '⚠ Receipt already scanned' 
								: '✗ Receipt is invalid'
					);
					
					setScanResult(status);
					isScanningRef.current = false;
					
					// Fire custom event with verification result
					window.dispatchEvent(new CustomEvent('qr-code-verified', { 
						detail: { 
							data: qrData,
							status: status 
						} 
					}));
					
					// Return to dashboard after delay
					setTimeout(() => {
						setScanResult(null);
						setCurrentScreen('securityDashboard');
					}, 2500);
					
				} catch (parseError) {
					console.error('Invalid QR code format:', parseError);
					setStatusText('Invalid QR code format. Please try again.');
					setTimeout(scanLoop, 1000);
				}
				return;
			}
			
		} catch (error) {
			console.warn('[QRScanner][jsQR] Scan error:', error);
		}
		
		// Continue scanning at higher frequency for better detection
		if (isScanningRef.current) {
			setTimeout(scanLoop, 50); // Increased frequency for better QR detection
		}
	};

	return (
		<div className={`min-h-screen bg-black flex flex-col ${slideIn}`}>
			<div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent">
				<button 
					onClick={() => { stopCamera(); setCurrentScreen('securityDashboard'); }}
					className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20"
				>
					<ArrowLeft className="w-5 h-5 text-white" />
				</button>
				<h2 className="text-white font-bold">Scan Receipt QR</h2>
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
				</div>
			</div>

			<div className="flex-1 flex items-center justify-center p-6">
				{!scanResult ? (
					<div className="relative">
						<div className="w-80 h-96 rounded-3xl relative overflow-hidden border-2 border-yellow-400/30">
							<video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
							<div className="pointer-events-none absolute inset-0">
								<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
								<div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400"></div>
								<div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400"></div>
								<div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400"></div>
								<div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400"></div>
								<canvas ref={canvasRef} className="hidden" />
							</div>
						</div>
						{error && (
							<div className="camera-error-container flex flex-col items-center">
								<p className="text-red-400 text-center mt-3 font-medium">{error}</p>
								<button 
									onClick={startCamera}
									className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg mt-4 transition-colors"
								>
									Retry Camera Access
								</button>
							</div>
						)}
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
					<div className="flex items-center justify-center space-x-2 mb-2">
						<div className={`w-2 h-2 rounded-full ${
							scannerReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-bounce'
						}`}></div>
						<p className="text-white/80 text-center font-medium">{statusText}</p>
					</div>
					{error && <p className="text-red-400 text-center text-sm mt-2">{error}</p>}
				</div>
			)}
		</div>
	);
};

export default QRScannerComponent;

