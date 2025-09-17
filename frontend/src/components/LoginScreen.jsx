'use client'

import React from 'react';
import { ArrowLeft, User, Package, Shield, Phone, Lock, Eye, EyeOff } from 'lucide-react';

const LoginScreen = ({ 
  loginType, 
  setLoginType, 
  phoneNumber, 
  setPhoneNumber, 
  adminId, 
  setAdminId, 
  securityId, 
  setSecurityId, 
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
  verifyLogin, 
  registerUser, 
  isLoading, 
  setCurrentScreen, 
  slideIn 
}) => (
  <div className={`min-h-screen bg-gray-50 ${slideIn}`}>
    <div className="p-6">
      <button 
        onClick={() => setCurrentScreen('intro')}
        className="mb-6 p-3 rounded-full bg-white shadow-sm border border-gray-200"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Login</h2>
        <p className="text-gray-600">Choose your account type</p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-blue-700 text-sm font-medium">
            💼 Employees: Admin & Security staff accounts are pre-configured
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div 
          onClick={() => setLoginType('user')}
          className={`bg-white rounded-2xl p-4 shadow-sm border-2 transform transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer ${
            loginType === 'user' ? 'border-yellow-400' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              loginType === 'user' ? 'bg-yellow-100' : 'bg-gray-100'
            }`}>
              <User className={`w-6 h-6 ${loginType === 'user' ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${loginType === 'user' ? 'text-gray-900' : 'text-gray-600'}`}>Customer</h3>
              <p className="text-sm text-gray-500">Shop and checkout</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setLoginType('admin')}
          className={`bg-white rounded-2xl p-4 shadow-sm border-2 transform transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer ${
            loginType === 'admin' ? 'border-yellow-400' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              loginType === 'admin' ? 'bg-yellow-100' : 'bg-gray-100'
            }`}>
              <Package className={`w-6 h-6 ${loginType === 'admin' ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${loginType === 'admin' ? 'text-gray-900' : 'text-gray-600'}`}>Inventory Admin</h3>
              <p className="text-sm text-gray-500">Manage inventory</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setLoginType('security')}
          className={`bg-white rounded-2xl p-4 shadow-sm border-2 transform transition-all duration-300 hover:scale-102 active:scale-98 cursor-pointer ${
            loginType === 'security' ? 'border-yellow-400' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              loginType === 'security' ? 'bg-yellow-100' : 'bg-gray-100'
            }`}>
              <Shield className={`w-6 h-6 ${loginType === 'security' ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${loginType === 'security' ? 'text-gray-900' : 'text-gray-600'}`}>Security Staff</h3>
              <p className="text-sm text-gray-500">Verify receipts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loginType === 'user' ? (
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
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {loginType === 'admin' ? 'Admin ID' : 'Security ID'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={loginType === 'admin' ? adminId : securityId}
                  onChange={(e) => loginType === 'admin' ? setAdminId(e.target.value) : setSecurityId(e.target.value)}
                  placeholder={loginType === 'admin' ? 'Admin ID (format: IA1234)' : 'Security ID (6 characters)'}
                  className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  maxLength={6}
                />
              </div>
              {loginType === 'admin' && adminId && !/^IA\d{4}$/.test(adminId) && (
                <p className="text-xs text-red-600 mt-2 font-medium">Admin ID must be IA followed by 4 digits (e.g., IA1234)</p>
              )}
              {loginType === 'security' && securityId && securityId.length !== 6 && (
                <p className="text-xs text-red-600 mt-2 font-medium">Security ID must be exactly 6 characters</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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
          </>
        )}

        {!otpSent ? (
          <button 
            onClick={sendOTP}
            disabled={
              (loginType === 'user' && phoneNumber.length !== 10) ||
              (loginType === 'admin' && (!/^IA\d{4}$/.test(adminId) || password.length < 6)) ||
              (loginType === 'security' && (securityId.length !== 6 || password.length < 6)) ||
              isLoading
            }
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
              <p className="text-sm text-gray-500 mt-2">
                OTP sent to {loginType === 'user' ? `+91 ${phoneNumber}` : 'registered contact'}
              </p>
            </div>

            <button 
              onClick={verifyLogin}
              disabled={otp.join('').length !== 6 || isLoading}
              className="w-full bg-yellow-500 text-white font-bold py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:bg-yellow-600 active:scale-95"
            >
              {isLoading ? 'Verifying...' : 'Login'}
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

export default LoginScreen;
