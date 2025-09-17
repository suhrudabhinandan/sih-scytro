'use client'

import React from 'react';
import { ShoppingCart, LogIn } from 'lucide-react';

const IntroScreen = ({ setCurrentScreen, fadeIn, bounceIn }) => (
  <div className={`min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex flex-col ${fadeIn}`}>
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <div className="absolute top-20 left-10 w-32 h-32 border border-white rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-16 w-20 h-20 border border-white rounded-full animate-bounce delay-300"></div>
      <div className="absolute bottom-32 left-20 w-16 h-16 border border-white rounded-full animate-pulse delay-500"></div>
    </div>
    
    <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10">
      <div className={`text-center mb-16 ${bounceIn}`}>
        <div className="w-28 h-28 mx-auto mb-8 bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl flex items-center justify-center shadow-xl">
          <ShoppingCart className="w-14 h-14 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-wider font-vierkant">Scytro</h1>
        <div className="w-24 h-px bg-white/30 mx-auto mb-6"></div>
        <p className="text-white/90 text-lg font-medium tracking-wide">
          Self-Mobile Checkout
        </p>
        <p className="text-white/80 text-sm mt-2 font-medium">
          Scan • Pay • Go
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={() => setCurrentScreen('userDashboard')}
          className="w-full bg-white text-yellow-600 font-bold py-4 px-6 rounded-2xl shadow-lg backdrop-blur-sm transform transition-all duration-300 hover:bg-gray-50 hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Start Shopping</span>
        </button>
        
        <button 
          onClick={() => setCurrentScreen('login')}
          className="w-full bg-white/20 backdrop-blur-sm text-white font-bold py-4 px-6 rounded-2xl border border-white/30 transform transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95 flex items-center justify-center space-x-3"
        >
          <LogIn className="w-5 h-5" />
          <span>Login</span>
        </button>
      </div>

        <div className="mt-8">
          <button 
            onClick={() => setCurrentScreen('register')}
            className="text-white/90 text-sm font-medium hover:text-white transition-colors border-b border-white/30 pb-1"
          >
            New customer? Create account
          </button>
        </div>
    </div>

    <div className="p-6 text-center">
      <p className="text-white/70 text-xs font-medium">
        Team Web Shooters • Gandhi Engineering College
      </p>
    </div>
  </div>
);

export default IntroScreen;
