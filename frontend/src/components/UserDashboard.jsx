'use client'

import React from 'react';
import { ShoppingCart, Camera, History, Star, Headphones } from 'lucide-react';

const UserDashboard = ({ setCurrentScreen, scannedProducts, slideIn }) => (
  <div className={`min-h-screen bg-gray-50 ${slideIn}`}>
    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Good morning</h1>
          <p className="text-white/90 text-sm font-medium">Ready to shop?</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setCurrentScreen('cart')}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center relative border border-white/30"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {scannedProducts.length > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-xs font-bold">{scannedProducts.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>

    <div className="p-6">
      <button 
        onClick={() => setCurrentScreen('scanner')}
        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold py-8 px-6 rounded-3xl shadow-lg mb-8 transform transition-all duration-300 hover:from-yellow-600 hover:to-yellow-700 hover:scale-105 active:scale-95"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
            <Camera className="w-8 h-8" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">Scan Products</div>
            <div className="text-white/90 text-sm font-medium">Start adding items to your cart</div>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => setCurrentScreen('cart')}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">View Cart</h3>
            <p className="text-xs text-gray-600 font-medium mt-1">
              {scannedProducts.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
          </div>
        </button>

        <button className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <History className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Orders</h3>
            <p className="text-xs text-gray-600 font-medium mt-1">Purchase history</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Rewards</h3>
            <p className="text-xs text-gray-600 font-medium mt-1">Loyalty points</p>
          </div>
        </button>

        <button onClick={() => setCurrentScreen('support')} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Support</h3>
            <p className="text-xs text-gray-600 font-medium mt-1">Get help</p>
          </div>
        </button>
      </div>
    </div>
  </div>
);

export default UserDashboard;

