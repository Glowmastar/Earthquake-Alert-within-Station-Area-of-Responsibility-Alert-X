import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Landmark, CheckCircle2, Shield, Radio } from 'lucide-react';
import { UserProfile, PRECONFIGURED_USERS } from '../types';
import { LoginPhilippineMap } from '../components/LoginPhilippineMap';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('palayanz@phivolcs.dost.gov.ph');
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [externalHoverAor, setExternalHoverAor] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showToast('Please enter your email address.');
      return;
    }

    if (!password) {
      showToast('Please enter your password.');
      return;
    }

    // Cagayan Seismic Station Account validation
    if (
      cleanEmail === 'cagayanseismicstation@phivolcs.gov.ph' ||
      cleanEmail === 'cagayanseismicstation@phivolcs.dost.gov.ph'
    ) {
      if (password !== 'cagayanss12345') {
        showToast('Invalid password for Cagayan Seismic Station account. Expected: cagayanss12345');
        return;
      }
      showToast('Authenticating Cagayan Seismic Station (User Role • CGP AOR)...');
      setTimeout(() => {
        onLogin(
          PRECONFIGURED_USERS[cleanEmail] ||
          PRECONFIGURED_USERS['cagayanseismicstation@phivolcs.gov.ph']
        );
      }, 400);
      return;
    }

    // Palayan Seismic Station Account validation
    if (cleanEmail === 'palayanz@phivolcs.dost.gov.ph') {
      if (password !== '12345') {
        showToast('Invalid password for Palayan Seismic Station account. Expected: 12345');
        return;
      }
      showToast('Authenticating Palayan Seismic Station (User Role • PCP AOR)...');
      setTimeout(() => {
        onLogin(PRECONFIGURED_USERS['palayanz@phivolcs.dost.gov.ph']);
      }, 400);
      return;
    }

    // Administrator Global Account validation
    if (cleanEmail === 'j.delacruz@phivolcs.dost.gov.ph') {
      showToast('Authenticating PHIVOLCS Central Administrator...');
      setTimeout(() => {
        onLogin(PRECONFIGURED_USERS['j.delacruz@phivolcs.dost.gov.ph']);
      }, 400);
      return;
    }

    // Generic fallback for any other PHIVOLCS email
    const isPcp = cleanEmail.includes('palayan');
    const isCgp = cleanEmail.includes('cagayan');
    const userProfile: UserProfile = isCgp
      ? PRECONFIGURED_USERS['cagayanseismicstation@phivolcs.gov.ph']
      : isPcp
      ? PRECONFIGURED_USERS['palayanz@phivolcs.dost.gov.ph']
      : {
          id: `user-${Date.now()}`,
          username: cleanEmail,
          email: cleanEmail,
          name: cleanEmail.split('@')[0].toUpperCase(),
          role: 'User',
          assignedAor: 'CGP',
          stationName: 'CGP - Cagayan Seismic Station',
        };

    showToast(`Authenticated as ${userProfile.name} (${userProfile.role})`);
    setTimeout(() => {
      onLogin(userProfile);
    }, 400);
  };

  const handleQuickSelectAccount = (accountKey: 'cagayan' | 'palayan' | 'admin') => {
    if (accountKey === 'cagayan') {
      setEmail('cagayanseismicstation@phivolcs.gov.ph');
      setPassword('cagayanss12345');
      showToast('Populated credentials for Cagayan Seismic Station account (CGP AOR).');
    } else if (accountKey === 'palayan') {
      setEmail('palayanz@phivolcs.dost.gov.ph');
      setPassword('12345');
      showToast('Populated credentials for Palayan Seismic Station account (PCP AOR).');
    } else {
      setEmail('j.delacruz@phivolcs.dost.gov.ph');
      setPassword('12345');
      showToast('Populated credentials for Central Administrator account (Global Scope).');
    }
  };

  const handlePhivolcsLogin = () => {
    showToast('Connecting to Palayan Seismic Station portal via DOST SSO...');
    setTimeout(() => {
      onLogin(PRECONFIGURED_USERS['palayanz@phivolcs.dost.gov.ph']);
    }, 400);
  };

  const handleForgotPassword = () => {
    showToast('Password reset instructions sent to registered station administrator.');
  };

  return (
    <div className="min-h-screen w-full bg-[#020719] relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 z-50 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Coastal Sunset Seascape Photo Background on Left (Matching Target GUI Screenshot) */}
      <div
        className="absolute inset-y-0 left-0 w-full lg:w-3/5 pointer-events-none opacity-55 mix-blend-screen bg-cover bg-left-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/assets/philippine-sunset.jpg)',
          maskImage:
            'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 85%)',
          WebkitMaskImage:
            'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0) 85%)',
        }}
      />

      {/* Layered Glowing Blue Organic Seismic Waves Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial ambient glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] bg-cyan-600/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] bg-blue-700/20 blur-[140px] rounded-full pointer-events-none" />

        {/* Silky glowing wavy ribbons SVG (matching screenshot) */}
        <svg
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient 1: Deep Cyan-Blue Glowing Wave */}
            <linearGradient id="waveGrad1" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#0066ff" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#00c8ff" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#0055ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00c8ff" stopOpacity="0.3" />
            </linearGradient>

            {/* Gradient 2: Bright Luminous Highlight Ribbon */}
            <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d8ff" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#0077ff" stopOpacity="0.4" />
              <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </linearGradient>

            {/* Gradient 3: Soft ambient bottom fill */}
            <linearGradient id="waveGrad3" x1="20%" y1="100%" x2="80%" y2="0%">
              <stop offset="0%" stopColor="#02143d" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#05246a" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#02081c" stopOpacity="0" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Soft Wave Formations */}
          <path
            d="M-100,750 C250,550 500,850 850,620 C1200,390 1350,700 1600,650 L1600,950 L-100,950 Z"
            fill="url(#waveGrad3)"
          />

          {/* Broad glowing primary ribbon */}
          <path
            d="M-80,820 C150,580 420,840 760,630 C1100,420 1280,680 1550,600 C1450,750 1150,880 820,760 C480,640 220,890 -80,820 Z"
            fill="url(#waveGrad1)"
            filter="url(#glow)"
            opacity="0.7"
          />

          {/* Sharp glowing top crest edge */}
          <path
            d="M-50,800 C200,560 460,820 800,610 C1140,400 1320,660 1520,590"
            stroke="url(#waveGrad2)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#glow)"
            opacity="0.9"
          />

          {/* Complementary subtle undulating wave line */}
          <path
            d="M-50,650 C250,800 550,550 900,750 C1250,950 1380,620 1550,700"
            stroke="#00e5ff"
            strokeWidth="2"
            strokeDasharray="6 8"
            opacity="0.35"
          />
        </svg>
      </div>

      {/* DOST-PHIVOLCS Official Agency Logo on Upper Left Side */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-8 lg:top-8 lg:left-10 z-30 flex items-center gap-3 bg-[#02091c]/85 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl transition-all duration-300 pointer-events-auto hover:border-cyan-500/60 group">
        <img
          src="/assets/phivolcs-logo.svg"
          alt="DOST-PHIVOLCS Official Seal"
          className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 drop-shadow-[0_0_12px_rgba(0,174,239,0.5)] transition-transform duration-300 group-hover:scale-105"
        />
        <div className="flex flex-col text-left">
          <div className="text-sm sm:text-base font-black tracking-wider text-white leading-tight">
            DOST-PHIVOLCS
          </div>
          <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-200 leading-tight mt-0.5">
            Philippine Institute of
            <br />
            Volcanology and Seismology
          </div>
          <div className="text-[7.5px] sm:text-[8px] font-medium text-cyan-300/90 leading-tight mt-1">
            OneDOST4U: Solutions and Opportunities for All
          </div>
        </div>
      </div>

      {/* Dark Blue Philippine Map on Right Side with Interactive Hover Inspection & 1-sec Random AOR Selection */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[54%] lg:w-[58%] xl:w-[60%] flex items-center justify-center pointer-events-auto opacity-90 md:opacity-100 z-20 transition-opacity duration-500 overflow-hidden">
        <LoginPhilippineMap
          externalHoverCode={externalHoverAor}
          onSelectStation={(code) => {
            if (code === 'CGP') {
              handleQuickSelectAccount('cagayan');
            } else if (code === 'PCP') {
              handleQuickSelectAccount('palayan');
            } else {
              showToast(`Inspecting Station AOR: ${code}`);
            }
          }}
        />
      </div>

      {/* Main Content Container - pointer-events-none so mouse freely hovers over the Philippine map on the right */}
      <div className="relative z-30 w-full max-w-7xl mx-auto flex items-center justify-between min-h-[90vh] px-4 sm:px-6 lg:px-12 py-6 pointer-events-none">
        <div className="w-full max-w-md flex flex-col items-center mx-auto md:mx-0 md:ml-4 lg:ml-8 xl:ml-16 shrink-0 pointer-events-auto">
          {/* Top Logo & Slogan Header (matching screenshot) */}
          <div className="flex flex-col items-center mb-7 text-center">
            {/* Waveform Pulse Icon and ALERT X text in one line */}
            <div className="flex items-center gap-2.5">
              {/* Cyan Seismic Waveform Icon */}
              <svg
                className="w-12 h-12 text-cyan-400 shrink-0 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                viewBox="0 0 48 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 18H10L14 7L20 31L26 3L32 25L36 18H46"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* ALERT X Title */}
              <div className="flex items-center tracking-tight font-black text-3xl sm:text-4xl">
                <span className="text-white">ALERT</span>
                <span className="text-blue-500 ml-1.5">X</span>
              </div>
            </div>

            {/* Slogan */}
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] text-cyan-400 mt-2 uppercase text-center max-w-xs sm:max-w-sm">
              Earthquake Alert within Station Area of Responsibility
            </div>
          </div>

        {/* White Card Container (matching screenshot) */}
        <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl w-full border border-white/60">
          {/* Card Heading */}
          <div className="text-center mb-5">
            <h1 className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Sign in to access Alert X Seismic Platform
            </p>
          </div>

          {/* Quick Account Switcher */}
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Quick Switch Account:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSelectAccount('cagayan')}
                onMouseEnter={() => setExternalHoverAor('CGP')}
                onMouseLeave={() => setExternalHoverAor(null)}
                className={`text-left p-2 rounded-lg border transition-all text-xs flex flex-col gap-0.5 cursor-pointer ${
                  email.includes('cagayanseismicstation')
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                  <span className="font-bold text-[11px] truncate">Cagayan Stn</span>
                </div>
                <span className="text-[9px] text-slate-500 truncate">User &bull; CGP AOR</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectAccount('palayan')}
                onMouseEnter={() => setExternalHoverAor('PCP')}
                onMouseLeave={() => setExternalHoverAor(null)}
                className={`text-left p-2 rounded-lg border transition-all text-xs flex flex-col gap-0.5 cursor-pointer ${
                  email === 'palayanz@phivolcs.dost.gov.ph'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-bold text-[11px] truncate">Palayan Stn</span>
                </div>
                <span className="text-[9px] text-slate-500 truncate">User &bull; PCP AOR</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectAccount('admin')}
                onMouseEnter={() => setExternalHoverAor(null)}
                className={`text-left p-2 rounded-lg border transition-all text-xs flex flex-col gap-0.5 cursor-pointer ${
                  email === 'j.delacruz@phivolcs.dost.gov.ph'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-bold text-[11px] truncate">Admin</span>
                </div>
                <span className="text-[9px] text-slate-500 truncate">Admin &bull; Global</span>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-lg border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all bg-white">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all bg-white">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] text-xs mt-1"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">or</span>
            </div>
          </div>

          {/* Secondary PHIVOLCS Button */}
          <button
            type="button"
            onClick={handlePhivolcsLogin}
            className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50/70 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs"
          >
            <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Sign in with PHIVOLCS Account</span>
          </button>

          {/* Security Note at bottom of card */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium mt-6 pt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Secure access for authorized personnel only</span>
          </div>
        </div>

        {/* Footer Subtext */}
        <p className="text-center text-xs text-slate-400 font-medium mt-6 tracking-wide">
          Alert X Earthquake Monitoring and Email Alert System
        </p>
        </div>
      </div>
    </div>
  );
};
