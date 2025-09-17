'use client'

import React from 'react';
import { ArrowLeft, Phone, Lock, Eye, EyeOff } from 'lucide-react';

const RegisterUserForm = ({ 
  phoneNumber, 
  setPhoneNumber, 
  password, 
  setPassword, 
  showPassword, 
  setShowPassword, 
  otp, 
  otpRefs, 
  handleOtpChange, 
  handleOtpKeyDown, 
  handleOtpPaste, 
  otpSent, 
  setOtpSent, 
  sendOTP, 
  registerUser, 
  isLoading, 
  setCurrentScreen, 
  slideIn 
}) => (
  <div className={`min-h-screen bg-gray-50 ${slideIn}`}>
    <div className="p-6">
      <button 
        onClick={() => setCurrentScreen('register')}
        className="mb-6 p-3 rounded-full bg-white shadow-sm border border-gray-200"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Create Customer Account</h2>
        <p className="text-gray-600">Register to start shopping</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              maxLength="10"
            />
          </div>
        </div>

        {!otpSent ? (
          <button 
            onClick={sendOTP}
            disabled={phoneNumber.length !== 10 || isLoading}
            className="w-full bg-yellow-500 text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:bg-yellow-600 active:scale-95"
          >
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP</label>
              <div className="flex space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => otpRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                    maxLength="1"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">OTP sent to +91 {phoneNumber}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full pl-10 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button 
              onClick={registerUser}
              disabled={phoneNumber.length !== 10 || otp.join('').length !== 6 || password.length < 6 || isLoading}
              className="w-full bg-yellow-500 text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:bg-yellow-600 active:scale-95"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <button 
              onClick={() => setOtpSent(false)}
              className="w-full text-yellow-600 font-medium py-2"
            >
              Resend OTP
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

export default RegisterUserForm;

