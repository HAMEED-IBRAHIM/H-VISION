import React, { useState } from 'react';
import {
  Shield, AlertTriangle, Bug, ShieldCheck, Box, Flame, ArrowUpRight,
  TrendingUp, BarChart2, Activity, Globe, Server, CheckCircle2,
  Play, FileText, Lock, Code, ChevronRight, Search, Check, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

interface ExecutiveDashboardProps {
  findings: any[];
  onNavigate: (tabId: string) => void;
  onLaunchScan: () => void;
  isScanning: boolean;
  complianceScore?: number;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  findings = [],
  onNavigate,
  onLaunchScan,
  isScanning,
  complianceScore = 97.5
}) => {
  const [timeRange, setTimeRange] = useState('Last 24 Hours');

  // Multi-series analytics dataset matching the reference dashboard
  const analyticsData = [
    { time: '12AM', incidents: 20, findings: 30, blocked: 45 },
    { time: '2AM',  incidents: 28, findings: 35, blocked: 52 },
    { time: '4AM',  incidents: 15, findings: 22, blocked: 60 },
    { time: '6AM',  incidents: 35, findings: 45, blocked: 78 },
    { time: '8AM',  incidents: 45, findings: 70, blocked: 85 },
    { time: '10AM', incidents: 30, findings: 80, blocked: 95 },
    { time: '12PM', incidents: 60, findings: 65, blocked: 80 },
    { time: '2PM',  incidents: 48, findings: 50, blocked: 75 },
    { time: '4PM',  incidents: 55, findings: 60, blocked: 82 },
    { time: '6PM',  incidents: 42, findings: 48, blocked: 88 },
  ];

  // Dynamic incident counts
  const incidentCount = 12 + (findings.filter(f => f.severity === 'Critical').length);
  const vulnCount = findings.length > 0 ? findings.length : 28;
  const pendingPatchesCount = Math.max(4, Math.floor(vulnCount / 4));

  return (
    <div className="space-y-6 text-[#e2e8f0]">
      
      {/* ═══════════════ 1. HERO WELCOME BANNER ═══════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1838] via-[#0c1633] to-[#071126] border border-[#1b2c58] p-7 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        {/* Ambient cyan glow */}
        <div className="absolute -left-10 -top-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#11234d] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.25)] shrink-0">
              <ShieldCheck size={36} className="text-cyan-400 drop-shadow-[0_0_10px_#00f0ff]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Welcome to H-VISION
              </h1>
              <p className="text-xs md:text-sm text-[#8fa3cf] mt-1 font-medium">
                Continuous Monitoring. Proactive Defense. Self-Healing.
              </p>
            </div>
          </div>

          {/* Right Holographic Cyber Globe Graphic */}
          <div className="relative w-72 h-28 hidden md:flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 300 120" className="w-full h-full opacity-90">
              <defs>
                <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#1d4ed8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="150" cy="60" rx="100" ry="45" fill="url(#globeGlow)" />
              {/* Longitude / latitude orbits */}
              <ellipse cx="150" cy="60" rx="90" ry="40" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" className="animate-pulse" />
              <ellipse cx="150" cy="60" rx="70" ry="30" fill="none" stroke="#3b82f6" strokeWidth="0.7" opacity="0.5" />
              <ellipse cx="150" cy="60" rx="45" ry="20" fill="none" stroke="#60a5fa" strokeWidth="0.6" opacity="0.4" />
              <line x1="50" y1="60" x2="250" y2="60" stroke="#00f0ff" strokeWidth="0.6" strokeDasharray="4 2" opacity="0.4" />
              {/* Connected node points */}
              {[[110, 48], [140, 35], [175, 42], [200, 58], [165, 75], [130, 80], [90, 65], [150, 60]].map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="2.5" fill="#00f0ff" className="animate-ping" style={{ animationDuration: `${2 + i * 0.4}s` }} />
                  <circle cx={x} cy={y} r="2" fill="#ffffff" />
                </g>
              ))}
              {/* Interconnecting laser links */}
              <line x1="110" y1="48" x2="140" y2="35" stroke="#00f0ff" strokeWidth="0.8" opacity="0.6" />
              <line x1="140" y1="35" x2="175" y2="42" stroke="#00f0ff" strokeWidth="0.8" opacity="0.6" />
              <line x1="175" y1="42" x2="200" y2="58" stroke="#00f0ff" strokeWidth="0.8" opacity="0.6" />
              <line x1="175" y1="42" x2="150" y2="60" stroke="#38bdf8" strokeWidth="0.7" opacity="0.5" />
              <line x1="150" y1="60" x2="130" y2="80" stroke="#38bdf8" strokeWidth="0.7" opacity="0.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* ═══════════════ 2. TOP 4 KPI METRIC CARDS ═══════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Security Incidents */}
        <div 
          onClick={() => onNavigate('findings')}
          className="rounded-2xl bg-[#0b142e] border border-[#17254e] hover:border-red-500/40 p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)] group"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <Flame size={20} className="text-red-400" />
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-red-400 flex items-center justify-end gap-0.5">
                <ArrowUpRight size={13} /> +20%
              </span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-white leading-none">{incidentCount}</h3>
            <p className="text-xs text-[#8fa3cf] mt-1 font-medium">Security Incidents</p>
          </div>
          {/* Smooth Red Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
              <path d="M 0 18 Q 20 8 35 15 T 65 5 T 100 12" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Vulnerabilities */}
        <div 
          onClick={() => onNavigate('scanner')}
          className="rounded-2xl bg-[#0b142e] border border-[#17254e] hover:border-cyan-500/40 p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] group"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Bug size={20} className="text-cyan-400" />
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center justify-end gap-0.5">
                <ArrowUpRight size={13} /> +12%
              </span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-white leading-none">{vulnCount}</h3>
            <p className="text-xs text-[#8fa3cf] mt-1 font-medium">Vulnerabilities</p>
          </div>
          {/* Smooth Cyan Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
              <path d="M 0 15 Q 25 22 45 10 T 80 18 T 100 8" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Protection Rate */}
        <div 
          onClick={() => onNavigate('compliance')}
          className="rounded-2xl bg-[#0b142e] border border-[#17254e] hover:border-emerald-500/40 p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] group"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-end gap-0.5">
                <ArrowUpRight size={13} /> +0.5%
              </span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-white leading-none">{complianceScore}%</h3>
            <p className="text-xs text-[#8fa3cf] mt-1 font-medium">Protection Rate</p>
          </div>
          {/* Smooth Emerald Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
              <path d="M 0 20 Q 20 18 40 8 T 70 14 T 100 5" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Pending Patches */}
        <div 
          onClick={() => onNavigate('patches')}
          className="rounded-2xl bg-[#0b142e] border border-[#17254e] hover:border-purple-500/40 p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] group"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Box size={20} className="text-purple-400" />
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-purple-400 flex items-center justify-end gap-0.5">
                <ArrowUpRight size={13} /> +1.6%
              </span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-extrabold text-white leading-none">{pendingPatchesCount}</h3>
            <p className="text-xs text-[#8fa3cf] mt-1 font-medium">Pending Patches</p>
          </div>
          {/* Smooth Purple Sparkline */}
          <div className="mt-3 h-8 w-full">
            <svg viewBox="0 0 100 25" className="w-full h-full overflow-visible">
              <path d="M 0 16 Q 30 8 50 18 T 80 6 T 100 12" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* ═══════════════ 3. MIDDLE SECTION (ANALYTICS & ATTACK TOPOLOGY) ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Security Analytics Multi-Line Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0b142e] border border-[#17254e] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <BarChart2 size={18} className="text-cyan-400" />
              <h2 className="text-base font-bold text-white">Security Analytics</h2>
            </div>
            
            {/* Filter and Legend */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Incidents
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Findings
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Blocked Attacks
                </span>
              </div>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-[#111e42] border border-[#1e3266] text-[#c0cef5] text-xs rounded-lg px-2.5 py-1 outline-none"
              >
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Recharts Multi-Line Spline Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#17254e" />
                <XAxis dataKey="time" stroke="#60749e" fontSize={11} tickLine={false} />
                <YAxis stroke="#60749e" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#070d1e', 
                    borderColor: '#1e3266', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="findings" stroke="#00f0ff" strokeWidth={2.5} dot={{ r: 4, fill: '#00f0ff' }} />
                <Line type="monotone" dataKey="blocked" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (5 cols): Attack Topology Visual Flow */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0b142e] border border-[#17254e] p-6 shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-cyan-400" />
              <h2 className="text-base font-bold text-white">Attack Topology</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <CheckCircle2 size={12} /> Protected
            </div>
          </div>

          <p className="text-xs text-[#8fa3cf]">
            Live perimeter attack path monitoring through the Janus WAF gateway.
          </p>

          {/* Interactive Flow Nodes matching the image */}
          <div className="py-8 px-2 flex items-center justify-between relative">
            
            {/* 1. Attacker Node */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <Flame size={24} />
              </div>
              <span className="text-xs font-semibold text-white">Attacker</span>
            </div>

            {/* Connecting Arrow 1 */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="h-[2px] w-full bg-gradient-to-r from-red-500 to-cyan-500" />
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute" />
            </div>

            {/* 2. Internet Node */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#11234d] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                <Globe size={24} />
              </div>
              <span className="text-xs font-semibold text-white">Internet</span>
            </div>

            {/* Connecting Arrow 2 */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 to-blue-600" />
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping absolute" />
            </div>

            {/* 3. WAF Node */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-950/70 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Shield size={24} />
              </div>
              <span className="text-xs font-semibold text-white">WAF</span>
            </div>

            {/* Connecting Arrow 3 */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="h-[2px] w-full bg-gradient-to-r from-blue-600 to-emerald-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
            </div>

            {/* 4. Target Application Node */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Server size={24} />
              </div>
              <span className="text-xs font-semibold text-white text-center leading-tight">Target App</span>
            </div>

          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[#768bb8] pt-2 border-t border-[#17254e]">
            <span>GATEWAY: CORAZA / MODSEC</span>
            <span className="text-emerald-400">LATENCY: 4MS</span>
          </div>
        </div>

      </div>

      {/* ═══════════════ 4. BOTTOM 3 COLUMNS SECTION ═══════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Recent Incidents Card */}
        <div className="rounded-2xl bg-[#0b142e] border border-[#17254e] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={17} className="text-red-400" />
              <h3 className="text-sm font-bold text-white">Recent Incidents</h3>
            </div>
            <button 
              onClick={() => onNavigate('findings')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Incidents Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#17254e] text-[#6e82ad]">
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17254e]/50">
                <tr>
                  <td className="py-2.5 font-mono text-[#8fa3cf]">14:20</td>
                  <td className="py-2.5 font-medium text-white">SQL Injection</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-red-950/70 border border-red-500/40 text-red-400 text-[10px] font-bold">
                      High
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                      Investigating
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[#8fa3cf]">13:47</td>
                  <td className="py-2.5 font-medium text-white">XSS Attack</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-yellow-950/70 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold">
                      Medium
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                      Resolved
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-mono text-[#8fa3cf]">12:55</td>
                  <td className="py-2.5 font-medium text-white">Brute Force</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-yellow-950/70 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold">
                      Medium
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                      Resolved
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: AI Agents Status Card */}
        <div className="rounded-2xl bg-[#0b142e] border border-[#17254e] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={17} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">AI Agents Status</h3>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Red Team Agent', role: 'Offensive Simulation' },
              { name: 'Blue Team Agent', role: 'Defensive Triage' },
              { name: 'RAG Engine', role: 'ChromaDB Knowledge' },
              { name: 'Security Responder', role: 'Autonomous WAF Rules' },
            ].map((agent, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#111c3d] border border-[#1b2b54]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{agent.name}</p>
                    <p className="text-[10px] text-[#7186b5]">{agent.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Quick Actions Card */}
        <div className="rounded-2xl bg-[#0b142e] border border-[#17254e] p-5 shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={17} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Quick Actions</h3>
          </div>

          <div className="space-y-2.5">
            {/* Action 1: Run Simulation (Red) */}
            <button
              onClick={onLaunchScan}
              disabled={isScanning}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#be123c] hover:from-[#f43f5e] hover:to-[#e11d48] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center justify-between disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Play size={14} className={isScanning ? 'animate-spin' : ''} />
                <span>{isScanning ? 'Simulation Running...' : 'Run Security Simulation'}</span>
              </div>
              <ChevronRight size={14} />
            </button>

            {/* Action 2: View Reports (Blue) */}
            <button
              onClick={() => onNavigate('reports')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(2,132,199,0.3)] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FileText size={14} />
                <span>View Reports</span>
              </div>
              <ChevronRight size={14} />
            </button>

            {/* Action 3: Deploy WAF Rules (Green) */}
            <button
              onClick={() => onNavigate('hardening')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#10b981] hover:to-[#059669] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(5,150,105,0.3)] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span>Deploy WAF Rules (Hardening)</span>
              </div>
              <ChevronRight size={14} />
            </button>

            {/* Action 4: Apply Patch (Purple) */}
            <button
              onClick={() => onNavigate('patches')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Code size={14} />
                <span>Apply Patch</span>
              </div>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
