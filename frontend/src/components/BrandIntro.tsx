import React, { useState, useEffect } from 'react';
import { Shield, Eye, Zap, Swords, ArrowRight, Activity, Terminal, Radio } from 'lucide-react';
import heroBanner from '../assets/hvision-hero.jpg';

interface BrandIntroProps {
  onComplete: () => void;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({ onComplete }) => {
  // Stages: 
  // 1. 'eye_blink': Eye appears and executes robotic blink
  // 2. 'hero_reveal': Epic Red vs Blue hero banner appears with blinking LED strobes
  // 3. 'welcome': "WELCOME TO H-VISION" transmission broadcasts
  // 4. 'ready': Mission control launch button primed
  const [stage, setStage] = useState<'eye_blink' | 'hero_reveal' | 'welcome' | 'ready'>('eye_blink');
  const [isBlinkingLeft, setIsBlinkingLeft] = useState(true);
  const [isBlinkingRight, setIsBlinkingRight] = useState(false);

  useEffect(() => {
    // Stage 1 -> Stage 2: Eye blink finishes, reveal epic hero visual (at 1.8s)
    const t1 = setTimeout(() => setStage('hero_reveal'), 1800);
    // Stage 2 -> Stage 3: Welcome transmission broadcast (at 3.0s)
    const t2 = setTimeout(() => setStage('welcome'), 3000);
    // Stage 3 -> Stage 4: Enter Mission Control ready (at 4.2s)
    const t3 = setTimeout(() => setStage('ready'), 4200);

    // Alternating emergency LED strobe interval (Blue vs Red)
    const ledInterval = setInterval(() => {
      setIsBlinkingLeft(prev => !prev);
      setIsBlinkingRight(prev => !prev);
    }, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(ledInterval);
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

      {/* Dual Red & Blue Ambient Spotlights */}
      <div className={`absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[160px] pointer-events-none transition-opacity duration-300 ${isBlinkingLeft ? 'opacity-100' : 'opacity-40'}`} />
      <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-[160px] pointer-events-none transition-opacity duration-300 ${isBlinkingRight ? 'opacity-100' : 'opacity-40'}`} />

      {/* ═══════════════ PHASE 1: CYBERNETIC EYE BLINK ═══════════════ */}
      {stage === 'eye_blink' && (
        <div className="relative z-10 flex flex-col items-center text-center px-4 animate-fade-in">
          {/* Cybernetic Aperture Eye */}
          <div className="relative mb-6">
            <svg width="120" height="80" viewBox="0 0 110 70" className="overflow-visible">
              <defs>
                <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ef4444" />
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
                style={{ animationDuration: '4s' }}
              />

              {/* Glowing Iris / Pupil */}
              <circle
                cx="55"
                cy="35"
                r="3"
                fill="#00f0ff"
                className="shadow-[0_0_20px_#00f0ff] animate-ping"
              />

              {/* Eye Blink Eyelid Animation */}
              <path
                d="M 5 35 Q 55 35 105 35 Q 55 35 5 35 Z"
                stroke="#38bdf8"
                strokeWidth="7"
                fill="#050811"
                className="animate-pulse"
              />
            </svg>

            {/* Horizontal Laser Scanning Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-[0.3em] text-white flex items-center justify-center gap-2">
            <span className="text-cyan-400 drop-shadow-[0_0_20px_#00f0ff] animate-pulse">H</span>
            <span className="text-white/40 font-light">-</span>
            <span className="text-red-500 drop-shadow-[0_0_20px_#ef4444] animate-pulse">V</span>
            <span className="text-white">ISION</span>
          </h1>
          <p className="text-xs font-mono tracking-[0.4em] text-cyan-300 uppercase mt-3 animate-pulse">
            INITIALIZING NEURAL DEFENSE SENSORS...
          </p>
        </div>
      )}

      {/* ═══════════════ PHASE 2, 3 & 4: HERO BANNER + RED/BLUE LEDS + WELCOME ═══════════════ */}
      {stage !== 'eye_blink' && (
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl w-full transition-all duration-700 animate-in fade-in zoom-in-95">
          
          {/* Dual LED Beacon Status Bar */}
          <div className="w-full max-w-3xl flex items-center justify-between mb-3 px-2">
            {/* Blue LED Beacon (Left - Blue Team) */}
            <div className="flex items-center gap-2.5 bg-cyan-950/60 border border-cyan-500/40 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 ${isBlinkingLeft ? 'inline-block' : 'hidden'}`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isBlinkingLeft ? 'bg-cyan-400 shadow-[0_0_12px_#00f0ff]' : 'bg-cyan-900'}`} />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
                BLUE TEAM: DEFEND & MONITOR
              </span>
            </div>

            {/* Central Heartbeat */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-white/40">
              <Activity size={12} className="text-emerald-400 animate-pulse" />
              <span>CORE SYNC 100%</span>
            </div>

            {/* Red LED Beacon (Right - Red Team) */}
            <div className="flex items-center gap-2.5 bg-red-950/60 border border-red-500/40 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-300 uppercase">
                RED TEAM: SIMULATE & ATTACK
              </span>
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 ${isBlinkingRight ? 'inline-block' : 'hidden'}`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isBlinkingRight ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : 'bg-red-900'}`} />
              </span>
            </div>
          </div>

          {/* Hero Banner Container with Dual Glowing Neons */}
          <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(0,240,255,0.25)] group">
            {/* Left Blue Strobe Edge */}
            <div className={`absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-cyan-500/30 to-transparent pointer-events-none transition-opacity duration-300 ${isBlinkingLeft ? 'opacity-100' : 'opacity-20'}`} />
            
            {/* Right Red Strobe Edge */}
            <div className={`absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-600/30 to-transparent pointer-events-none transition-opacity duration-300 ${isBlinkingRight ? 'opacity-100' : 'opacity-20'}`} />

            {/* Main Picture */}
            <img 
              src={heroBanner} 
              alt="H-VISION Autonomous Red vs Blue Multiagent SOC" 
              className="w-full h-auto object-cover max-h-[380px] filter brightness-105 contrast-110"
            />

            {/* Bottom Cyber Scanline Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Welcome Announcement Typography */}
          <div className={`mt-5 transition-all duration-700 ${stage === 'welcome' || stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <h2 className="text-3xl md:text-5xl font-black tracking-[0.2em] text-white flex items-center justify-center gap-2">
              <span>WELCOME TO</span>
              <span className="text-cyan-400 drop-shadow-[0_0_25px_#00f0ff]">H</span>
              <span className="text-white/40">-</span>
              <span className="text-red-500 drop-shadow-[0_0_25px_#ef4444]">VISION</span>
            </h2>
            
            <p className="text-xs md:text-sm font-mono tracking-[0.35em] text-cyan-300/90 uppercase mt-2">
              AUTONOMOUS MULTIAGENT SOC · POWERED BY JANUS SENTINEL
            </p>
            
            <p className="text-[11px] font-mono text-white/50 tracking-wider mt-1">
              DETECT · ANALYZE · RESPOND · PREVENT
            </p>
          </div>

          {/* Action Button: Tab Switch / Enter Mission Control */}
          <div className={`mt-7 transition-all duration-500 ${stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={onComplete}
              className="group relative inline-flex items-center gap-3 px-10 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-red-600 hover:from-cyan-400 hover:via-blue-500 hover:to-red-500 rounded-xl text-black font-extrabold font-mono text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95"
            >
              <span>ENTER SOC MISSION CONTROL</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      )}

      {/* Footer Core Telemetry Bar */}
      <div className="absolute bottom-4 flex items-center gap-6 text-[10px] font-mono text-white/30">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> SENTINEL-V2.4</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> MULTI-AGENT SWARM ACTIVE</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> ADVERSARIAL HARDENING ARMED</span>
      </div>
    </div>
  );
};
