import React, { useState } from 'react';
import { Lock, User, Eye, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLoginSuccess(username);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050811]/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0b0f1f] border border-cyan-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,240,255,0.2)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-extrabold mx-auto mb-4 shadow-[0_0_25px_rgba(0,240,255,0.4)]">
            <Eye size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-widest text-white">H-VISION</h2>
          <p className="text-xs font-mono text-cyan-400 mt-1">RESTRICTED SOC COMMAND PORTAL</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">
              Operator ID
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">
              Passcode
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>AUTHENTICATE & ENTER</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[10px] font-mono text-white/40">
            H-VISION DEFENSE ENGINE · RESTRICTED OPERATIONAL ACCESS
          </p>
        </div>
      </div>
    </div>
  );
};
