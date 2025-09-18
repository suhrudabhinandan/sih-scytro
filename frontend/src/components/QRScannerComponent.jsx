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
		if (isStarting || streamRef.current) return;
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
				await videoRef.current.play();
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
			setError('Camera access denied or unavailable.');
			setStatusText('Camera access failed');
		} finally {
			setIsStarting(false);
		}
	};

	const stopCamera = () => {
		isScanningRef.current = false;
		setScannerReady(false);
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(t => t.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
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
		startCamera();
		return () => {
			stopCamera();
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
			
			// Get image data for QR detection
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			
			// Enhanced QR detection with better options
			const code = jsQR(imageData.data, canvas.width, canvas.height, {
				inversionAttempts: 'dontInvert'
			});
			
			if (code && code.data) {
				// Debounce detection to avoid duplicates
				const now = Date.now();
				if (now - lastDetectionTimeRef.current < 2000) {
					setTimeout(scanLoop, 100);
					return;
				}
				
				lastDetectionTimeRef.current = now;
				console.log('[QRScanner][jsQR] QR Code detected:', code.data);
				successBeep.play().catch(() => {});
				setStatusText(`✓ QR Code detected!`);
				
				// Fire a custom event for real QR code actions
				window.dispatchEvent(new CustomEvent('qr-code-scanned', { detail: { data: code.data } }));
				setScanResult('verified'); // For demo, mark as verified
				isScanningRef.current = false;
				
				setTimeout(() => {
					setScanResult(null);
					setCurrentScreen('securityDashboard');
				}, 2500);
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
						{error && <p className="text-red-400 text-center mt-3 font-medium">{error}</p>}
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

