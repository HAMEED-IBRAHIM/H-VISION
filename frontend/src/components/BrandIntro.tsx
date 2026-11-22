import React, { useState, useEffect } from 'react';
import { Shield, Eye, Zap, Terminal, ArrowRight, Lock } from 'lucide-react';

interface BrandIntroProps {
  onComplete: () => void;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'flicker' | 'eye_blink' | 'reveal' | 'ready'>('flicker');

  useEffect(() => {
    // Stage 1: Initial neon flicker
    const t1 = setTimeout(() => setStage('eye_blink'), 1200);
    // Stage 2: Eye blink animation over H and V
    const t2 = setTimeout(() => setStage('reveal'), 2800);
    // Stage 3: Full title reveal & prompt
    const t3 = setTimeout(() => setStage('ready'), 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#050811] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Background Cyber Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Radial Glow */}
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Animation Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        
        {/* Animated Cybernetic Eye */}
        <div className="relative mb-6">
          <div className={`transition-all duration-700 ${stage === 'flicker' ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}`}>
            <svg width="110" height="70" viewBox="0 0 110 70" className="overflow-visible">
              <defs>
                <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Eye Outer Contour */}
              <path
                d="M 5 35 Q 55 -5 105 35 Q 55 75 5 35 Z"
                fill="none"
                stroke="url(#cyberGlow)"
                strokeWidth="2.5"
                filter="url(#neonBlur)"
                className="transition-all duration-500"
              />

              {/* Inner Aperture Ring */}
              <circle
                cx="55"
                cy="35"
                r="18"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                className="animate-spin"
                style={{ animationDuration: '8s' }}
              />

              {/* Glowing Iris / Pupil */}
              <circle
                cx="55"
                cy="35"
                r={stage === 'eye_blink' ? "2" : "9"}
                fill="#00f0ff"
                className="transition-all duration-300 shadow-[0_0_20px_#00f0ff]"
              />

              {/* Eye Blink Lids (Animation) */}
              {stage === 'eye_blink' && (
                <path
                  d="M 5 35 Q 55 35 105 35 Q 55 35 5 35 Z"
                  stroke="#38bdf8"
                  strokeWidth="6"
                  fill="#050811"
                  className="animate-pulse"
                />
              )}
            </svg>
          </div>
          
          {/* Scanning Line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
        </div>

        {/* Brand Name Typography with Neon Flicker */}
        <div className="relative">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-[0.25em] text-white flex items-center justify-center gap-3">
            <span className={`inline-block transition-all duration-300 ${
              stage === 'flicker' ? 'animate-pulse text-cyan-400 drop-shadow-[0_0_15px_#00f0ff]' : 'text-cyan-400 drop-shadow-[0_0_25px_#00f0ff]'
            }`}>
              H
            </span>
            <span className="text-white/40 font-light">-</span>
            <span className={`inline-block transition-all duration-300 ${
              stage === 'flicker' ? 'animate-pulse text-violet-400 drop-shadow-[0_0_15px_#a855f7]' : 'text-violet-400 drop-shadow-[0_0_25px_#a855f7]'
            }`}>
              V
            </span>
            <span className="text-white">I</span>
            <span className="text-white">S</span>
            <span className="text-white">I</span>
            <span className="text-white">O</span>
            <span className="text-white">N</span>
          </h1>

          {/* Subtitle with Tech reveal */}
          <div className={`mt-3 transition-all duration-700 ${stage === 'ready' || stage === 'reveal' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <p className="text-xs md:text-sm tracking-[0.35em] text-cyan-300/80 uppercase font-mono">
              Autonomous Defensive Security Platform
            </p>
            <div className="flex items-center justify-center gap-2 mt-2 text-[11px] text-white/40 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>FOUNDED & DEVELOPED BY <strong className="text-white/80">MR HAMEED IBRAHIM A.</strong></span>
            </div>
          </div>
        </div>

        {/* Enter Mission Control Button */}
        <div className={`mt-10 transition-all duration-500 ${stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={onComplete}
            className="group relative inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 hover:border-cyan-300 rounded-xl text-cyan-300 hover:text-white font-mono text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95"
          >
            <span>INITIALIZE MISSION CONTROL</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* Footer System Status */}
      <div className="absolute bottom-6 flex items-center gap-6 text-[10px] font-mono text-white/30">
        <span>CORE: SENTINEL-V2.4</span>
        <span>AGENT SWARM: ACTIVE</span>
        <span>ADVERSARIAL HARDENING: READY</span>
      </div>
    </div>
  );
};
