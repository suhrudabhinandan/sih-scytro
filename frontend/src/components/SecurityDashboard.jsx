'use client'

import React from 'react';
import { Shield, QrCode, CheckCircle, XCircle } from 'lucide-react';

const SecurityDashboard = ({ setCurrentScreen, slideIn }) => (
  <div className={`min-h-screen bg-gray-50 ${slideIn}`}>
    <div className="bg-white p-6 border-b border-gray-100">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Panel</h1>
          <p className="text-gray-600 text-sm font-medium">Verify customer receipts</p>
        </div>
        <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-yellow-600" />
        </div>
      </div>
    </div>

    <div className="p-6">
      <button 
        onClick={() => setCurrentScreen('qrScanner')}
        className="w-full bg-yellow-500 text-white font-bold py-8 px-6 rounded-3xl shadow-lg mb-8 transform transition-all duration-300 hover:bg-yellow-600 hover:scale-105 active:scale-95"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">Scan Receipt QR</div>
            <div className="text-white/90 text-sm font-medium">Verify customer purchase</div>
          </div>
        </div>
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-6">Recent Verifications</h3>
        <div className="space-y-4">
          {[
            { id: 1, time: '2 mins ago', status: 'verified', amount: '₹195' },
            { id: 2, time: '5 mins ago', status: 'verified', amount: '₹450' },
            { id: 3, time: '8 mins ago', status: 'invalid', amount: '₹320' }
          ].map((scan) => (
            <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                {scan.status === 'verified' ? (
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{scan.amount}</p>
                  <p className="text-sm text-gray-600 font-medium">{scan.time}</p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                scan.status === 'verified' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {scan.status === 'verified' ? 'Verified' : 'Invalid'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default SecurityDashboard;

