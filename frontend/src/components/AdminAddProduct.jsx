'use client'

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Save, RefreshCw } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const AdminAddProduct = ({ setCurrentScreen, onProductAdded, slideIn }) => {
	const [barcode, setBarcode] = useState('');
	const [name, setName] = useState('');
	const [type, setType] = useState('');
	const [price, setPrice] = useState('');
	const [productId, setProductId] = useState('');
	const [scanning, setScanning] = useState(true);
	const videoRef = useRef(null);
	const readerRef = useRef(null);

	useEffect(() => {
		readerRef.current = new BrowserMultiFormatReader();
		const startScanning = () => {
			if (!videoRef.current || !scanning || !readerRef.current) return;
			
			const scanFrame = async () => {
				if (!videoRef.current || !scanning) return;
				try {
					const result = await readerRef.current.decodeOnceFromVideoElement(videoRef.current);
					if (result && result.getText) {
						const code = result.getText();
						console.log('Admin barcode detected:', code);
						setBarcode(code);
						setScanning(false);
						new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y').play().catch(()=>{});
						return;
					}
				} catch (e) {
					// ignore decode errors
				}
				if (scanning) {
					setTimeout(scanFrame, 100);
				}
			};
			scanFrame();
		};
		
		if (scanning) {
			setTimeout(startScanning, 1000);
		}
		
		return () => {
			try { readerRef.current?.reset(); } catch {}
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
				<button onClick={() => setCurrentScreen('adminDashboard')} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white">
					<ArrowLeft className="w-5 h-5 text-gray-700" />
				</button>
				<h2 className="font-bold text-gray-900">Add Product</h2>
				<div className="w-10"></div>
			</div>

			<div className="p-6 space-y-6">
				<div className="rounded-2xl overflow-hidden border border-gray-200 bg-black">
					<video ref={videoRef} className="w-full h-64 object-cover" autoPlay muted playsInline />
				</div>

				<form onSubmit={submit} className="space-y-4">
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Scanned Barcode" value={barcode} readOnly />
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Product Name" value={name} onChange={e=>setName(e.target.value)} required />
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Product Type" value={type} onChange={e=>setType(e.target.value)} required />
					<input type="number" min="0" step="0.01" className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} required />
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Product ID (SKU)" value={productId} onChange={e=>setProductId(e.target.value)} required />
					<div className="flex gap-3">
						<button type="submit" disabled={!barcode} className="flex-1 bg-yellow-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
							<Save className="w-5 h-5" /> Save & Add Next
						</button>
						<button type="button" onClick={resetForNext} className="flex-1 bg-white border border-gray-200 font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
							<RefreshCw className="w-5 h-5" /> Rescan
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AdminAddProduct;
