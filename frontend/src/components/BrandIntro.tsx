import React, { useState, useEffect } from 'react';
import { Shield, Eye, Zap, Swords, ArrowRight, Activity, Terminal, Radio, Sparkles, Layers, Cpu } from 'lucide-react';
import heroBanner from '../assets/hvision-hero.jpg';

interface BrandIntroProps {
  onComplete: () => void;
  onSkipToConsole?: () => void;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({ onComplete, onSkipToConsole }) => {
  const [stage, setStage] = useState<'eye_blink' | 'hero_reveal' | 'welcome' | 'ready'>('eye_blink');
  const [isBlinkingLeft, setIsBlinkingLeft] = useState(true);
  const [isBlinkingRight, setIsBlinkingRight] = useState(false);
  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    // Stage 1 -> 2: Eye blink completes, hero banner erupts with strobe
    const t1 = setTimeout(() => setStage('hero_reveal'), 1600);
    // Stage 2 -> 3: "WELCOME TO H-VISION" transmission with audio waves
    const t2 = setTimeout(() => setStage('welcome'), 2800);
    // Stage 3 -> 4: Navigation controls primed
    const t3 = setTimeout(() => setStage('ready'), 3800);

    // Dynamic dual LED flashing rhythm (Blue & Red strobes)
    const ledInterval = setInterval(() => {
      setIsBlinkingLeft(prev => !prev);
      setIsBlinkingRight(prev => !prev);
    }, 380);

    // Laser scanner line animation loop
    const scanInterval = setInterval(() => {
      setScanPos(prev => (prev >= 100 ? 0 : prev + 2));
    }, 40);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(ledInterval);
      clearInterval(scanInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#04060d] flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Dynamic Cyber Ambient Grids */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(239, 68, 68, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Pulsing Red & Blue Atmospheric Spotlights */}
      <div 
        className={`absolute -top-24 -left-24 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[160px] pointer-events-none transition-all duration-300 ${
          isBlinkingLeft ? 'opacity-100 scale-105' : 'opacity-40 scale-95'
        }`} 
      />
      <div 
        className={`absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[160px] pointer-events-none transition-all duration-300 ${
          isBlinkingRight ? 'opacity-100 scale-105' : 'opacity-40 scale-95'
        }`} 
      />

      {/* ═══════════════ PHASE 1: CYBERNETIC EYE BLINK ═══════════════ */}
      {stage === 'eye_blink' && (
        <div className="relative z-10 flex flex-col items-center text-center px-4 animate-in fade-in zoom-in-90 duration-500">
          <div className="relative mb-6">
            <svg width="130" height="90" viewBox="0 0 110 70" className="overflow-visible">
              <defs>
                <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Eye Outer Shield Arc */}
              <path
                d="M 5 35 Q 55 -8 105 35 Q 55 78 5 35 Z"
                fill="none"
                stroke="url(#cyberGlow)"
                strokeWidth="3"
                filter="url(#neonGlow)"
              />

              {/* Spinning Aperture Ring */}
              <circle
                cx="55"
                cy="35"
                r="19"
                fill="none"
                stroke="#00f0ff"
                strokeWidth="1.8"
                strokeDasharray="5 3"
                className="animate-spin"
                style={{ animationDuration: '3s' }}
              />

              {/* Glowing Inner Core */}
              <circle
                cx="55"
                cy="35"
                r="4"
                fill="#00f0ff"
                className="shadow-[0_0_25px_#00f0ff] animate-ping"
              />

              {/* Blinking Eyelid Shutter */}
              <path
                d="M 5 35 Q 55 35 105 35 Q 55 35 5 35 Z"
                stroke="#38bdf8"
                strokeWidth="8"
                fill="#04060d"
                className="animate-pulse"
              />
            </svg>

            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-[0.3em] text-white flex items-center justify-center gap-2">
            <span className="text-cyan-400 drop-shadow-[0_0_20px_#00f0ff]">H</span>
            <span className="text-white/30 font-light">-</span>
            <span className="text-red-500 drop-shadow-[0_0_20px_#ef4444]">V</span>
            <span className="text-white">ISION</span>
          </h1>
          <p className="text-xs font-mono tracking-[0.4em] text-cyan-300 uppercase mt-3 animate-pulse">
            INITIALIZING MULTIAGENT SECURITY GRID...
          </p>
        </div>
      )}

      {/* ═══════════════ PHASE 2, 3 & 4: DYNAMIC HERO BANNER & WELCOME ═══════════════ */}
      {stage !== 'eye_blink' && (
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl w-full transition-all duration-700 animate-in fade-in zoom-in-95">
          
          {/* Top Real-Time LED Telemetry Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-2">
            
            {/* Left Blue Team LED Module */}
            <div className="flex items-center gap-3 bg-[#0a1224]/80 backdrop-blur-md border border-cyan-500/40 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <div className="relative flex h-3.5 w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 ${isBlinkingLeft ? 'opacity-90' : 'opacity-0'}`} />
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 transition-all duration-200 ${
                  isBlinkingLeft ? 'bg-cyan-400 shadow-[0_0_16px_#00f0ff,0_0_30px_#00f0ff]' : 'bg-cyan-950 opacity-40'
                }`} />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-mono font-extrabold tracking-wider text-cyan-300 block leading-tight">
                  BLUE TEAM DEFENSE
                </span>
                <span className="text-[9px] font-mono text-cyan-400/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  DETECT · DEFEND · MONITOR
                </span>
              </div>
            </div>

            {/* Central Heartbeat / Agent Sync */}
            <div className="hidden md:flex items-center gap-2 bg-black/50 border border-white/10 px-3.5 py-1.5 rounded-full text-[10px] font-mono text-white/60">
              <Activity size={13} className="text-emerald-400 animate-pulse" />
              <span>SWARM STATUS: <strong className="text-emerald-400">OPTIMAL</strong></span>
            </div>

            {/* Right Red Team LED Module */}
            <div className="flex items-center gap-3 bg-[#1e0a12]/80 backdrop-blur-md border border-red-500/40 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.25)]">
              <div className="text-right">
                <span className="text-[11px] font-mono font-extrabold tracking-wider text-red-400 block leading-tight">
                  RED TEAM ADVERSARY
                </span>
                <span className="text-[9px] font-mono text-red-400/60 flex items-center justify-end gap-1">
                  SIMULATE · ATTACK · TEST
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                </span>
              </div>
              <div className="relative flex h-3.5 w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 ${isBlinkingRight ? 'opacity-90' : 'opacity-0'}`} />
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 transition-all duration-200 ${
                  isBlinkingRight ? 'bg-red-500 shadow-[0_0_16px_#ef4444,0_0_30px_#ef4444]' : 'bg-red-950 opacity-40'
                }`} />
              </div>
            </div>

          </div>

          {/* Interactive Hero Banner with Holographic Scanning Laser */}
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border-2 border-white/15 shadow-[0_0_60px_rgba(0,240,255,0.3)] group bg-black">
            
            {/* Blue Strobe Left Ambience */}
            <div 
              className={`absolute left-0 top-0 bottom-0 w-44 bg-gradient-to-r from-cyan-500/35 via-cyan-500/10 to-transparent pointer-events-none transition-opacity duration-300 ${
                isBlinkingLeft ? 'opacity-100' : 'opacity-20'
              }`} 
            />
            
            {/* Red Strobe Right Ambience */}
            <div 
              className={`absolute right-0 top-0 bottom-0 w-44 bg-gradient-to-l from-red-600/35 via-red-600/10 to-transparent pointer-events-none transition-opacity duration-300 ${
                isBlinkingRight ? 'opacity-100' : 'opacity-20'
              }`} 
            />

            {/* Real-Time Holographic Laser Scanner Line */}
            <div 
              className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-white to-red-500 pointer-events-none z-20 shadow-[0_0_15px_#00f0ff,0_0_15px_#ef4444]"
              style={{ top: `${scanPos}%`, transition: 'top 40ms linear' }}
            />

            {/* High-Impact Hero Banner Picture */}
            <img 
              src={heroBanner} 
              alt="H-VISION Autonomous Multiagent SOC" 
              className="w-full h-auto object-cover max-h-[390px] filter brightness-105 contrast-110 select-none pointer-events-none transition-transform duration-700 group-hover:scale-[1.01]"
            />

            {/* Vignette Shadow Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#04060d] via-transparent to-black/30 pointer-events-none" />
          </div>

          {/* Welcome Announcement Typography with Soundwave Bars */}
          <div className={`mt-5 transition-all duration-700 ${stage === 'welcome' || stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <h2 className="text-3xl md:text-5xl font-black tracking-[0.2em] text-white flex items-center justify-center gap-2">
              <span>WELCOME TO</span>
              <span className="text-cyan-400 drop-shadow-[0_0_30px_#00f0ff]">H</span>
              <span className="text-white/30">-</span>
              <span className="text-red-500 drop-shadow-[0_0_30px_#ef4444]">VISION</span>
            </h2>
            
            <p className="text-xs md:text-sm font-mono tracking-[0.35em] text-cyan-300/90 uppercase mt-2">
              AUTONOMOUS MULTIAGENT SOC · POWERED BY JANUS SENTINEL
            </p>

            {/* Audio Waveform Equalizer Visualizer */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {[40, 75, 55, 95, 60, 85, 45, 90, 70, 50, 80, 65, 95, 40].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    i < 7 ? (isBlinkingLeft ? 'bg-cyan-400 h-4' : 'bg-cyan-900 h-2') : (isBlinkingRight ? 'bg-red-500 h-4' : 'bg-red-950 h-2')
                  }`}
                  style={{ height: `${(h / 100) * 16}px` }}
                />
              ))}
            </div>

            <p className="text-[11px] font-mono text-white/50 tracking-wider mt-2">
              DETECT · ANALYZE · RESPOND · PREVENT
            </p>
          </div>

          {/* Action Navigation Buttons */}
          <div className={`mt-6 flex flex-wrap items-center justify-center gap-4 transition-all duration-500 ${
            stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {/* Primary Button: View Project Details & Capabilities Page */}
            <button
              onClick={onComplete}
              className="group relative inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl text-black font-extrabold font-mono text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-105 active:scale-95"
            >
              <span>EXPLORE PLATFORM ARCHITECTURE & CAPABILITIES</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary Button: Direct Tab Switch into Mission Control */}
            {onSkipToConsole && (
              <button
                onClick={onSkipToConsole}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-400 rounded-xl text-white/80 hover:text-white font-mono text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105"
              >
                <span>DIRECT TAB SWITCH (CONSOLE)</span>
                <Swords size={14} className="text-red-400" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* Persistent Bottom Telemetry Strip */}
      <div className="absolute bottom-3 flex items-center gap-6 text-[10px] font-mono text-white/30">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> CORE: SENTINEL-V2.4</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AGENT SWARM: ACTIVE</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> ADVERSARIAL HARDENING: ARMED</span>
      </div>
    </div>
  );
};
