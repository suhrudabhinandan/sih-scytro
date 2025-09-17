'use client'

import React from 'react';
import { ArrowLeft, User, UserPlus } from 'lucide-react';

const RegisterScreen = ({ setCurrentScreen, slideIn }) => (
  <div className={`min-h-screen bg-gray-50 ${slideIn}`}>
    <div className="p-6">
      <button 
        onClick={() => setCurrentScreen('intro')}
        className="mb-6 p-3 rounded-full bg-white shadow-sm border border-gray-200"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-yellow-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <UserPlus className="w-10 h-10 text-yellow-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Create Account</h2>
        <p className="text-gray-600">Join Scytro to start shopping</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">Customer Registration</h3>
            <p className="text-gray-600 text-sm">Create your account to start shopping with Scytro</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Phone number verification</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Secure password setup</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Instant access to shopping</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setCurrentScreen('registerUser')}
          className="w-full bg-yellow-500 text-white font-bold py-4 rounded-2xl transform transition-all duration-200 hover:bg-yellow-600 active:scale-95 flex items-center justify-center space-x-3"
        >
          <UserPlus className="w-5 h-5" />
          <span>Create Customer Account</span>
        </button>

        <div className="text-center">
          <p className="text-gray-600 text-sm mb-4">Already have an account?</p>
          <button 
            onClick={() => setCurrentScreen('login')}
            className="text-yellow-600 font-medium hover:text-yellow-700 transition-colors"
          >
            Sign in instead
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs font-bold">i</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm mb-1">Employee Access</h4>
              <p className="text-blue-700 text-xs">
                Admin and Security staff accounts are managed by the system administrator. 
                Please contact your supervisor for login credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default RegisterScreen;
