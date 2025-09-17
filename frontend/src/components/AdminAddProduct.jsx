'use client'

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
// MediaPipe is imported dynamically at runtime to avoid build-time export issues across versions

const AdminAddProduct = ({ setCurrentScreen, onProductAdded, slideIn }) => {
	const [barcode, setBarcode] = useState('');
	const [name, setName] = useState('');
	const [type, setType] = useState('');
	const [price, setPrice] = useState('');
	const [productId, setProductId] = useState('');
	const [scanning, setScanning] = useState(true);
	const [isStarting, setIsStarting] = useState(false);
	const [error, setError] = useState('');
	const videoRef = useRef(null);
	const readerRef = useRef(null);
	const mpScannerRef = useRef(null);
	const rafIdRef = useRef(null);
	const streamRef = useRef(null);
	const nameInputRef = useRef(null);
	const lastScanTsRef = useRef(0);
	const [statusText, setStatusText] = useState('Scanning...');

	const startCamera = async () => {
		if (isStarting || streamRef.current) return;
		setError('');
		setIsStarting(true);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
			streamRef.current = stream;
			const [track] = stream.getVideoTracks();
			try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch {}
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play().catch(()=>{});
			}
		} catch (e) {
			setError('Camera access denied or unavailable.');
		} finally {
			setIsStarting(false);
		}
	};

	const stopCamera = () => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(t=>t.stop());
			streamRef.current = null;
		}
		if (videoRef.current) videoRef.current.srcObject = null;
	};

	useEffect(() => {
		startCamera();
		return () => { stopCamera(); };
	}, []);

	useEffect(() => {
		readerRef.current = new BrowserMultiFormatReader();

		const startMediapipe = async () => {
			try {
				const MP = await import('@mediapipe/tasks-vision');
				const FilesetResolver = MP.FilesetResolver;
				const BarcodeScanner = MP.BarcodeScanner;
				if (!FilesetResolver || !BarcodeScanner) throw new Error('MediaPipe BarcodeScanner unavailable');
				const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.10/wasm');
				mpScannerRef.current = await BarcodeScanner.createFromOptions(vision, {
					baseOptions: {
						modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/barcode_scanner/barcode_scanner/float16/1/barcode_scanner.task',
						delegate: 'GPU'
					},
					runningMode: 'VIDEO'
				});
				return true;
			} catch {
				mpScannerRef.current = null;
				return false;
			}
		};

		const handleDetected = (code) => {
			const now = Date.now();
			if (now - lastScanTsRef.current < 2500) return; // 2.5s cooldown
			lastScanTsRef.current = now;
			setBarcode(code);
			new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y').play().catch(()=>{});
			setStatusText(`Detected: ${String(code).slice(0,24)}`);
			setTimeout(()=>{ setStatusText('Scanning...'); nameInputRef.current?.focus(); }, 400);
		};

		const loopMediapipe = () => {
			if (!videoRef.current || !scanning || !mpScannerRef.current) return;
			try {
				const result = mpScannerRef.current.detectForVideo(videoRef.current, performance.now());
				const code = result?.barcodes?.[0]?.rawValue || result?.barcodes?.[0]?.displayValue;
				if (code) {
					handleDetected(code);
					setTimeout(() => { if (scanning) { rafIdRef.current = requestAnimationFrame(loopMediapipe); } }, 1000);
					return;
				}
			} catch {}
			if (scanning) { rafIdRef.current = requestAnimationFrame(loopMediapipe); }
		};

		const startZXing = () => {
			if (!videoRef.current || !scanning || !readerRef.current) return;
			const scanFrame = async () => {
				if (!videoRef.current || !scanning) return;
				try {
					const result = await readerRef.current.decodeOnceFromVideoElement(videoRef.current);
					if (result && result.getText) {
						handleDetected(result.getText());
						setTimeout(()=>{ if (scanning) setTimeout(scanFrame, 100); }, 1000);
						return;
					}
				} catch {}
				if (scanning) setTimeout(scanFrame, 120);
			};
			scanFrame();
		};

		let cancelled = false;
		(async () => {
			if (!scanning) return;
			const ok = await startMediapipe();
			if (cancelled) return;
			if (ok && mpScannerRef.current) {
				rafIdRef.current = requestAnimationFrame(loopMediapipe);
			} else {
				setTimeout(startZXing, 500);
			}
		})();

		return () => {
			cancelled = true;
			try { readerRef.current?.reset(); } catch {}
			if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
			try { mpScannerRef.current?.close?.(); } catch {}
		};
	}, [scanning]);

	const resetForNext = () => {
		setBarcode(''); setName(''); setType(''); setPrice(''); setProductId(''); setScanning(true);
	};

	const submit = (e) => {
		e.preventDefault();
		const product = { barcode, name, type, price: Number(price), productId, createdAt: new Date().toISOString() };
		onProductAdded?.(product);
		resetForNext();
	};

	return (
		<div className={`min-h-screen bg-gray-50 ${slideIn}`}>
			<div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
				<button onClick={() => { stopCamera(); setCurrentScreen('adminDashboard'); }} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white">
					<ArrowLeft className="w-5 h-5 text-gray-700" />
				</button>
				<h2 className="font-bold text-gray-900">Add Product</h2>
				<div className="w-10"></div>
			</div>

			<div className="p-6 space-y-6">
				<div className="rounded-2xl overflow-hidden border border-gray-200 bg-black relative">
					<video ref={videoRef} className="w-full h-64 object-cover" autoPlay muted playsInline />
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<div className="w-72 h-72 border-2 border-yellow-400/70 rounded-3xl relative">
							<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse"></div>
							<div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400"></div>
							<div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400"></div>
							<div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400"></div>
							<div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400"></div>
							<div className="scan-line"></div>
						</div>
					</div>
					<div className="absolute bottom-3 left-0 right-0 flex justify-center">
						<p className="bg-black/70 text-white px-4 py-2 rounded-xl text-sm font-medium">{statusText}</p>
					</div>
				</div>
				{error && <p className="text-red-600 text-sm">{error}</p>}

				<form onSubmit={submit} className="space-y-4">
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Scanned Barcode" value={barcode} readOnly />
					<input ref={nameInputRef} className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Product Name" value={name} onChange={e=>setName(e.target.value)} required />
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Product Type" value={type} onChange={e=>setType(e.target.value)} required />
					<input type="number" min="0" step="0.01" className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} required />
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Product ID (SKU)" value={productId} onChange={e=>setProductId(e.target.value)} required />
					<div className="flex gap-3">
						<button type="submit" disabled={!barcode} className="flex-1 bg-yellow-500 text-white font-bold py-3 rounded-2xl">Save & Add Next</button>
						<button type="button" onClick={resetForNext} className="flex-1 bg-white border border-gray-200 font-bold py-3 rounded-2xl">Rescan</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AdminAddProduct;
