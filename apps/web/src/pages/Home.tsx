import React from 'react';
import { ArrowRight } from 'lucide-react';
import Logo from '../assets/Logo.png';
import BgImage from '../assets/bg.png';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col font-sans overflow-hidden">
      
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BgImage})` }}
      >
        {/* Subtle white overlay to improve overall text contrast */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigation Bar - Glassmorphism */}
        <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm transition-all duration-300">
          <div className="px-8 py-4 flex items-center justify-between max-w-[1440px] mx-auto w-full">
            {/* Logo Section */}
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={Logo} alt="Jal-Setu Logo" className="h-10 object-contain" />
              <div className="flex flex-col">
                <span className="font-bold text-[#111827] text-lg leading-tight tracking-tight">JAL-SETU</span>
                <span className="text-[11px] text-gray-700 font-medium">Spring Intelligence Platform</span>
              </div>
            </div>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-10">
              <div className="relative group cursor-pointer">
                <span className="text-sm font-semibold text-[#111827]">Home</span>
                <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#115E41] rounded-full"></div>
              </div>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-[#115E41] transition-colors">Platform</a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-[#115E41] transition-colors">Impact</a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-[#115E41] transition-colors">About</a>
            </nav>

            {/* Right Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-[#111827] transition-colors">Sign in</Link>
              <div className="w-[1px] h-6 bg-gray-400"></div>
              <Link to="/login" className="bg-[#115E41] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-md flex items-center gap-2 hover:bg-[#0e4b34] hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                Open Dashboard
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-16 pb-20 max-w-[1440px] mx-auto w-full">
          
          {/* Overline */}
          <div className="flex flex-col items-center mb-8 animate-fade-in-up">
            <div className="w-8 h-[2px] bg-[#115E41] mb-4"></div>
            <span className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-gray-800 uppercase drop-shadow-sm">
              Spring Intelligence for Resilient Communities
            </span>
          </div>

          {/* Hero Heading */}
          <h1 className="text-[3.5rem] md:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight text-[#111827] mb-6 drop-shadow-md">
            Healthy Springs.<br />
            <span className="text-[#115E41]">Stronger Tomorrows.</span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl text-gray-800 text-lg md:text-xl font-medium mb-12 leading-relaxed drop-shadow-sm">
            JAL-SETU helps identify, prioritise and plan spring revival interventions
            using geospatial data and field insights — for water secure tribal regions.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <a href="#" className="bg-[#115E41] text-white text-base font-semibold px-8 py-3.5 rounded-xl shadow-lg flex items-center gap-2 hover:bg-[#0e4b34] hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
              Explore the Platform
              <ArrowRight size={18} />
            </a>
            <a href="#" className="bg-white/80 backdrop-blur-sm text-[#111827] border border-white/50 shadow-md text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200">
              Learn More
            </a>
          </div>
        </main>

      </div>
    </div>
  );
};

export default Home;
