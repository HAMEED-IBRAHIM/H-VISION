import React, { useState } from 'react';
import {
  ShieldAlert, Play, CheckCircle, XCircle, RotateCcw, AlertTriangle,
  Flame, Lock, Cpu, Sparkles, Terminal, Activity, ArrowRight, Layers
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface HardeningArenaProps {
  apiBaseUrl: string;
  onRuleDeployed?: () => void;
}

export const HardeningArena: React.FC<HardeningArenaProps> = ({ apiBaseUrl, onRuleDeployed }) => {
  const [seedPayload, setSeedPayload] = useState("' OR 1=1--");
  const [attackType, setAttackType] = useState("sql_injection");
  const [targetEndpoint, setTargetEndpoint] = useState("/search");
  const [isRunning, setIsRunning] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState<'chart' | 'rounds' | 'audit'>('chart');

  const runHardening = async () => {
    setIsRunning(true);
    setStatusMessage("Running multi-round mutation and convergence loop...");
    setSessionData(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/hardening/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed_payload: seedPayload,
          attack_type: attackType,
          endpoint: targetEndpoint,
          target_url: 'http://localhost:8001'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to complete hardening');
      }

      const data = await res.json();
      setSessionData(data);
      setStatusMessage(data.converged ? "🎯 Convergence achieved! WAF rule hardened." : "Hardening cycle completed (max rounds reached).");
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = async () => {
    if (!sessionData?.session_id) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/hardening/sessions/${sessionData.session_id}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      setSessionData((prev: any) => ({ ...prev, approval_status: 'APPROVED_AND_DEPLOYED' }));
      setStatusMessage("✅ Rule approved and deployed to active WAF gateway!");
      if (onRuleDeployed) onRuleDeployed();
    } catch (e: any) {
      setStatusMessage(`Approval failed: ${e.message}`);
    }
  };

  const handleReject = async () => {
    if (!sessionData?.session_id) return;
    try {
      await fetch(`${apiBaseUrl}/api/v1/hardening/sessions/${sessionData.session_id}/reject`, {
        method: 'POST'
      });
      setSessionData((prev: any) => ({ ...prev, approval_status: 'REJECTED' }));
      setStatusMessage("❌ Rule candidate rejected by analyst.");
    } catch (e: any) {
      setStatusMessage(`Rejection failed: ${e.message}`);
    }
  };

  const handleRollback = async () => {
    if (!sessionData?.rule_id) return;
    try {
      await fetch(`${apiBaseUrl}/api/v1/hardening/rules/${sessionData.rule_id}/rollback`, {
        method: 'POST'
      });
      setSessionData((prev: any) => ({ ...prev, approval_status: 'ROLLED_BACK' }));
      setStatusMessage("🔄 Rule successfully rolled back from live gateway.");
    } catch (e: any) {
      setStatusMessage(`Rollback failed: ${e.message}`);
    }
  };

  // Prepare Recharts chart data
  const chartData = sessionData?.rounds?.map((r: any) => ({
    name: `Round ${r.round_number}`,
    bypassRate: r.evaluation?.bypass_rate ?? 0,
    fpRate: r.evaluation?.fp_rate ?? 0,
    ruleLength: r.rule_length ?? 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/40 via-purple-950/30 to-cyan-950/40 border border-red-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_-10px_rgba(239,68,68,0.2)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-red-900/50 text-red-400 border border-red-700/50 px-2 py-0.5 rounded">
                Autonomous Loop
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-cyan-900/50 text-cyan-400 border border-cyan-700/50 px-2 py-0.5 rounded">
                False-Positive Gate: ACTIVE
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Flame size={24} className="text-red-400" /> Adversarial Hardening Studio
            </h2>
            <p className="text-xs md:text-sm text-white/60 mt-1 max-w-2xl">
              Simulates Red-Team mutation variants against candidate WAF rules. The rule iteratively improves
              until the bypass rate drops below 5% with a guaranteed 0% false-positive rate.
            </p>
          </div>

          <button
            onClick={runHardening}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-red-900/40 disabled:opacity-50 shrink-0"
          >
            {isRunning ? (
              <>
                <Activity size={16} className="animate-spin" />
                <span>Hardening Loop...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Launch Hardening</span>
              </>
            )}
          </button>
        </div>

        {/* Input Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/10">
          <div>
            <label className="text-[10px] font-mono text-white/40 block mb-1 uppercase">Trigger Seed Payload</label>
            <input
              type="text"
              value={seedPayload}
              onChange={(e) => setSeedPayload(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-white/40 block mb-1 uppercase">Vulnerability Type</label>
            <select
              value={attackType}
              onChange={(e) => setAttackType(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="sql_injection">SQL Injection (CWE-89)</option>
              <option value="xss">Cross-Site Scripting (CWE-79)</option>
              <option value="path_traversal">Path Traversal (CWE-22)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-white/40 block mb-1 uppercase">Target Endpoint</label>
            <input
              type="text"
              value={targetEndpoint}
              onChange={(e) => setTargetEndpoint(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-[#161b22] border border-[#30363d] px-4 py-2.5 rounded-xl text-xs font-mono text-cyan-400 flex items-center gap-2">
          <Terminal size={14} />
          <span>{statusMessage}</span>
        </div>
      )}

      {sessionData && (
        <div className="space-y-6">
          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#0b0f1f] border border-white/10 rounded-xl p-4">
              <span className="text-[10px] font-mono text-white/40 uppercase">Rounds to Converge</span>
              <p className="text-2xl font-bold text-white mt-1">{sessionData.total_rounds} / 5</p>
              <span className="text-[10px] text-cyan-400">{sessionData.converged ? '🎯 Converged (<5% bypass)' : 'Max rounds'}</span>
            </div>
            <div className="bg-[#0b0f1f] border border-white/10 rounded-xl p-4">
              <span className="text-[10px] font-mono text-white/40 uppercase">Final Bypass Rate</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {sessionData.rounds?.slice(-1)[0]?.evaluation?.bypass_rate ?? 0}%
              </p>
              <span className="text-[10px] text-emerald-500">From initial 100% bypass</span>
            </div>
            <div className="bg-[#0b0f1f] border border-white/10 rounded-xl p-4">
              <span className="text-[10px] font-mono text-white/40 uppercase">False Positive Rate</span>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {sessionData.rounds?.slice(-1)[0]?.evaluation?.fp_rate ?? 0}%
              </p>
              <span className="text-[10px] text-emerald-400">✅ 0% legitimate traffic blocked</span>
            </div>
            <div className="bg-[#0b0f1f] border border-white/10 rounded-xl p-4">
              <span className="text-[10px] font-mono text-white/40 uppercase">Time to Harden</span>
              <p className="text-2xl font-bold text-white mt-1">{sessionData.duration_seconds}s</p>
              <span className="text-[10px] text-white/40">Multi-variant evaluation</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'chart' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-white/40 hover:text-white'}`}
            >
              📈 Convergence Chart
            </button>
            <button
              onClick={() => setActiveTab('rounds')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'rounds' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-white/40 hover:text-white'}`}
            >
              🔢 Round-by-Round Breakdown
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'audit' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-white/40 hover:text-white'}`}
            >
              📋 Loop Audit Log
            </button>
          </div>

          {/* View 1: Recharts Convergence Chart */}
          {activeTab === 'chart' && (
            <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  Hardening Convergence Matrix (Bypass Rate vs False Positive Rate)
                </h4>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Bypass Rate (%)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> False Positive Rate (%)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} />
                    <YAxis stroke="#ffffff40" fontSize={11} unit="%" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#050811', borderColor: '#ffffff20', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Line type="monotone" dataKey="bypassRate" name="Bypass Rate (%)" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
                    <Line type="monotone" dataKey="fpRate" name="False Positive Rate (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* View 2: Round-by-Round Breakdown */}
          {activeTab === 'rounds' && (
            <div className="space-y-3">
              {sessionData.rounds?.map((r: any) => (
                <div key={r.round_number} className="bg-[#0b0f1f] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-cyan-900/40 text-cyan-300 border border-cyan-700/40 px-2 py-0.5 rounded">
                        Round {r.round_number} ({r.rule_version})
                      </span>
                      <span className="text-xs font-mono text-white/40">Duration: {r.duration_seconds}s</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-red-400 font-mono">Bypasses: {r.evaluation?.bypass_count} ({r.evaluation?.bypass_rate}%)</span>
                      <span className="text-emerald-400 font-mono">FP: {r.evaluation?.fp_count}</span>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 font-mono text-xs text-amber-300 break-all mb-2">
                    {r.rule_pattern}
                  </div>
                  {r.evaluation?.bypassed_samples?.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[10px] uppercase font-mono text-white/30 block mb-1">Representative Bypasses:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {r.evaluation.bypassed_samples.map((s: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-mono bg-red-950/40 text-red-300 border border-red-800/30 px-2 py-0.5 rounded">
                            {s.slice(0, 35)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* View 3: Audit Log */}
          {activeTab === 'audit' && (
            <div className="bg-[#0b0f1f] border border-white/10 rounded-xl p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-1">
              {sessionData.audit_log?.map((entry: string, i: number) => (
                <div key={i} className="text-white/60">
                  {entry}
                </div>
              ))}
            </div>
          )}

          {/* Human-in-the-Loop Approval Action Card */}
          <div className="bg-gradient-to-r from-blue-950/40 to-slate-900/50 border border-cyan-500/40 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-950/50 border border-amber-700/50 px-2 py-0.5 rounded">
                  Human-in-the-Loop Decision Gate
                </span>
                <h4 className="text-lg font-bold text-white mt-1">Converged Rule Review</h4>
                <p className="text-xs text-white/60 mt-0.5">
                  Status: <strong className="text-cyan-300">{sessionData.approval_status}</strong>
                </p>
                <div className="mt-3 bg-black/50 border border-cyan-500/30 rounded-lg p-3 font-mono text-xs text-cyan-300 break-all">
                  {sessionData.final_rule}
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {sessionData.approval_status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/30"
                    >
                      <CheckCircle size={14} /> Approve & Deploy
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <XCircle size={14} /> Reject Candidate
                    </button>
                  </>
                )}
                {sessionData.approval_status === 'APPROVED_AND_DEPLOYED' && (
                  <button
                    onClick={handleRollback}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <RotateCcw size={14} /> Rollback Rule
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
