import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, EyeOff, Eye, Leaf, ShieldCheck, Check } from 'lucide-react';
import Logo from '../assets/Logo.png';
import BgImage from '../assets/bg.png';
import { Link } from 'react-router-dom';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div 
      className="min-h-screen w-full flex flex-col font-sans bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${BgImage})` }}
    >
      {/* 
        The background in the screenshot appears slightly lighter on the left and maybe darker on the bottom. 
        We'll use a very subtle gradient overlay to ensure text legibility.
      */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 w-full px-8 py-6 flex items-start justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={Logo} alt="Jal-Setu Logo" className="h-10 object-contain" />
          <div className="flex flex-col">
            <span className="font-bold text-[#111827] text-lg leading-tight tracking-tight drop-shadow-sm">JAL-SETU</span>
            <span className="text-[11px] text-gray-700 font-medium drop-shadow-sm">Spring Intelligence Platform</span>
          </div>
        </Link>

        {/* Top Right Text */}
        <div className="hidden md:flex flex-col items-end text-right mt-2">
          <span className="text-xs font-medium text-[#111827] drop-shadow-sm">A Water Secure India</span>
          <span className="text-xs font-medium text-[#111827] drop-shadow-sm mb-1">Starts at the Source.</span>
          <div className="w-6 h-[2px] bg-[#115E41]"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between px-8 lg:px-24 w-full max-w-[1440px] mx-auto pb-20">
        
        {/* Left Side: Text */}
        <div className="w-full lg:w-1/2 flex flex-col items-start text-left mb-12 lg:mb-0 lg:pr-10">
          <div className="w-8 h-[2px] bg-[#115E41] mb-6 drop-shadow-sm"></div>
          <h1 className="text-[3rem] lg:text-[4rem] font-bold leading-[1.1] tracking-tight text-[#111827] mb-4 drop-shadow-sm">
            Plan. Prioritise. <span className="text-[#115E41]">Revive.</span>
          </h1>
          <p className="text-lg text-gray-700 font-medium max-w-md drop-shadow-sm">
            Evidence-led spring revival planning for resilient communities.
          </p>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-[440px] lg:w-1/2 flex justify-end">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 w-full">
            <h2 className="text-3xl font-bold text-[#111827] mb-2">Welcome back</h2>
            <p className="text-sm text-gray-500 font-medium mb-8">Sign in to continue to spring intelligence.</p>

            <form className="flex flex-col gap-5">
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email or mobile number</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-400">
                    <Mail size={18} strokeWidth={2} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter your email or mobile number" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#115E41]/20 focus:border-[#115E41] transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-gray-400">
                    <Lock size={18} strokeWidth={2} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your password" 
                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#115E41]/20 focus:border-[#115E41] transition-all placeholder:text-gray-400"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between mt-1 mb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#115E41] border-[#115E41]' : 'bg-white border-gray-300 group-hover:border-[#115E41]'}`}>
                    {rememberMe && <Check size={12} className="text-white stroke-[3]" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={rememberMe} 
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <span className="text-sm font-medium text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm font-semibold text-[#115E41] hover:underline">Forgot password?</a>
              </div>

              {/* Sign In Button */}
              <Link to="/dashboard" className="w-full bg-[#115E41] hover:bg-[#0e4b34] text-white py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg">
                Sign In
                <ArrowRight size={16} />
              </Link>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-[1px] bg-gray-200"></div>
              <span className="text-xs font-medium text-gray-400 uppercase">or</span>
              <div className="flex-1 h-[1px] bg-gray-200"></div>
            </div>

            {/* Google Login Button */}
            <button type="button" className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Create Account Link */}
            <p className="mt-8 text-center text-sm font-medium text-gray-500">
              New to JAL-SETU? <a href="#" className="text-[#115E41] font-semibold hover:underline">Create an account</a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Info (Absolute at bottom corners) */}
      <footer className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-white/90 z-10 pointer-events-none">
        <div className="flex items-center gap-2 drop-shadow-md">
          <Leaf size={14} className="text-white/80" />
          <span className="text-[10px] font-medium tracking-wide">People &nbsp;|&nbsp; Nature &nbsp;|&nbsp; Resilient Communities</span>
        </div>
        <div className="flex items-center gap-2 drop-shadow-md">
          <ShieldCheck size={14} className="text-white/80" />
          <span className="text-[10px] font-medium tracking-wide">Secure access &nbsp;·&nbsp; Field-ready platform</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
