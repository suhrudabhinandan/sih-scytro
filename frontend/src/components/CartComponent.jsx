'use client'

import React from 'react';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

const CartComponent = ({ 
  scannedProducts, 
  updateQuantity, 
  removeProduct, 
  setCurrentScreen, 
  slideIn 
}) => {
  const total = scannedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return (
    <div className={`min-h-screen bg-gray-50 ${slideIn}`}>
      <div className="bg-white p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setCurrentScreen('userDashboard')}
            className="p-2 rounded-full bg-yellow-100"
          >
            <ArrowLeft className="w-5 h-5 text-yellow-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
        </div>
      </div>

      <div className="p-6">
        {scannedProducts.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 font-medium mb-8">Start scanning products to add them here</p>
            <button 
              onClick={() => setCurrentScreen('scanner')}
              className="bg-yellow-500 text-white px-8 py-3 rounded-2xl font-bold"
            >
              Start Scanning
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {scannedProducts.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600 font-medium">{item.brand}</p>
                    <p className="font-bold text-yellow-600 mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeProduct(item.id)}
                      className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {scannedProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white p-6 border-t border-gray-100 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium text-gray-600">Total Amount</span>
            <span className="text-2xl font-bold text-yellow-600">₹{total}</span>
          </div>
          <button 
            onClick={() => setCurrentScreen('payment')}
            className="w-full bg-yellow-500 text-white font-bold py-4 rounded-2xl transform transition-all duration-200 hover:bg-yellow-600 active:scale-95"
          >
            Proceed to Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default CartComponent;

