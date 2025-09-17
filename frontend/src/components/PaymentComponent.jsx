'use client'

import React, { useState } from 'react';
import { ArrowLeft, CreditCard, QrCode, CheckCircle } from 'lucide-react';

const PaymentComponent = ({ 
  scannedProducts, 
  setCurrentScreen, 
  slideIn 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const total = scannedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const processPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setCurrentScreen('userDashboard');
      }, 3000);
    }, 3000);
  };

  if (paymentSuccess) {
    return (
      <div className={`min-h-screen bg-green-50 flex flex-col items-center justify-center ${slideIn}`}>
        <div className="text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-2">Thank you for your purchase</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${slideIn}`}>
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setCurrentScreen('cart')}
            className="p-2 rounded-full bg-yellow-100"
          >
            <ArrowLeft className="w-5 h-5 text-yellow-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Payment</h2>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3">
            {scannedProducts.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-yellow-600">₹{total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Payment Method</h3>
          <div className="space-y-3">
            <div 
              onClick={() => setPaymentMethod('card')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'card' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-6 h-6 text-gray-600" />
                <span className="font-medium text-gray-900">Credit/Debit Card</span>
              </div>
            </div>
            <div 
              onClick={() => setPaymentMethod('qr')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                paymentMethod === 'qr' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <QrCode className="w-6 h-6 text-gray-600" />
                <span className="font-medium text-gray-900">QR Code Payment</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={processPayment}
          disabled={isProcessing}
          className="w-full bg-yellow-500 text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:bg-yellow-600 active:scale-95"
        >
          {isProcessing ? 'Processing Payment...' : `Pay ₹${total}`}
        </button>
      </div>
    </div>
  );
};

export default PaymentComponent;

