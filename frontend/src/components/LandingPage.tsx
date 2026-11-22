import React from 'react';
import {
  Shield, Cpu, Swords, Lock, Terminal, BarChart2, CheckCircle,
  Zap, ArrowRight, Layers, Globe, Eye
} from 'lucide-react';
import heroBanner from '../assets/hvision-hero.jpg';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#050811] text-[#e6edf3] font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <nav className="border-b border-white/10 bg-[#0b0f1f]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-extrabold shadow-[0_0_20px_rgba(0,240,255,0.4)]">
            <Eye size={18} />
          </div>
          <div>
            <h1 className="font-extrabold tracking-widest text-white text-base leading-none">H-VISION</h1>
            <p className="text-[9px] font-mono text-cyan-400 tracking-wider">AUTONOMOUS CYBER DEFENSE</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-xs font-mono text-white/50">
            ENTERPRISE SOC EDITION
          </span>
          <button
            onClick={onEnter}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105"
          >
            <span>Launch Console</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>PHASE 2: ADVERSARIAL HARDENING ACTIVE</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Next-Generation Autonomous <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Red vs. Blue Cyber Defense Platform
          </span>
        </h1>

        <p className="text-base md:text-lg text-white/60 max-w-3xl mx-auto mb-8 leading-relaxed">
          H-VISION combines real-time offensive Red Team attack simulation with an autonomous Blue Team AI Swarm
          to automatically discover vulnerabilities, write WAF rules, stress-test them with adversarial mutations,
          and deploy self-healing security patches.
        </p>

        {/* Hero Visual Card */}
        <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(0,240,255,0.25)] mb-10 group">
          <img 
            src={heroBanner} 
            alt="H-VISION Autonomous Red vs Blue Multiagent SOC" 
            className="w-full h-auto object-cover max-h-[380px] filter brightness-105 contrast-105"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onEnter}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:scale-105"
          >
            <span>ENTER MISSION CONTROL</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 4 Core Pillars Grid */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-center text-white/40 uppercase tracking-widest font-mono mb-12">
          Architecture & Autonomous Capabilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6 hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Swords size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Autonomous Red Team</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Real-time attack engine firing SQLi, XSS, Path Traversal, and Brute Force against targets to discover real zero-day vulnerabilities.
            </p>
          </div>

          <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Groq AI Multi-Agent</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Specialized LLM agent swarm: @ThreatHunter for MITRE ATT&CK, @Responder for regex WAF generation, and @Commander for executive triage.
            </p>
          </div>

          <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6 hover:border-red-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <Shield size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Adversarial Hardening</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              5-round mutation engine that bombards candidate WAF rules with 80+ variants, enforcing a 0% False Positive gate before human approval.
            </p>
          </div>

          <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Lock size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">SOAR & Deception</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Automated response playbooks, honeytoken canary traps, and instant compliance alignment across ISO 27001, SOC 2, and NIST.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6 text-center bg-[#070b16]">
        <p className="text-xs font-mono text-white/40">
          H-VISION AUTONOMOUS DEFENSIVE SECURITY PLATFORM · ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
};
