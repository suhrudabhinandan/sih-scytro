'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import IntroScreen from '@/components/IntroScreen'
import LoginScreen from '@/components/LoginScreen'
import RegisterScreen from '@/components/RegisterScreen'
import RegisterUserForm from '@/components/RegisterUserForm'
import UserDashboard from '@/components/UserDashboard'
import ScannerComponent from '@/components/ScannerComponent'
import CartComponent from '@/components/CartComponent'
import PaymentComponent from '@/components/PaymentComponent'
import SecurityDashboard from '@/components/SecurityDashboard'
import QRScannerComponent from '@/components/QRScannerComponent'
import AdminDashboard from '@/components/AdminDashboard'

export default function Home() {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState('intro')
  const [user, setUser] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  const [scannedProducts, setScannedProducts] = useState<any[]>([])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [adminId, setAdminId] = useState('')
  const [securityId, setSecurityId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginType, setLoginType] = useState('user')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Mock database products
  const mockDatabase: { [key: string]: { id: number; name: string; brand: string; price: number; category: string } } = {
    '8901030895146': { id: 1, name: 'Tata Salt', brand: '1kg Pack', price: 28, category: 'Grocery' },
    '8901552490067': { id: 2, name: 'Maggi Noodles', brand: '70g Pack', price: 14, category: 'Instant Food' },
    '8901030875056': { id: 3, name: 'Britannia Bread', brand: 'Whole Wheat', price: 45, category: 'Bakery' },
    '8901030869765': { id: 4, name: 'Amul Milk', brand: '1 Litre', price: 60, category: 'Dairy' },
    '8901030895123': { id: 5, name: 'Fortune Oil', brand: '1L Refined', price: 165, category: 'Cooking' }
  }

  // Animation classes
  const slideIn = "animate-in slide-in-from-right duration-300"
  const fadeIn = "animate-in fade-in duration-500"
  const bounceIn = "animate-in zoom-in duration-200 ease-out"

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
      
      setStream(mediaStream)
      setIsScanning(true)
      scanForBarcode()
    } catch (error) {
      console.error('Camera access denied:', error)
      alert('Camera access is required for scanning. Please allow camera access.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const scanForBarcode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    const scanFrame = () => {
      if (!isScanning) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      requestAnimationFrame(scanFrame)
    }

    video.addEventListener('loadedmetadata', () => {
      scanFrame()
    })
  }

  // Simulate barcode scanning
  const simulateBarcodeScan = () => {
    const barcodes = Object.keys(mockDatabase)
    const randomBarcode = barcodes[Math.floor(Math.random() * barcodes.length)]
    const product = mockDatabase[randomBarcode]
    
    if (product) {
      const existingItem = scannedProducts.find(item => item.id === product.id)
      
      if (existingItem) {
        setScannedProducts(prev => 
          prev.map(item => 
            item.id === product.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        )
      } else {
        setScannedProducts(prev => [...prev, { ...product, quantity: 1 }])
      }
      
      const successSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+3y')
      successSound.play().catch(() => {})
    }
  }

  const updateQuantity = (productId: number, change: number) => {
    setScannedProducts(prev => 
      prev.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(0, item.quantity + change)
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
        }
        return item
      }).filter(Boolean)
    )
  }

  const removeProduct = (productId: number) => {
    setScannedProducts(prev => prev.filter(item => item.id !== productId))
  }

  // OTP handling with improved auto-focus
  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      if (value && index < 5) {
        setTimeout(() => {
          otpRefs.current[index + 1]?.focus()
        }, 10)
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      setTimeout(() => {
        otpRefs.current[index - 1]?.focus()
      }, 10)
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '')
    const newOtp = [...otp]
    
    for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    
    const nextIndex = Math.min(pastedData.length, 5)
    setTimeout(() => {
      otpRefs.current[nextIndex]?.focus()
    }, 10)
  }

  const sendOTP = () => {
    if (phoneNumber.length === 10) {
      setIsLoading(true)
      setTimeout(() => {
        setOtpSent(true)
        setIsLoading(false)
        setTimeout(() => {
          otpRefs.current[0]?.focus()
        }, 100)
      }, 2000)
    }
  }

  const verifyLogin = () => {
    const otpString = otp.join('')
    
    if (loginType === 'user') {
      if (phoneNumber.length === 10 && otpString.length === 6) {
        setIsLoading(true)
        setTimeout(() => {
          setUser({ phone: phoneNumber, type: 'user' })
          setCurrentScreen('userDashboard')
          setIsLoading(false)
          resetForm()
        }, 2000)
      }
    } else if (loginType === 'admin') {
      if (adminId.length >= 3 && password.length >= 6 && otpString.length === 6) {
        setIsLoading(true)
        setTimeout(() => {
          setUser({ adminId: adminId, type: 'admin' })
          setCurrentScreen('adminDashboard')
          setIsLoading(false)
          resetForm()
        }, 2000)
      }
    } else if (loginType === 'security') {
      if (securityId.length >= 3 && password.length >= 6 && otpString.length === 6) {
        setIsLoading(true)
        setTimeout(() => {
          setUser({ securityId: securityId, type: 'security' })
          setCurrentScreen('securityDashboard')
          setIsLoading(false)
          resetForm()
        }, 2000)
      }
    }
  }

  const registerUser = () => {
    const otpString = otp.join('')
    if (phoneNumber.length === 10 && otpString.length === 6 && password.length >= 6) {
      setIsLoading(true)
      setTimeout(() => {
        setUser({ phone: phoneNumber, type: 'user' })
        setCurrentScreen('userDashboard')
        setIsLoading(false)
        resetForm()
      }, 2000)
    }
  }

  const resetForm = () => {
    setPhoneNumber('')
    setOtp(['', '', '', '', '', ''])
    setPassword('')
    setAdminId('')
    setSecurityId('')
    setOtpSent(false)
    setLoginType('user')
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Screen Router
  const renderScreen = () => {
    switch(currentScreen) {
      case 'intro': 
        return <IntroScreen setCurrentScreen={setCurrentScreen} fadeIn={fadeIn} bounceIn={bounceIn} />
      case 'login': 
        return <LoginScreen 
          loginType={loginType}
          setLoginType={setLoginType}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          adminId={adminId}
          setAdminId={setAdminId}
          securityId={securityId}
          setSecurityId={setSecurityId}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          otp={otp}
          otpRefs={otpRefs}
          handleOtpChange={handleOtpChange}
          handleOtpKeyDown={handleOtpKeyDown}
          handleOtpPaste={handleOtpPaste}
          otpSent={otpSent}
          setOtpSent={setOtpSent}
          sendOTP={sendOTP}
          verifyLogin={verifyLogin}
          registerUser={registerUser}
          isLoading={isLoading}
          setCurrentScreen={setCurrentScreen}
          slideIn={slideIn}
        />
      case 'register': 
        return <RegisterScreen setCurrentScreen={setCurrentScreen} slideIn={slideIn} />
      case 'registerUser': 
        return <RegisterUserForm 
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          otp={otp}
          otpRefs={otpRefs}
          handleOtpChange={handleOtpChange}
          handleOtpKeyDown={handleOtpKeyDown}
          handleOtpPaste={handleOtpPaste}
          otpSent={otpSent}
          setOtpSent={setOtpSent}
          sendOTP={sendOTP}
          registerUser={registerUser}
          isLoading={isLoading}
          setCurrentScreen={setCurrentScreen}
          slideIn={slideIn}
        />
      case 'userDashboard': 
        return <UserDashboard 
          setCurrentScreen={setCurrentScreen} 
          scannedProducts={scannedProducts} 
          slideIn={slideIn} 
        />
      case 'scanner': 
        return <ScannerComponent 
          videoRef={videoRef}
          canvasRef={canvasRef}
          startCamera={startCamera}
          stopCamera={stopCamera}
          setCurrentScreen={setCurrentScreen}
          scannedProducts={scannedProducts}
          simulateBarcodeScan={simulateBarcodeScan}
          updateQuantity={updateQuantity}
          removeProduct={removeProduct}
          slideIn={slideIn}
        />
      case 'cart': 
        return <CartComponent 
          scannedProducts={scannedProducts}
          updateQuantity={updateQuantity}
          removeProduct={removeProduct}
          setCurrentScreen={setCurrentScreen}
          slideIn={slideIn}
        />
      case 'payment': 
        return <PaymentComponent 
          scannedProducts={scannedProducts}
          setCurrentScreen={setCurrentScreen}
          slideIn={slideIn}
        />
      case 'securityDashboard': 
        return <SecurityDashboard setCurrentScreen={setCurrentScreen} slideIn={slideIn} />
      case 'qrScanner': 
        return <QRScannerComponent setCurrentScreen={setCurrentScreen} slideIn={slideIn} />
      case 'adminDashboard': 
        return <AdminDashboard setCurrentScreen={setCurrentScreen} slideIn={slideIn} />
      default: 
        return <IntroScreen setCurrentScreen={setCurrentScreen} fadeIn={fadeIn} bounceIn={bounceIn} />
    }
  }

  return renderScreen()
}
