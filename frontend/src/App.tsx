import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Shield, Activity, Bot, FileText, Cpu, Zap, Send,
  Swords, Target, Upload, Play, Square, AlertTriangle, CheckCircle,
  BarChart2, Lock, Globe, Terminal, Eye, ChevronRight, Wifi,
  RefreshCw, AlertCircle, TrendingUp, Server, Code, Search, Network,
  Boxes, Radio, Flame, Trophy, Crosshair, LogIn, LogOut, User,
  ShieldCheck, Bug, Plus, Trash2, Bell, BellRing, Download,
  Gauge, Fingerprint, AlertOctagon, ClipboardList, Layers, MapPin, Scan,
  Skull, Clock, Calendar, ArrowRight, Hash, Sparkles, ShieldAlert, ChevronDown
} from 'lucide-react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts'
import { BrandIntro } from './components/BrandIntro'
import { LandingPage } from './components/LandingPage'
import { LoginModal } from './components/LoginModal'
import { HardeningArena } from './components/HardeningArena'

const BASE_URL = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '')
const API = `${BASE_URL}/api/v1`

// ── Utility ───────────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<string, string> = {
  Critical: 'bg-red-950/60 border-red-600/50 text-red-300',
  High:     'bg-orange-950/60 border-orange-600/50 text-orange-300',
  Medium:   'bg-yellow-950/60 border-yellow-600/50 text-yellow-300',
  Low:      'bg-green-950/60 border-green-600/50 text-green-300',
}
const SEVERITY_BADGE: Record<string, string> = {
  Critical: 'bg-red-700/70 text-red-200',
  High:     'bg-orange-700/70 text-orange-200',
  Medium:   'bg-yellow-700/70 text-yellow-200',
  Low:      'bg-green-700/70 text-green-200',
}
const SEV_ICON: Record<string, string> = {
  Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢'
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, gradient, pulse }: any) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#484f58] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[#8b949e] text-xs font-medium mb-1">{label}</p>
          <p className="text-[#e6edf3] text-2xl font-semibold leading-none">{value}</p>
          {sub && <p className="text-[#6e7681] text-xs mt-1">{sub}</p>}
        </div>
        <div className="relative ml-3 shrink-0">
          <div className="w-8 h-8 rounded-md bg-[#21262d] border border-[#30363d] flex items-center justify-center">
            <Icon size={15} className="text-[#8b949e]" />
          </div>
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </div>
      </div>
    </div>
  )
}

function LiveTerminal({ logs, title }: { logs: string[], title: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [logs])

  const classify = (line: string) => {
    if (line.includes('🚨') || line.includes('VULNERABLE') || line.includes('FINDING') || line.includes('ERROR')) return 'text-red-400'
    if (line.includes('✅') || line.includes('complete') || line.includes('Healthy')) return 'text-emerald-400'
    if (line.includes('⚠️') || line.includes('WARNING') || line.includes('POSSIBLE') || line.includes('TIMEOUT')) return 'text-amber-400'
    if (line.includes('[SQL') || line.includes('[XSS') || line.includes('[BRUT') || line.includes('[CMD') || line.includes('[SSRF') || line.includes('[JWT') || line.includes('[IDOR') || line.includes('[PATH') || line.includes('[NOSO')) return 'text-orange-300'
    if (line.includes('[SOC') || line.includes('[Triage') || line.includes('[Threat') || line.includes('[Respond') || line.includes('[Commun')) return 'text-cyan-400'
    if (line.includes('Groq') || line.includes('AI') || line.includes('Llama')) return 'text-violet-400'
    if (line.includes('═') || line.includes('──')) return 'text-slate-500'
    return 'text-slate-300'
  }

  return (
    <div className="bg-[#0a0e1a] border border-slate-800/60 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d1220] border-b border-slate-800/60">
        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/70" /><div className="w-3 h-3 rounded-full bg-yellow-500/70" /><div className="w-3 h-3 rounded-full bg-green-500/70" /></div>
        <span className="text-slate-500 text-xs font-mono ml-2">{title}</span>
        <div className="ml-auto flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-green-400 text-[11px] font-semibold">LIVE</span></div>
      </div>
      <div ref={ref} className="h-64 overflow-y-auto p-4 space-y-0.5 scrollbar-thin">
        {logs.length === 0 && <p className="text-slate-600 font-mono text-xs">Waiting for activity...</p>}
        {logs.map((l, i) => <div key={i} className={`font-mono text-[11px] leading-5 ${classify(l)}`}>{l || '\u00a0'}</div>)}
      </div>
    </div>
  )
}

function FindingCard({ f }: { f: any }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${SEVERITY_STYLE[f.severity]}`}>
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpen(o => !o)}>
        <span className="text-xl">{SEV_ICON[f.severity]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{f.type.replace(/_/g,' ').toUpperCase()}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${SEVERITY_BADGE[f.severity]}`}>{f.severity}</span>
            <span className="text-xs opacity-60 font-mono">{f.endpoint}</span>
          </div>
          <p className="text-xs opacity-70 mt-0.5 truncate">{f.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs opacity-50">{f.detected_at}</span>
          <ChevronRight size={14} className={`opacity-50 transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><p className="opacity-50 mb-1">CWE</p><p className="font-mono font-bold">{f.cwe}</p></div>
            <div><p className="opacity-50 mb-1">MITRE ATT&CK</p><p className="font-mono font-bold">{f.mitre}</p></div>
            <div><p className="opacity-50 mb-1">HTTP Status</p><p className="font-mono font-bold">{f.status_code}</p></div>
          </div>
          <div>
            <p className="text-xs opacity-50 mb-1">Attack Payload Used</p>
            <code className="block bg-black/40 rounded p-2 text-xs font-mono break-all">{f.payload}</code>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-700/30 rounded-lg p-3">
            <p className="text-emerald-400 text-xs font-semibold mb-1">🛡️ Blue Team Remediation</p>
            <p className="text-xs opacity-80">{f.remediation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ProgressBar({ pct, label }: { pct: number, label: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-slate-400">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────

export default function App() {
  // ── Auth State ──
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('hvision_auth') === 'true')
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('hvision_user') || '')
  const [currentRole, setCurrentRole] = useState(localStorage.getItem('hvision_role') || 'admin')

  const handleLogin = () => {
    setLoginLoading(true)
    setLoginError('')
    setTimeout(() => {
      // Accept any non-empty credentials for demo (real system uses JWT)
      if (loginUser.trim() && loginPass.trim()) {
        const role = loginUser.toLowerCase().includes('admin') ? 'admin' : loginUser.toLowerCase().includes('view') ? 'viewer' : 'analyst'
        setIsLoggedIn(true)
        setCurrentUser(loginUser)
        setCurrentRole(role)
        localStorage.setItem('hvision_auth', 'true')
        localStorage.setItem('hvision_user', loginUser)
        localStorage.setItem('hvision_role', role)
      } else {
        setLoginError('Please enter both username and password.')
      }
      setLoginLoading(false)
    }, 800)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser('')
    localStorage.removeItem('hvision_auth')
    localStorage.removeItem('hvision_user')
    localStorage.removeItem('hvision_role')
  }

  // ── Core State ──
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('hvision_intro_seen'))
  const [showLanding, setShowLanding] = useState(false)
  const [activeHub, setActiveHub] = useState('hub_command')
  const [activeTab, setActiveTab] = useState('fleet')
  const [apiUp, setApiUp] = useState(false)
  const fleetApps = [
    { name: 'Core Payment API', url: 'https://pay.internal:8443', status: 'Healthy', ping: '12ms', attacks: 1420, blocked: 1420, active: true },
    { name: 'User Auth Service', url: 'https://users.internal:443', status: 'Warning', ping: '45ms', attacks: 850, blocked: 840, active: true },
    { name: 'Legacy HR Portal', url: 'http://10.0.4.55:80', status: 'Critical', ping: '120ms', attacks: 3200, blocked: 2900, active: true },
    { name: 'Staging Database Auth', url: 'https://staging.db:5432', status: 'Healthy', ping: '8ms', attacks: 45, blocked: 45, active: false },
  ]
  const [rtStatus, setRtStatus] = useState<any>(null)
  const [findings, setFindings] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [socLogs, setSocLogs] = useState<string[]>([])
  const [targetUrl, setTargetUrl] = useState('http://localhost:8001')
  const [targetDesc, setTargetDesc] = useState('Built-in Lab (Deliberately Vulnerable App)')
  const [selectedPhases, setSelectedPhases] = useState<string[]>([])
  const [launching, setLaunching] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '🛡️ H-vision AI (Groq Llama3-70b) ready. Ask me about detected vulnerabilities, MITRE ATT&CK techniques, how to fix specific issues, or request a threat analysis.' }
  ])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [filterSev, setFilterSev] = useState('All')
  const [patches, setPatches] = useState<any[]>([])
  const [wafRules, setWafRules] = useState<any[]>([])

  // ── Enterprise State ──
  const [compliance, setCompliance] = useState<any>(null)
  const [honeypotTraps, setHoneypotTraps] = useState<any[]>([])
  const [honeypotStats, setHoneypotStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [showAlertBanner, setShowAlertBanner] = useState(false)
  const [latestAlert, setLatestAlert] = useState('')
  // WAF Rule Builder
  const [newRuleField, setNewRuleField] = useState('url')
  const [newRulePattern, setNewRulePattern] = useState('')
  const [newRuleDesc, setNewRuleDesc] = useState('')
  // SOAR, Kill Chain, Discovery
  const [soarPlaybooks, setSoarPlaybooks] = useState<any[]>([])
  const [executingPb, setExecutingPb] = useState<string | null>(null)
  const [executedPbs, setExecutedPbs] = useState<Record<string, string>>({})
  const [killChain, setKillChain] = useState<any[]>([])
  const [discoveryResults, setDiscoveryResults] = useState<any>(null)
  const [discoveryEndpoints, setDiscoveryEndpoints] = useState<any[]>([])
  const [discoveryScanning, setDiscoveryScanning] = useState(false)
  
  // Credits Modal
  const [showCredits, setShowCredits] = useState(false)

  // Phase 6: Dark Web, Threat Hunt, Executive Metrics, Lifecycle, Scheduler
  const [darkwebSummary, setDarkwebSummary] = useState<any>(null)
  const [darkwebLeaks, setDarkwebLeaks] = useState<any[]>([])
  const [darkwebBreaches, setDarkwebBreaches] = useState<any[]>([])
  const [huntQuery, setHuntQuery] = useState('')
  const [huntResults, setHuntResults] = useState<any>(null)
  const [huntStats, setHuntStats] = useState<any>(null)
  const [executiveMetrics, setExecutiveMetrics] = useState<any>(null)
  const [lifecycleBoard, setLifecycleBoard] = useState<any>(null)
  const [lifecycleStats, setLifecycleStats] = useState<any>(null)
  const [schedules, setSchedules] = useState<any[]>([])
  const [scheduleHistory, setScheduleHistory] = useState<any[]>([])
  const [newScheduleName, setNewScheduleName] = useState('')
  const [newScheduleFreq, setNewScheduleFreq] = useState('manual')
  const [newScheduleIntensity, setNewScheduleIntensity] = useState('standard')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['sql_injection','xss'])

  const chatEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, chatLoading])

  const poll = useCallback(async () => {
    try {
      const h = await fetch(`${BASE_URL}/health`)
      setApiUp(h.ok)
    } catch { setApiUp(false) }
    try {
      const r = await fetch(`${API}/red-team/status`)
      if (r.ok) {
        const d = await r.json()
        setRtStatus(d)
        if (d.live_log?.length) setSocLogs(d.live_log)
        if (d.findings?.length) setFindings(d.findings)
      }
    } catch {}
    try {
      const r = await fetch(`${API}/red-team/history`)
      if (r.ok) { const d = await r.json(); setHistory(d.history || []) }
    } catch {}
    try {
      const p = await fetch(`${API}/patches`)
      if (p.ok) { const pd = await p.json(); setPatches(pd.items || []) }
    } catch {}
    try {
      const w = await fetch(`${BASE_URL}/waf/rules`)
      if (w.ok) { const wd = await w.json(); setWafRules(wd.rules || []) }
    } catch {}
    // Enterprise: Compliance score
    try {
      const c = await fetch(`${API}/compliance/score`)
      if (c.ok) { const cd = await c.json(); setCompliance(cd) }
    } catch {}
    // Enterprise: Honeypot traps
    try {
      const hp = await fetch(`${BASE_URL}/honeypot/traps`)
      if (hp.ok) { const hd = await hp.json(); setHoneypotTraps(hd.traps || []) }
    } catch {}
    try {
      const hs = await fetch(`${BASE_URL}/honeypot/stats`)
      if (hs.ok) { const hsd = await hs.json(); setHoneypotStats(hsd) }
    } catch {}
    // SOAR Playbooks
    try {
      const sp = await fetch(`${API}/soar/playbooks`)
      if (sp.ok) { const spd = await sp.json(); setSoarPlaybooks(spd.playbooks || []) }
    } catch {}
    // Kill Chain
    try {
      const kc = await fetch(`${API}/timeline/kill-chain`)
      if (kc.ok) { const kcd = await kc.json(); setKillChain(kcd.kill_chain || []) }
    } catch {}
    // Dark Web Intel
    try {
      const dw = await fetch(`${API}/darkweb/summary`)
      if (dw.ok) { setDarkwebSummary(await dw.json()) }
      const dl = await fetch(`${API}/darkweb/credentials`)
      if (dl.ok) { const dld = await dl.json(); setDarkwebLeaks(dld.leaks || []) }
      const db = await fetch(`${API}/darkweb/breaches`)
      if (db.ok) { const dbd = await db.json(); setDarkwebBreaches(dbd.breaches || []) }
    } catch {}
    // Executive Metrics
    try {
      const em = await fetch(`${API}/metrics/executive`)
      if (em.ok) { setExecutiveMetrics(await em.json()) }
    } catch {}
    // Vulnerability Lifecycle
    try {
      const lc = await fetch(`${API}/lifecycle/board`)
      if (lc.ok) { setLifecycleBoard(await lc.json()) }
      const ls = await fetch(`${API}/lifecycle/stats`)
      if (ls.ok) { setLifecycleStats(await ls.json()) }
    } catch {}
    // Hunt Stats
    try {
      const hs2 = await fetch(`${API}/hunt/stats`)
      if (hs2.ok) { setHuntStats(await hs2.json()) }
    } catch {}
    // Schedules
    try {
      const sc = await fetch(`${API}/scheduler/schedules`)
      if (sc.ok) { const scd = await sc.json(); setSchedules(scd.schedules || []) }
      const sh = await fetch(`${API}/scheduler/history`)
      if (sh.ok) { const shd = await sh.json(); setScheduleHistory(shd.history || []) }
    } catch {}
  }, [])

  useEffect(() => { poll(); const t = setInterval(poll, 3000); return () => clearInterval(t) }, [poll])

  // Blue Team SOC simulation feed
  useEffect(() => {
    const lines = [
      '[SOCOrchestrator] ══ New Alert Received ══',
      '[TriageAgent] Computing deduplication hash...',
      '[TriageAgent] Priority: CRITICAL → Escalating to Threat Hunter',
      '[ThreatHunterAgent] Querying Groq Llama3-70b...',
      '[ThreatHunterAgent] Technique: T1190 - Exploit Public-Facing App',
      '[ThreatHunterAgent] Root Cause: CWE-89 SQL Injection | Confidence: HIGH',
      '[ResponderAgent] Generating WAF Rule: Block SQL UNION SELECT...',
      '[ResponderAgent] Generating WAF Rule: Rate-limit /login 5 req/min...',
      '[ResponderAgent] Code patch (parameterized_queries.diff) → READY',
      '[CommunicatorAgent] Executive report INC-2026-001 → DELIVERED',
      '[SOCOrchestrator] ✅ Defense hardened. Cycle complete.',
    ]
    let i = 0
    const t = setInterval(() => {
      setSocLogs(prev => [...prev.slice(-100), lines[i % lines.length]])
      i++
    }, 2200)
    return () => clearInterval(t)
  }, [])

  const launchAttack = async () => {
    setLaunching(true)
    try {
      await fetch(`${API}/red-team/set-target`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: targetUrl, description: targetDesc })
      })
      const body: any = { target_url: targetUrl, description: targetDesc }
      if (selectedPhases.length) body.attack_types = selectedPhases
      const r = await fetch(`${API}/red-team/trigger`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!r.ok) { const d = await r.json(); alert(d.detail) }
      else { setFindings([]); setActiveTab('scanner') }
    } catch (e: any) { alert('Cannot reach API: ' + e.message) }
    setLaunching(false)
  }

  const stopAttack = () => fetch(`${API}/red-team/stop`, { method: 'POST' })
  const clearAll = async () => { await fetch(`${API}/red-team/clear`, { method: 'POST' }); setFindings([]) }

  const sendChat = async () => {
    if (!input.trim()) return
    const msg = input.trim(); setInput('')
    setMessages(m => [...m, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const r = await fetch(`${API}/chat/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      })
      const text = await r.text()
      let d: any = {}
      try { d = JSON.parse(text) } catch { d = { detail: text } }
      setMessages(m => [...m, { role: 'assistant', text: r.ok ? d.reply : `Error ${r.status}: ${d.detail || text}` }])
    } catch (e: any) { setMessages(m => [...m, { role: 'assistant', text: `Network error: ${e.message}` }]) }
    setChatLoading(false)
  }

  const generateReport = async () => {
    setReportLoading(true)
    try {
      const r = await fetch(`${API}/reports/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Security Scan Report — ${new Date().toLocaleString()}` })
      })
      const d = await r.json()
      if (r.ok) setReports(p => [d, ...p])
      else alert(`Error: ${d.detail}`)
    } catch (e: any) { alert('Error: ' + e.message) }
    setReportLoading(false)
  }

  const applyPatch = async (id: string) => {
    try {
      const r = await fetch(`${API}/patches/${id}/apply`, { method: 'POST' })
      if (r.ok) { alert('Patch applied successfully! Target app is restarting securely.'); poll(); }
      else { const d = await r.json(); alert(`Failed: ${d.detail}`) }
    } catch(e: any) { alert(`Error: ${e.message}`) }
  }

  const removeWafRule = async (id: string) => {
    try {
      const r = await fetch(`http://localhost:8001/waf/rules/${id}`, { method: 'DELETE' })
      if (r.ok) { poll(); }
    } catch(e) {}
  }

  const ALL_PHASES = [
    { id: 'sql_injection',     label: 'SQL Injection',      icon: '💉', sev: 'Critical' },
    { id: 'xss',               label: 'XSS',                icon: '📜', sev: 'High' },
    { id: 'path_traversal',    label: 'Path Traversal',     icon: '📂', sev: 'High' },
    { id: 'brute_force',       label: 'Brute Force',        icon: '🔓', sev: 'High' },
    { id: 'command_injection', label: 'Cmd Injection',       icon: '⚡', sev: 'Critical' },
    { id: 'idor',              label: 'IDOR',               icon: '🔑', sev: 'Medium' },
    { id: 'ssrf',              label: 'SSRF',               icon: '🌐', sev: 'Critical' },
    { id: 'nosql',             label: 'NoSQL Injection',     icon: '🗃️', sev: 'High' },
    { id: 'jwt_attack',        label: 'JWT Attack',          icon: '🎟️', sev: 'Critical' },
  ]

  const isRunning = rtStatus?.is_running ?? false
  const progress = rtStatus?.progress ?? 0
  const totalAttacks = rtStatus?.total_attacks ?? 0
  const totalFindings = rtStatus?.total_findings ?? 0
  const stats = rtStatus?.stats ?? {}

  const filteredFindings = filterSev === 'All' ? findings : findings.filter(f => f.severity === filterSev)
  const critCount = findings.filter(f => f.severity === 'Critical').length
  const highCount = findings.filter(f => f.severity === 'High').length

  // Enterprise: add WAF rule via API
  const addWafRule = async () => {
    if (!newRulePattern.trim()) return
    const rule = {
      id: `WAF-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
      pattern: newRulePattern,
      description: newRuleDesc || `Custom rule: block ${newRuleField} matching pattern`
    }
    try {
      const r = await fetch(`${BASE_URL}/waf/rules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      })
      if (r.ok) { setNewRulePattern(''); setNewRuleDesc(''); poll() }
    } catch {}
  }

  // Enterprise: export PDF (simple client-side)
  const exportPDF = () => {
    const content = `
      <html><head><style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a2e; }
        h1 { color: #0f3460; border-bottom: 3px solid #0f3460; padding-bottom: 10px; }
        h2 { color: #16213e; margin-top: 30px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .critical { background: #dc2626; color: white; }
        .high { background: #ea580c; color: white; }
        .medium { background: #ca8a04; color: white; }
        .low { background: #16a34a; color: white; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #0f3460; color: white; }
        .score { font-size: 64px; font-weight: bold; text-align: center; color: ${(compliance?.security_posture_score ?? 0) >= 70 ? '#16a34a' : '#dc2626'}; }
        .grade { font-size: 32px; text-align: center; color: #0f3460; }
      </style></head><body>
        <h1>🛡️ H-VISION Security Audit Report</h1>
        <p style="color:#64748b; font-size:13px; margin-top:-5px;">Autonomous Security Operations & Threat Remediation</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Analyst:</strong> ${currentUser || 'System'}</p>
        <p><strong>Target:</strong> ${targetUrl}</p>
        <hr/>
        <h2>Security Posture Score</h2>
        <p class="score">${compliance?.security_posture_score ?? 'N/A'}/100</p>
        <p class="grade">Grade: ${compliance?.grade ?? 'N/A'}</p>
        <h2>Vulnerability Summary</h2>
        <table><tr><th>Severity</th><th>Count</th></tr>
          <tr><td><span class="badge critical">CRITICAL</span></td><td>${critCount}</td></tr>
          <tr><td><span class="badge high">HIGH</span></td><td>${highCount}</td></tr>
          <tr><td><span class="badge medium">MEDIUM</span></td><td>${findings.filter(f=>f.severity==='Medium').length}</td></tr>
          <tr><td><span class="badge low">LOW</span></td><td>${findings.filter(f=>f.severity==='Low').length}</td></tr>
        </table>
        <h2>OWASP Top 10 Compliance</h2>
        <table><tr><th>Code</th><th>Category</th><th>Status</th><th>Vulns Found</th><th>WAF Rules</th></tr>
          ${(compliance?.owasp_top_10 || []).map((o:any) => `<tr><td>${o.code}</td><td>${o.name}</td><td>${o.status === 'PASSING' ? '✅ PASSING' : o.status === 'MITIGATED' ? '🛡️ MITIGATED' : o.status === 'FAILING' ? '❌ FAILING' : '⬜ NOT TESTED'}</td><td>${o.vulnerabilities_found}</td><td>${o.waf_rules_active}</td></tr>`).join('')}
        </table>
        <h2>Active WAF Rules (${wafRules.length})</h2>
        <table><tr><th>Rule ID</th><th>Description</th><th>Pattern</th></tr>
          ${wafRules.map((r:any) => `<tr><td>${r.id}</td><td>${r.description}</td><td><code>${r.pattern}</code></td></tr>`).join('')}
        </table>
        <h2>Honeypot Activity (${honeypotTraps.length} traps triggered)</h2>
        ${honeypotTraps.length > 0 ? `<table><tr><th>Time</th><th>Source IP</th><th>Endpoint</th><th>Type</th></tr>
          ${honeypotTraps.slice(-10).map((t:any) => `<tr><td>${t.timestamp}</td><td>${t.source_ip}</td><td>${t.endpoint}</td><td>${t.trap_type}</td></tr>`).join('')}
        </table>` : '<p>No honeypot activity recorded.</p>'}
        <h2>Detailed Findings (${findings.length})</h2>
        <table><tr><th>#</th><th>Type</th><th>Severity</th><th>Endpoint</th><th>CWE</th><th>MITRE</th></tr>
          ${findings.slice(0,50).map((f:any,i:number) => `<tr><td>${i+1}</td><td>${f.type}</td><td><span class="badge ${f.severity.toLowerCase()}">${f.severity}</span></td><td>${f.endpoint}</td><td>${f.cwe||'N/A'}</td><td>${f.mitre||'N/A'}</td></tr>`).join('')}
        </table>
        <hr/><p style="color:#999;font-size:11px;">Report generated by H-VISION Autonomous SOC Platform. Confidential.</p>
      </body></html>
    `
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `H-Vision_Security_Report_${new Date().toISOString().slice(0,10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Discovery scan
  const runDiscoveryScan = async () => {
    setDiscoveryScanning(true)
    try {
      const r = await fetch(`${API}/discovery/scan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: 'http://localhost:8001' })
      })
      if (r.ok) {
        const d = await r.json()
        setDiscoveryResults(d)
        const ep = await fetch(`${API}/discovery/endpoints`)
        if (ep.ok) { const epd = await ep.json(); setDiscoveryEndpoints(epd.endpoints || []) }
      }
    } catch {}
    setDiscoveryScanning(false)
  }

  // Execute SOAR playbook
  const executePlaybook = async (id: string) => {
    setExecutingPb(id)
    try {
      const r = await fetch(`${API}/soar/playbooks/${id}/execute`, { method: 'POST' })
      if (r.ok) {
        const d = await r.json()
        setExecutedPbs(prev => ({ ...prev, [id]: `✅ ${d.execution_id}: Threat Mitigated!` }))
      } else {
        setExecutedPbs(prev => ({ ...prev, [id]: `❌ Error: ${r.status}` }))
      }
    } catch (e: any) {
      setExecutedPbs(prev => ({ ...prev, [id]: `❌ ${e.message}` }))
    }
    setExecutingPb(null)
  }

  // Threat Hunt
  const runHuntQuery = async () => {
    if (!huntQuery.trim()) return
    try {
      const r = await fetch(`${API}/hunt/query`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: huntQuery })
      })
      if (r.ok) { setHuntResults(await r.json()) }
    } catch {}
  }

  // Lifecycle advance
  const advanceVuln = async (id: string) => {
    try {
      await fetch(`${API}/lifecycle/vulnerabilities/${id}/advance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: currentUser })
      })
      poll()
    } catch {}
  }

  // Create Schedule
  const createSchedule = async () => {
    try {
      await fetch(`${API}/scheduler/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScheduleName || `Test ${schedules.length + 1}`,
          frequency: newScheduleFreq, intensity: newScheduleIntensity,
          categories: selectedCategories,
        })
      })
      setNewScheduleName('')
      poll()
    } catch {}
  }

  // Run Scheduled Test NOW
  const runScheduleNow = async (id: string) => {
    try { await fetch(`${API}/scheduler/run/${id}`, { method: 'POST' }); poll() } catch {}
  }

  // ── 5 MASTER HUBS CONFIGURATION ──
  const MASTER_HUBS = [
    {
      id: 'hub_command',
      label: 'Command & Visibility',
      desc: 'Fleet telemetry, microservices & topology',
      icon: Boxes,
      defaultTab: 'fleet',
      tabs: [
        { id: 'fleet',      label: 'Fleet Command',    icon: Boxes },
        { id: 'executive',  label: 'Executive Metrics', icon: TrendingUp },
        { id: 'analytics',  label: 'SOC Analytics',    icon: BarChart2 },
        { id: 'topology',   label: 'Topology Map',     icon: Network },
        { id: 'intel',      label: 'Threat Radar',     icon: Radio },
      ]
    },
    {
      id: 'hub_simulation',
      label: 'Red Team & Hardening',
      desc: 'Mutation attacks & WAF hardening',
      icon: Swords,
      defaultTab: 'hardening',
      tabs: [
        { id: 'hardening',  label: '⚡ Hardening Arena (Phase 2)', icon: Flame, badge: 'NEW' },
        { id: 'scanner',    label: 'Red Team Scanner', icon: Search, badge: isRunning ? 'RUNNING' : undefined },
        { id: 'findings',   label: `Vulnerabilities ${findings.length > 0 ? `(${findings.length})` : ''}`, icon: AlertCircle, badge: findings.length > 0 ? findings.length : undefined },
        { id: 'discovery',  label: 'API Discovery',    icon: Scan },
        { id: 'pentest_scheduler', label: 'Pen Test Scheduler', icon: Calendar },
      ]
    },
    {
      id: 'hub_defense',
      label: 'Active Defense & SOAR',
      desc: 'Playbooks, honeypots, WAF & patches',
      icon: Shield,
      defaultTab: 'soar',
      tabs: [
        { id: 'soar',       label: 'SOAR Playbooks',   icon: ClipboardList },
        { id: 'waf_builder',label: 'WAF Builder',      icon: Fingerprint },
        { id: 'honeypot',   label: 'Honeypots & Canaries', icon: Bug },
        { id: 'patches',    label: 'Remediation Hub',  icon: ShieldCheck },
        { id: 'war_room',   label: 'War Room',         icon: AlertOctagon },
      ]
    },
    {
      id: 'hub_intel',
      label: 'AI Swarm & Forensics',
      desc: 'Groq agents, kill-chain & hunting',
      icon: Bot,
      defaultTab: 'ai',
      tabs: [
        { id: 'ai',         label: 'Groq AI Multi-Agent', icon: Bot },
        { id: 'hunt',       label: 'Threat Hunting CLI', icon: Terminal },
        { id: 'kill_chain', label: 'MITRE Kill Chain', icon: Layers },
        { id: 'darkweb',    label: 'Dark Web Leaks',   icon: Skull },
      ]
    },
    {
      id: 'hub_governance',
      label: 'Compliance & Reports',
      desc: 'Framework scoring, lifecycle & reports',
      icon: ShieldCheck,
      defaultTab: 'compliance',
      tabs: [
        { id: 'compliance', label: 'Compliance Matrix', icon: ShieldCheck, badge: compliance ? `${compliance.security_posture_score}%` : undefined },
        { id: 'lifecycle',  label: 'Vuln Lifecycle',   icon: RefreshCw },
        { id: 'reports',    label: 'Executive Reports', icon: FileText },
        { id: 'import',     label: 'Import Scan',      icon: Upload },
      ]
    }
  ]

  const TABS = MASTER_HUBS.flatMap(h => h.tabs)

  const selectTab = (tabId: string) => {
    setActiveTab(tabId)
    const hub = MASTER_HUBS.find(h => h.tabs.some(t => t.id === tabId))
    if (hub) setActiveHub(hub.id)
  }

  const selectHub = (hubId: string) => {
    setActiveHub(hubId)
    const hub = MASTER_HUBS.find(h => h.id === hubId)
    if (hub && !hub.tabs.some(t => t.id === activeTab)) {
      setActiveTab(hub.defaultTab)
    }
  }

  // ── 1. SIGNATURE VISUAL INTRO (NEON FLICKER & CYBER EYE) ──
  if (showIntro) {
    return (
      <BrandIntro
        onComplete={() => {
          sessionStorage.setItem('hvision_intro_seen', 'true')
          setShowIntro(false)
          setShowLanding(false)
        }}
      />
    )
  }

  // ── 2. PROJECT CAPABILITIES & ARCHITECTURE LANDING PAGE ──
  if (showLanding) {
    return (
      <LandingPage
        onEnter={() => {
          setShowLanding(false)
        }}
      />
    )
  }

  // ── 3. RESTRICTED AUTHENTICATION GATE ──
  if (!isLoggedIn) {
    return (
      <LoginModal
        onLoginSuccess={(u) => {
          setIsLoggedIn(true)
          setCurrentUser(u)
          const role = u.toLowerCase().includes('admin') ? 'admin' : 'analyst'
          setCurrentRole(role)
          localStorage.setItem('hvision_auth', 'true')
          localStorage.setItem('hvision_user', u)
          localStorage.setItem('hvision_role', role)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── SIDEBAR (CONSOLIDATED 5 MASTER HUBS) ─────────────────── */}
      <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Eye size={17} />
            </div>
            <div>
              <p className="font-extrabold text-sm text-[#e6edf3] tracking-wider leading-none">H-VISION</p>
              <p className="text-[#6e7681] text-[9px] font-mono mt-0.5">Autonomous SOC</p>
            </div>
          </div>
          <button
            onClick={() => setShowLanding(true)}
            title="View Project Capabilities"
            className="text-[#6e7681] hover:text-cyan-400 p-1 rounded hover:bg-[#21262d] transition-colors"
          >
            <Sparkles size={14} />
          </button>
        </div>

        {/* 5 Master Hub Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {MASTER_HUBS.map(hub => {
            const isHubActive = activeHub === hub.id || hub.tabs.some(t => t.id === activeTab)
            const HubIcon = hub.icon
            return (
              <div key={hub.id} className="space-y-0.5">
                <button
                  onClick={() => selectHub(hub.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left group
                    ${isHubActive
                      ? 'bg-gradient-to-r from-[#1f6feb]/20 to-[#1f6feb]/5 text-[#58a6ff] font-semibold border-l-2 border-[#58a6ff]'
                      : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'}`}
                >
                  <HubIcon size={15} className={isHubActive ? 'text-[#58a6ff]' : 'text-[#6e7681] group-hover:text-[#c9d1d9]'} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold leading-tight">{hub.label}</p>
                    <p className="text-[10px] text-[#6e7681] truncate">{hub.desc}</p>
                  </div>
                  {hub.id === 'hub_simulation' && isRunning && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  )}
                  {hub.id === 'hub_simulation' && findings.length > 0 && !isRunning && (
                    <span className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.2 rounded-full font-mono">
                      {findings.length}
                    </span>
                  )}
                </button>

                {/* Sub-tabs shown if Hub is active */}
                {isHubActive && (
                  <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-[#30363d]/60 ml-3">
                    {hub.tabs.map(t => {
                      const SubIcon = t.icon
                      const isSubActive = activeTab === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => selectTab(t.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all text-left
                            ${isSubActive
                              ? 'bg-[#1f6feb]/15 text-[#58a6ff] font-medium'
                              : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/60'}`}
                        >
                          <SubIcon size={12} className={isSubActive ? 'text-[#58a6ff]' : 'text-[#6e7681]'} />
                          <span className="truncate flex-1">{t.label}</span>
                          {t.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/50 text-cyan-300 font-mono">
                              {t.badge}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* System Info & Credits */}
        <div className="px-2 pb-2 border-t border-[#30363d] pt-2">
          <button onClick={() => setShowCredits(true)} className="w-full flex items-center justify-center gap-2 text-[#6e7681] hover:text-[#8b949e] hover:bg-[#21262d] border border-transparent hover:border-[#30363d] rounded-md py-1.5 text-xs transition-all">
            <Scan size={12} /> System Info & Credits
          </button>
        </div>

        {/* User status */}
        <div className="px-3 py-3 border-t border-[#30363d] space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#8b949e]">
            <div className="w-6 h-6 rounded-full bg-[#1f6feb] flex items-center justify-center">
              <User size={11} className="text-white" />
            </div>
            <span className="flex-1 truncate font-medium">{currentUser}</span>
            <span className="text-[10px] uppercase bg-[#1f6feb]/20 text-[#58a6ff] px-1.5 py-0.5 rounded-md font-semibold">{currentRole}</span>
          </div>
          <div className={`flex items-center gap-2 text-xs ${apiUp ? 'text-[#3fb950]' : 'text-red-400'}`}>
            <Wifi size={11} />
            <span>API {apiUp ? 'Online' : 'Offline'}</span>
            <div className={`ml-auto w-1.5 h-1.5 rounded-full ${apiUp ? 'bg-[#3fb950]' : 'bg-red-400'}`} />
          </div>
          {critCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#f85149]">
              <AlertCircle size={11} /><span>{critCount} Critical {highCount > 0 ? `+ ${highCount} High` : ''}</span>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-1.5 text-xs text-[#6e7681] hover:text-[#f85149] py-1 rounded-md hover:bg-[#21262d] transition-colors">
            <LogOut size={11} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-[#161b22] border-b border-[#30363d] px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-[#e6edf3] font-semibold text-sm">{TABS.find(t => t.id === activeTab)?.label.replace(/\(\d+\)/,'').trim()}</h2>
            <p className="text-[#6e7681] text-xs">H-VISION · Autonomous Security Operations Center</p>
          </div>
          <div className="flex items-center gap-2">
            {compliance && (
              <div className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold border ${
                compliance.security_posture_score >= 70 ? 'bg-[#1a4a2e] border-[#2d6a3f] text-[#3fb950]' :
                compliance.security_posture_score >= 40 ? 'bg-[#3d2d00] border-[#5a4000] text-[#d29922]' :
                'bg-[#3d0c0c] border-[#5a1a1a] text-[#f85149]'
              }`}>
                <Gauge size={12} /> Score: {compliance.security_posture_score}/100
              </div>
            )}
            {isRunning && (
              <div className="flex items-center gap-1.5 bg-[#3d0c0c] border border-[#5a1a1a] rounded-md px-3 py-1.5 text-xs text-[#f85149] font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f85149] animate-ping" /> SCANNING {progress}%
              </div>
            )}
            {critCount > 0 && !isRunning && (
              <div className="flex items-center gap-1.5 bg-[#3d0c0c] border border-[#5a1a1a] rounded-md px-3 py-1.5 text-xs text-[#f85149] font-semibold">
                <AlertCircle size={11} /> {critCount} Critical · {highCount} High
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-[#1a4a2e] border border-[#2d6a3f] rounded-md px-3 py-1.5 text-xs text-[#3fb950] font-semibold">
              <Zap size={11} /> 4 Agents Active
            </div>
            <button
              onClick={() => setShowLanding(true)}
              className="flex items-center gap-1.5 bg-[#1f6feb]/15 border border-[#1f6feb]/40 hover:border-[#1f6feb] rounded-md px-3 py-1.5 text-xs text-[#58a6ff] font-semibold transition-colors"
              title="View Project Capabilities & Architecture Overview"
            >
              <Eye size={12} /> Project Showcase
            </button>
            <button
              onClick={() => setShowIntro(true)}
              className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] hover:border-[#484f58] rounded-md px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] font-semibold transition-colors"
              title="Replay Neon Flicker Brand Intro"
            >
              <Sparkles size={11} className="text-yellow-400" /> Intro
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 bg-[#21262d] border border-[#30363d] hover:border-[#484f58] rounded-md px-3 py-1.5 text-xs text-[#c9d1d9] font-semibold transition-colors">
              <Download size={11} /> Export PDF
            </button>
            <button onClick={poll} className="p-1.5 text-[#6e7681] hover:text-[#c9d1d9] rounded-md hover:bg-[#21262d] transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#0d1117]">

          {/* Quick Sub-Tab Bar for Active Hub */}
          {(() => {
            const currentHub = MASTER_HUBS.find(h => h.id === activeHub || h.tabs.some(t => t.id === activeTab)) || MASTER_HUBS[0]
            return (
              <div className="mb-6 pb-3 border-b border-[#30363d] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-[#8b949e] uppercase tracking-wider mr-1">
                    {currentHub.label} :
                  </span>
                  {currentHub.tabs.map(t => {
                    const SubIcon = t.icon
                    const isSubActive = activeTab === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => selectTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSubActive
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                            : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-[#e6edf3] hover:border-[#484f58]'
                        }`}
                      >
                        <SubIcon size={13} className={isSubActive ? 'text-cyan-400' : 'text-[#6e7681]'} />
                        <span>{t.label}</span>
                        {t.badge && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                            isSubActive ? 'bg-cyan-400 text-black font-bold' : 'bg-[#21262d] text-cyan-400'
                          }`}>
                            {t.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLanding(true)}
                    className="flex items-center gap-1.5 text-xs text-[#58a6ff] hover:text-[#79c0ff] bg-[#1f6feb]/10 hover:bg-[#1f6feb]/20 border border-[#1f6feb]/30 px-2.5 py-1 rounded-md transition-all font-mono"
                  >
                    <Eye size={12} /> Project Capabilities
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ═══════════════ ADVERSARIAL HARDENING TAB (PHASE 2) ═══════════════ */}
          {activeTab === 'hardening' && (
            <div className="space-y-5">
              <HardeningArena apiBaseUrl={BASE_URL} onRuleDeployed={poll} />
            </div>
          )}


          {/* ═══════════════ FLEET TAB ═══════════════ */}
          {activeTab === 'fleet' && (
            <div className="space-y-5">
              {/* Page header — Google Cloud Console style */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#e6edf3] text-base font-semibold">Infrastructure Overview</h2>
                  <p className="text-[#8b949e] text-xs mt-0.5">Monitor all microservices and container health in real time</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="chip chip-green"><span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse inline-block"></span> All defenses active</span>
                </div>
              </div>

              {/* Summary metrics row — like GCP dashboard */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard icon={Server} label="Services Running" value={fleetApps.length} sub="All containers healthy" pulse />
                <StatCard icon={Shield} label="Attacks Blocked" value={fleetApps.reduce((a:number,x:any)=>a+(x.blocked||0),0)} sub="By WAF + Blue Team" />
                <StatCard icon={AlertTriangle} label="Total Attacks" value={fleetApps.reduce((a:number,x:any)=>a+(x.attacks||0),0)} sub="Since last restart" />
                <StatCard icon={Activity} label="Avg Latency" value={fleetApps.length ? fleetApps[0].ping : '—'} sub="Primary target" />
              </div>

              {/* Services table — AWS/GCP style */}
              <div className="ent-card overflow-hidden">
                <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                  <h3 className="text-[#e6edf3] text-sm font-medium">Services ({fleetApps.length})</h3>
                  <button onClick={poll} className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3] px-2 py-1 rounded hover:bg-[#21262d] transition-colors">
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Service Name</th>
                        <th>Endpoint</th>
                        <th>Status</th>
                        <th>Latency</th>
                        <th>Attacks Detected</th>
                        <th>Blocked</th>
                        <th>Block Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fleetApps.map((app: any, i: number) => {
                        const blockRate = app.attacks > 0 ? Math.round((app.blocked / app.attacks) * 100) : 100
                        return (
                          <tr key={i}>
                            <td>
                              <div className="flex items-center gap-2">
                                <Server size={13} className="text-[#8b949e] shrink-0" />
                                <span className="text-[#e6edf3] font-medium">{app.name}</span>
                              </div>
                            </td>
                            <td><span className="font-mono text-[#8b949e] text-xs">{app.url}</span></td>
                            <td>
                              <span className={`chip ${app.status === 'Healthy' ? 'chip-green' : app.status === 'Warning' ? 'chip-orange' : 'chip-red'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${app.status === 'Healthy' ? 'bg-[#3fb950]' : app.status === 'Warning' ? 'bg-[#d29922]' : 'bg-[#f85149]'}`}></span>
                                {app.status}
                              </span>
                            </td>
                            <td><span className="font-mono text-xs">{app.ping}</span></td>
                            <td><span className={app.attacks > 0 ? 'text-[#f85149]' : 'text-[#8b949e]'}>{app.attacks}</span></td>
                            <td><span className="text-[#3fb950]">{app.blocked}</span></td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden w-16">
                                  <div className="h-full bg-[#3fb950] rounded-full" style={{ width: `${blockRate}%` }} />
                                </div>
                                <span className="text-xs text-[#8b949e] w-8">{blockRate}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* ═══════════════ INTEL TAB ═══════════════ */}
          {activeTab === 'intel' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#e6edf3] text-base font-semibold">Agentic Memory & Predictive Defense</h2>
                  <p className="text-[#8b949e] text-xs mt-0.5">The Blue Team AI learns from attacks and proactively shields the entire fleet</p>
                </div>
                <span className="chip chip-green"><span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse inline-block"></span> AI Active</span>
              </div>

              <div className="ent-card divide-y divide-[#21262d]">
                {[
                  { time: '10s ago', action: 'Global WAF Rule Deployed', target: 'Fleet-Wide', desc: 'Auto-propagated regex filter for nested SQLi variants observed on Legacy HR Portal.', type: 'defense' },
                  { time: '45s ago', action: 'Predictive Patch Generation', target: 'Core Payment API', desc: 'Blue Team AI identified similar vulnerable Auth logic in Payment API based on the attack on User Service. Pre-emptively writing code patch.', type: 'patch' },
                  { time: '2m ago', action: 'Zero-Day Exploit Blocked', target: 'User Auth Service', desc: 'Red Team utilized undocumented JWT bypass. Triage agent caught anomaly, Responder generated instant WAF filter.', type: 'alert' },
                ].map((ev, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-[#21262d] transition-colors">
                    <span className={`chip mt-0.5 shrink-0 ${ev.type === 'defense' ? 'chip-green' : ev.type === 'patch' ? 'chip-blue' : 'chip-red'}`}>
                      {ev.type === 'defense' ? 'WAF' : ev.type === 'patch' ? 'PATCH' : 'ALERT'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[#e6edf3] text-sm font-medium">{ev.action}</p>
                        <span className="text-[#6e7681] text-xs shrink-0 font-mono">{ev.time}</span>
                      </div>
                      <p className="text-[#8b949e] text-xs mt-0.5 leading-relaxed">{ev.desc}</p>
                      <p className="text-[#6e7681] text-xs mt-1">Target: <span className="text-[#8b949e] font-mono">{ev.target}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ═══════════════ WAR ROOM TAB ═══════════════ */}
          {activeTab === 'war_room' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="text-center py-6">
                <h2 className="text-3xl font-black text-white flex items-center justify-center gap-4 uppercase tracking-widest mb-2"><Trophy className="text-amber-400" size={32} /> Adversarial War Room</h2>
                <p className="text-white/40 text-sm">Live ELO Tracking: Red Team (Offense) vs Blue Team (Defense)</p>
              </div>

              <div className="bg-[#0b0f1f] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_60px_-15px_rgba(255,255,255,0.05)]">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-transparent to-cyan-900/10 pointer-events-none" />
                
                <div className="flex justify-between items-end mb-8 relative z-10">
                  <div className="text-left">
                    <p className="text-red-500 font-bold text-xl uppercase tracking-widest mb-1 flex items-center gap-2"><Swords size={20}/> Red Team</p>
                    <p className="text-white text-5xl font-black font-mono">4,200</p>
                    <p className="text-red-400/50 text-xs mt-2 uppercase font-bold tracking-wider">Points (Breaches)</p>
                  </div>
                  <div className="text-center pb-2">
                    <Flame size={40} className="text-amber-500 animate-pulse mx-auto opacity-50" />
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-500 font-bold text-xl uppercase tracking-widest mb-1 flex items-center justify-end gap-2">Blue Team <Shield size={20}/></p>
                    <p className="text-white text-5xl font-black font-mono">8,900</p>
                    <p className="text-cyan-400/50 text-xs mt-2 uppercase font-bold tracking-wider">Points (Mitigations)</p>
                  </div>
                </div>

                <div className="relative h-6 rounded-full bg-black/50 border border-white/10 overflow-hidden z-10 shadow-inner">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000" style={{ width: '32%' }} />
                  <div className="absolute top-0 right-0 h-full bg-gradient-to-l from-cyan-600 to-cyan-500 transition-all duration-1000" style={{ width: '68%' }} />
                  <div className="absolute top-0 left-[32%] w-1 h-full bg-white shadow-[0_0_10px_white] z-20" />
                </div>
                
                <div className="grid grid-cols-2 gap-8 mt-10 relative z-10">
                  <div className="space-y-3">
                    <h4 className="text-red-400 text-xs font-bold uppercase tracking-widest border-b border-red-900/30 pb-2">Recent Offensive Plays</h4>
                    <p className="text-white/60 text-xs font-mono">+150 pts: Bypassed initial WAF via Smuggling</p>
                    <p className="text-white/60 text-xs font-mono">+300 pts: Discovered unauthenticated IDOR</p>
                  </div>
                  <div className="space-y-3 text-right">
                    <h4 className="text-cyan-400 text-xs font-bold uppercase tracking-widest border-b border-cyan-900/30 pb-2">Recent Defensive Plays</h4>
                    <p className="text-white/60 text-xs font-mono">+500 pts: Zero-Day WAF rule generated in 1.2s</p>
                    <p className="text-white/60 text-xs font-mono">+800 pts: Root-cause code patch applied</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-5 max-w-6xl mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={TrendingUp} label="Threat Coverage" value="98.2%" sub="MITRE ATT&CK Mapping" gradient="bg-gradient-to-br from-indigo-900/40 to-indigo-950/60 border-indigo-800/30" pulse />
                <StatCard icon={Zap} label="Mean Time to Detect" value="1.2s" sub="Sub-second AI analysis" gradient="bg-gradient-to-br from-cyan-900/40 to-cyan-950/60 border-cyan-800/30" />
                <StatCard icon={Shield} label="Active Auto-Defense" value="14" sub="WAF Rules Auto-Deployed" gradient="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border-emerald-800/30" pulse />
                <StatCard icon={AlertTriangle} label="Critical Incidents" value={critCount.toString()} sub="Requires manual review" gradient="bg-gradient-to-br from-red-900/40 to-red-950/60 border-red-800/30" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Security Posture Radar */}
                <div className="bg-[#0b0f1f] border border-white/8 rounded-2xl p-5 lg:col-span-1 shadow-[0_0_40px_-15px_rgba(34,211,238,0.15)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                  <h3 className="text-white font-semibold mb-6 flex items-center gap-2 text-sm relative">
                    <Target size={16} className="text-cyan-400" /> Defense Readiness Posture
                  </h3>
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'SQLi', A: 95, fullMark: 100 },
                        { subject: 'XSS', A: 90, fullMark: 100 },
                        { subject: 'Path Traversal', A: 85, fullMark: 100 },
                        { subject: 'Auth Bypass', A: 99, fullMark: 100 },
                        { subject: 'Cmd Injection', A: 92, fullMark: 100 },
                        { subject: 'JWT Abuse', A: 88, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                        <Radar name="Defenses" dataKey="A" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Threat Traffic Area Chart */}
                <div className="bg-[#0b0f1f] border border-white/8 rounded-2xl p-5 lg:col-span-2 shadow-[0_0_40px_-15px_rgba(239,68,68,0.1)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
                  <h3 className="text-white font-semibold mb-6 flex items-center gap-2 text-sm relative">
                    <Activity size={16} className="text-red-400" /> Malicious Traffic Flow (Last 24h)
                  </h3>
                  <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { time: '00:00', attacks: 120, blocked: 120 }, { time: '04:00', attacks: 180, blocked: 178 },
                        { time: '08:00', attacks: 800, blocked: 795 }, { time: '12:00', attacks: 1200, blocked: 1190 },
                        { time: '16:00', attacks: 600, blocked: 600 }, { time: '20:00', attacks: 300, blocked: 300 },
                      ]}>
                        <defs>
                          <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="attacks" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAttacks)" />
                        <Area type="monotone" dataKey="blocked" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocked)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Live Threat Ticker */}
              <div className="bg-[#0b0f1f] border border-white/8 rounded-xl p-3 flex items-center gap-4 overflow-hidden relative">
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider shrink-0 bg-[#0b0f1f] pr-4 z-10 border-r border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> Live Ticker
                </div>
                <div className="flex gap-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap opacity-60">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-8">
                      <span className="text-xs font-mono"><span className="text-orange-400">[SQLi]</span> Blocked at /api/users from 192.168.1.14</span>
                      <span className="text-xs font-mono"><span className="text-red-400">[XSS]</span> WAF Rule auto-deployed for /search</span>
                      <span className="text-xs font-mono"><span className="text-violet-400">[Agent]</span> ThreatHunter generated new MITRE report</span>
                      <span className="text-xs font-mono"><span className="text-cyan-400">[Patch]</span> Code fix deployed to target_app:8001</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ TOPOLOGY TAB ═══════════════ */}
          {activeTab === 'topology' && (
            <div className="max-w-6xl mx-auto h-[700px] bg-[#0b0f1f] border border-white/8 rounded-2xl relative overflow-hidden flex flex-col shadow-[0_0_50px_-12px_rgba(56,189,248,0.1)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_100%)] pointer-events-none" />
              <div className="p-5 border-b border-white/5 relative z-10 flex justify-between items-center bg-black/20 backdrop-blur-sm">
                <div>
                  <h3 className="text-white font-bold flex items-center gap-2"><Network size={18} className="text-cyan-400" /> Live Network Topology</h3>
                  <p className="text-white/40 text-[11px] mt-1">Real-time architecture and threat flow visualization</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] text-white/50 uppercase tracking-widest">Attacker</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-[10px] text-white/50 uppercase tracking-widest">Defense</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-white/50 uppercase tracking-widest">Target</span></div>
                </div>
              </div>
              
              <div className="flex-1 relative">
                {/* SVG Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* External to Gateway */}
                  <path d="M 150 300 Q 300 150 450 300" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="2" strokeDasharray="5,5" className={isRunning ? 'animate-[dash_1s_linear_infinite]' : ''} />
                  
                  {/* Gateway to Target */}
                  <path d="M 450 300 L 750 300" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  
                  {/* Gateway to SOC */}
                  <path d="M 450 300 L 450 500" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_2s_linear_infinite_reverse]" />
                  
                  {/* SOC to DB */}
                  <path d="M 450 500 L 750 500" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                </svg>

                {/* Nodes */}
                {/* Red Agent */}
                <div className="absolute top-[260px] left-[70px] w-40 flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-2xl bg-red-950/80 border-2 flex items-center justify-center mb-3 shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)] relative
                    ${isRunning ? 'border-red-500 animate-pulse' : 'border-red-900'}`}>
                    {isRunning && <div className="absolute inset-0 rounded-2xl border border-red-400 animate-ping opacity-50" />}
                    <Swords size={28} className={isRunning ? 'text-red-400' : 'text-red-700'} />
                  </div>
                  <span className="text-xs font-bold text-red-200">Red Team Agent</span>
                  <span className="text-[9px] text-white/30 font-mono mt-1">Adversary Emulation</span>
                </div>

                {/* API Gateway (Sentinel) */}
                <div className="absolute top-[260px] left-[410px] w-20 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900/80 border-2 border-cyan-700 flex items-center justify-center mb-3 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] z-10 relative">
                    <div className="absolute -inset-2 rounded-3xl border border-cyan-500/20 animate-spin-slow" />
                    <Shield size={32} className="text-cyan-400" />
                  </div>
                  <span className="text-xs font-bold text-white">Sentinel Gateway</span>
                  <span className="text-[9px] text-white/30 font-mono mt-1">WAF & Routing</span>
                </div>

                {/* Target App */}
                <div className="absolute top-[260px] left-[710px] w-20 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border-2 border-emerald-700 flex items-center justify-center mb-3 shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]">
                    <Server size={28} className="text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-emerald-200">Target App</span>
                  <span className="text-[9px] text-white/30 font-mono mt-1">{targetUrl}</span>
                </div>

                {/* Blue Team AI Swarm */}
                <div className="absolute top-[460px] left-[390px] w-32 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-violet-950/80 border-2 border-violet-600 flex items-center justify-center mb-3 shadow-[0_0_40px_-5px_rgba(139,92,246,0.4)] relative">
                    <div className="absolute inset-0 rounded-full border border-violet-400/50 animate-ping opacity-20" />
                    <Bot size={40} className="text-violet-300" />
                  </div>
                  <span className="text-xs font-bold text-violet-200">Blue Team Swarm</span>
                  <span className="text-[9px] text-white/30 font-mono mt-1">Groq Llama3-70b</span>
                </div>

                {/* Knowledge Graph / Chroma */}
                <div className="absolute top-[460px] left-[710px] w-20 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border-2 border-slate-700 flex items-center justify-center mb-3">
                    <Globe size={28} className="text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">Vector DB</span>
                  <span className="text-[9px] text-white/30 font-mono mt-1">Chroma</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ SCANNER TAB ═══════════════ */}
          {activeTab === 'scanner' && (
            <div className="space-y-5">
              {/* Page header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#e6edf3] text-base font-semibold">Penetration Test Runner</h2>
                  <p className="text-[#8b949e] text-xs mt-0.5">Configure and launch automated security scans against your target application</p>
                </div>
                {isRunning && <span className="chip chip-red"><span className="w-1.5 h-1.5 rounded-full bg-[#f85149] animate-ping inline-block"></span> Scan in progress</span>}
              </div>

              {/* Top stats */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard icon={Swords}      label="Probes Fired"    value={totalAttacks.toLocaleString()} sub="This session"    pulse={isRunning} />
                <StatCard icon={AlertCircle} label="Vulnerabilities" value={totalFindings}   sub={`${critCount} critical`} />
                <StatCard icon={Activity}    label="Scans Completed" value={rtStatus?.cycle_count ?? 0} sub="Total cycles" />
                <StatCard icon={Shield}      label="Blue Team"       value="Active" sub="4 agents running" pulse />
              </div>

              {/* Target Config — enterprise form style */}
              <div className="ent-card">
                <div className="px-4 py-3 border-b border-[#30363d]">
                  <h3 className="text-[#e6edf3] text-sm font-medium">Scan Configuration</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[#8b949e] text-xs font-medium block mb-1.5">Target URL</label>
                      <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
                        placeholder="http://your-app:port"
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#e6edf3] text-sm font-mono outline-none focus:border-[#1f6feb] transition-colors placeholder-[#6e7681]" />
                    </div>
                    <div>
                      <label className="text-[#8b949e] text-xs font-medium block mb-1.5">Target Description</label>
                      <input value={targetDesc} onChange={e => setTargetDesc(e.target.value)}
                        placeholder="e.g. My Django project, NodeJS API..."
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-[#e6edf3] text-sm outline-none focus:border-[#1f6feb] transition-colors placeholder-[#6e7681]" />
                    </div>
                  </div>

                  {/* Phase selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[#8b949e] text-xs font-medium">Attack Phases <span className="text-[#6e7681]">(all selected if none chosen)</span></label>
                      <button onClick={() => setSelectedPhases([])} className="text-xs text-[#6e7681] hover:text-[#8b949e]">Clear selection</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_PHASES.map(p => {
                        const sel = selectedPhases.includes(p.id)
                        const count = stats[p.id] ?? 0
                        return (
                          <button key={p.id} onClick={() => setSelectedPhases(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                              ${sel ? 'bg-[#1f6feb]/15 border-[#1f6feb]/50 text-[#58a6ff]' : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-[#484f58] hover:text-[#c9d1d9]'}`}>
                            <span>{p.icon}</span> {p.label}
                            {count > 0 && <span className="ml-1 text-[#6e7681]">({count})</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-1 border-t border-[#21262d]">
                    <button onClick={launchAttack} disabled={launching || isRunning}
                      className="flex items-center gap-2 bg-[#da3633] hover:bg-[#f85149] disabled:opacity-40 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors">
                      <Play size={14} /> {isRunning ? 'Scanning...' : 'Launch Scan'}
                    </button>
                    <button onClick={() => stopAttack()} disabled={!isRunning}
                      className="flex items-center gap-2 bg-[#21262d] border border-[#30363d] hover:border-[#484f58] disabled:opacity-30 text-[#c9d1d9] px-4 py-2 rounded-md font-medium text-sm transition-colors">
                      <Square size={13} /> Stop
                    </button>
                    <button onClick={clearAll} className="flex items-center gap-2 text-[#6e7681] hover:text-[#8b949e] px-3 py-2 rounded-md text-sm transition-colors">
                      <RefreshCw size={13} /> Clear Results
                    </button>
                  </div>
                </div>
              </div>



              {/* Progress bar (only when running) */}
              {isRunning && (
                <div className="ent-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#e6edf3] text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#f85149] animate-ping" />
                      Scanning: <span className="text-[#d29922] font-mono">{rtStatus?.current_phase?.replace(/_/g,' ').toUpperCase()}</span>
                    </p>
                    <p className="text-[#6e7681] text-xs">{totalAttacks} probes · {totalFindings} findings</p>
                  </div>
                  <ProgressBar pct={progress} label={`${rtStatus?.current_target}`} />
                </div>
              )}

              {/* Bottom row: phase breakdown + live logs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="ent-card p-4">
                  <h4 className="text-[#8b949e] text-xs font-medium mb-3 flex items-center gap-2"><BarChart2 size={12} /> Attack Phase Breakdown</h4>
                  <div className="space-y-2">
                    {ALL_PHASES.map(p => {
                      const c = stats[p.id] ?? 0; const max = Math.max(...ALL_PHASES.map((x:any) => stats[x.id] ?? 0), 1)
                      return (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="text-sm w-5 text-center">{p.icon}</span>
                          <span className="text-[#8b949e] text-xs w-20 shrink-0">{p.label}</span>
                          <div className="flex-1 bg-[#21262d] rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-[#1f6feb] rounded-full transition-all duration-700" style={{ width: `${Math.round((c/max)*100)}%` }} />
                          </div>
                          <span className="text-[#6e7681] text-xs w-6 text-right">{c}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="ent-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                    <h4 className="text-[#e6edf3] text-sm font-medium">Recent Findings</h4>
                    {findings.length > 0 && <button onClick={() => setActiveTab('findings')} className="text-xs text-[#58a6ff] hover:text-[#79c0ff]">View all →</button>}
                  </div>
                  {findings.length === 0 ? (
                    <p className="text-[#6e7681] text-xs text-center py-8">No findings yet. Launch a scan to get started.</p>
                  ) : (
                    <table className="data-table">
                      <tbody>
                        {findings.slice(-5).reverse().map((f: any, i: number) => (
                          <tr key={i}>
                            <td><span className={`chip ${f.severity === 'Critical' ? 'chip-red' : f.severity === 'High' ? 'chip-orange' : f.severity === 'Medium' ? 'chip-orange' : 'chip-green'}`}>{f.severity}</span></td>
                            <td className="font-medium text-[#e6edf3]">{f.type?.replace(/_/g,' ')}</td>
                            <td className="font-mono text-[#6e7681] text-xs truncate max-w-[120px]">{f.endpoint}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Live terminal */}
              <LiveTerminal logs={socLogs} title="h-vision-red-team — live attack log" />
            </div>
          )}

          {/* ═══════════════ FINDINGS TAB ═══════════════ */}
          {activeTab === 'findings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#e6edf3] text-base font-semibold">Vulnerability Findings</h2>
                  <p className="text-[#8b949e] text-xs mt-0.5">{findings.length} total · {critCount} Critical · {highCount} High · {findings.filter((f:any)=>f.severity==='Medium').length} Medium</p>
                </div>
                <div className="flex items-center gap-2">
                  {['All','Critical','High','Medium','Low'].map(s => (
                    <button key={s} onClick={() => setFilterSev(s)}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-all ${filterSev===s ? 'bg-[#1f6feb]/15 border-[#1f6feb]/50 text-[#58a6ff]' : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:border-[#484f58]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFindings.length === 0 ? (
                <div className="ent-card text-center py-16">
                  <AlertCircle size={32} className="mx-auto mb-3 text-[#6e7681]" />
                  <p className="text-[#8b949e] font-medium mb-1">{findings.length === 0 ? 'No findings yet' : `No ${filterSev} findings`}</p>
                  <p className="text-[#6e7681] text-sm">{findings.length === 0 ? 'Launch a scan to discover vulnerabilities.' : 'Try a different severity filter.'}</p>
                </div>
              ) : (
                <div className="ent-card overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Vulnerability Type</th>
                        <th>Endpoint</th>
                        <th>Payload (Evidence)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFindings.map((f: any, i: number) => (
                        <tr key={i}>
                          <td><span className={`chip ${f.severity==='Critical'?'chip-red':f.severity==='High'?'chip-orange':f.severity==='Medium'?'chip-orange':'chip-green'}`}>{f.severity}</span></td>
                          <td className="text-[#e6edf3] font-medium">{f.type?.replace(/_/g,' ')}</td>
                          <td className="font-mono text-xs text-[#8b949e]">{f.endpoint}</td>
                          <td className="font-mono text-xs text-[#6e7681] max-w-[200px] truncate">{f.payload || '—'}</td>
                          <td><span className="chip chip-green">Detected</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ BLUE TEAM TAB ═══════════════ */}
          {activeTab === 'blueteam' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#e6edf3] text-base font-semibold">Blue Team Defense</h2>
                  <p className="text-[#8b949e] text-xs mt-0.5">AI-driven autonomous defense agents and automated response</p>
                </div>
                <span className="chip chip-green"><span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse inline-block"></span> 4 Agents active</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <StatCard icon={Shield} label="Agents Running"      value="4"                             sub="All healthy" pulse />
                <StatCard icon={Lock}   label="WAF Rules Generated" value={`${(rtStatus?.cycle_count??0)*3}+`} sub="Auto-deployed" />
                <StatCard icon={Code}   label="Patch Proposals"     value={`${(rtStatus?.cycle_count??0)}+`}   sub="Pending review" />
                <StatCard icon={Cpu}    label="AI Model"            value="Llama3-70b"                    sub="Via Groq API" />
              </div>

              <div className="grid grid-cols-2 gap-4">

                {[
                  { name: 'Triage Agent', color: 'border-blue-700/40', icon: Activity, dot: 'bg-blue-500',
                    steps: ['Receive raw security alerts from API','Compute SHA-256 deduplication hash','Score priority: CRITICAL/HIGH/MEDIUM/LOW','Drop duplicate alerts automatically','Escalate unique high-priority alerts','Forward to Threat Hunter for investigation'] },
                  { name: 'Threat Hunter Agent (Groq AI)', color: 'border-violet-700/40', icon: Eye, dot: 'bg-violet-500',
                    steps: ['Receive triaged alert payload','Build structured prompt for Groq Llama3-70b','Map attack to MITRE ATT&CK framework','Identify exact CWE weakness category','Assess attacker skill level + intent','Return confidence-rated threat analysis JSON'] },
                  { name: 'Responder Agent', color: 'border-amber-700/40', icon: Lock, dot: 'bg-amber-500',
                    steps: ['Receive AI-analyzed threat intelligence','Generate context-aware WAF blocking rules','Create unified-diff code patch proposal','Set remediation priority by CVSS score','Submit patch to review queue via API','Log response actions to audit trail'] },
                  { name: 'Communicator Agent', color: 'border-emerald-700/40', icon: FileText, dot: 'bg-emerald-500',
                    steps: ['Compile full incident timeline','Include MITRE ATT&CK technique mapping','List all WAF rules generated','Reference code patch + CWE description','Generate executive summary (non-technical)','Deliver structured incident report'] },
                ].map((a, i) => (
                  <div key={i} className={`bg-[#0b0f1f] border ${a.color} rounded-2xl p-5`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <a.icon size={16} className="text-white/60" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{a.name}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${a.dot} animate-pulse`} />
                    </div>
                    <div className="space-y-2">
                      {a.steps.map((s, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <span className="text-white/20 text-xs mt-0.5 font-mono">{String(j+1).padStart(2,'0')}</span>
                          <p className="text-white/50 text-xs leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <LiveTerminal logs={socLogs} title="blue-team-soc — multi-agent orchestrator live" />
            </div>
          )}

          {/* ═══════════════ IMPORT TAB ═══════════════ */}
          {activeTab === 'import' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-700/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2"><Globe size={20} className="text-cyan-400" /> Test Any Application with H-vision</h3>
                <p className="text-white/50 text-sm">Import any web app, API, or service. The Red Team auto-probes for vulnerabilities; the Blue Team analyzes and proposes defenses.</p>
              </div>

              <div className="bg-[#0b0f1f] border border-white/8 rounded-2xl p-6">
                <h4 className="text-white font-semibold mb-1 flex items-center gap-2"><span className="bg-cyan-600 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">QUICKEST</span> Enter URL Directly</h4>
                <p className="text-white/40 text-sm mb-3">Paste your running app's URL below and click Launch.</p>
                <div className="flex gap-2">
                  <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="http://localhost:3000"
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono outline-none focus:border-cyan-500/60 transition-colors placeholder-white/20" />
                  <button onClick={() => setActiveTab('scanner')} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                    <Play size={14} /> Scan Now
                  </button>
                </div>
              </div>

              <div className="bg-[#0b0f1f] border border-white/8 rounded-2xl p-6">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><span className="bg-violet-600 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">DOCKER</span> Add to Lab Network</h4>
                <div className="bg-black/50 rounded-xl p-4 font-mono text-xs space-y-1 text-emerald-400 border border-emerald-900/30">
                  <p className="text-white/30"># 1. docker-compose.yml — add your service</p>
                  <p>your_app:</p>
                  <p>&nbsp;&nbsp;image: your-docker-image</p>
                  <p>&nbsp;&nbsp;networks: [lab_network]</p>
                  <p>&nbsp;&nbsp;ports: ["8080:8080"]</p>
                  <p className="text-white/30 pt-2"># 2. .env — point Red Team at it</p>
                  <p>TARGET_URL=http://your_app:8080</p>
                  <p className="text-white/30 pt-2"># 3. Restart</p>
                  <p>docker compose up --build red_agent api</p>
                </div>
              </div>

              <div className="bg-[#0b0f1f] border border-white/8 rounded-2xl p-6">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><span className="bg-amber-600 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">ANY LANG</span> Framework Quick Start</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { l: 'Node.js / Express', c: 'node app.js\n# Expose: http://localhost:3000' },
                    { l: 'Python / Django', c: 'python manage.py runserver 0:8080' },
                    { l: 'Python / Flask', c: 'flask run --host=0.0.0.0 --port=8080' },
                    { l: 'Spring Boot', c: 'java -jar app.jar\n# --server.port=8080' },
                    { l: 'Laravel / PHP', c: 'php artisan serve --host=0.0.0.0' },
                    { l: 'Ruby on Rails', c: 'rails server -b 0.0.0.0 -p 3000' },
                  ].map((f, i) => (
                    <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5">
                      <p className="text-cyan-400 text-xs font-semibold mb-1.5">{f.l}</p>
                      <p className="text-white/40 font-mono text-[11px] whitespace-pre-line">{f.c}</p>
                    </div>
                  ))}
                </div>
                <p className="text-amber-500/70 text-xs mt-3">⚠️ Bind to <code className="text-amber-400">0.0.0.0</code> so Docker can reach your app. Academic use only — never target live systems.</p>
              </div>

              <div className="bg-[#0b0f1f] border border-white/8 rounded-2xl p-6">
                <h4 className="text-white font-semibold mb-3">What will be tested on your app?</h4>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_PHASES.map(p => (
                    <div key={p.id} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs ${SEVERITY_STYLE[p.sev]} opacity-80`}>
                      <span>{p.icon}</span><span className="font-medium">{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ AUTO-REMEDIATION HUB TAB ═══════════════ */}
          {activeTab === 'patches' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header Status */}
              <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3">
                    <Shield size={22} className="text-emerald-400" /> Auto-Remediation Command Center
                  </h3>
                  <p className="text-white/60 text-sm">Review AI-generated code patches and live Web Application Firewall rules.</p>
                </div>
                <div className="flex gap-4 relative z-10">
                  <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-xl px-4 py-2 flex flex-col items-center">
                    <span className="text-emerald-400 text-xl font-bold">{patches.length}</span>
                    <span className="text-emerald-500/60 text-[10px] uppercase font-bold tracking-wider">Patches</span>
                  </div>
                  <div className="bg-violet-950/50 border border-violet-800/40 rounded-xl px-4 py-2 flex flex-col items-center">
                    <span className="text-violet-400 text-xl font-bold">{wafRules.length}</span>
                    <span className="text-violet-500/60 text-[10px] uppercase font-bold tracking-wider">WAF Rules</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Self-Healing Patches Section */}
                <div className="bg-[#0b0f1f] border border-emerald-800/30 rounded-2xl p-6 shadow-[0_0_40px_-15px_rgba(16,185,129,0.1)] relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wide"><Code size={16} className="text-emerald-400" /> Pending Code Patches</h3>
                    </div>
                  </div>
                  {patches.length === 0 ? (
                    <div className="text-center py-12 text-white/20">
                      <CheckCircle size={40} className="mx-auto mb-3 opacity-20 text-emerald-400" />
                      <p className="text-sm font-medium">All systems patched.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {patches.map(p => (
                        <div key={p.id} className="bg-black/40 border border-emerald-900/50 p-4 rounded-xl relative overflow-hidden group">
                          <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-800/50">{p.id}</span>
                              <h4 className="text-white font-medium mt-2 text-sm">{p.explanation}</h4>
                              <p className="text-white/40 text-[11px] font-mono mt-1 flex items-center gap-1.5"><Terminal size={10} /> {p.target_file}</p>
                            </div>
                            {p.status === 'applied' ? (
                              <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-800/50"><CheckCircle size={12}/> APPLIED</span>
                            ) : (
                              <button onClick={() => applyPatch(p.id)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]">
                                <Play size={12} /> Apply Patch
                              </button>
                            )}
                          </div>
                          <div className="bg-[#05080f] p-3 rounded-lg border border-white/5 overflow-x-auto shadow-inner">
                            <pre className="text-[11px] font-mono leading-relaxed">
                              {p.unified_diff.split('\n').map((line: string, i: number) => {
                                let color = 'text-slate-400'
                                let bg = 'bg-transparent'
                                if (line.startsWith('+')) { color = 'text-emerald-400'; bg = 'bg-emerald-950/30' }
                                if (line.startsWith('-')) { color = 'text-red-400'; bg = 'bg-red-950/30' }
                                if (line.startsWith('@@')) { color = 'text-cyan-400'; bg = 'bg-cyan-950/10' }
                                return <div key={i} className={`${color} ${bg} px-2 py-0.5 -mx-2`}>{line || ' '}</div>
                              })}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* WAF Manager Section */}
                <div className="bg-[#0b0f1f] border border-violet-800/30 rounded-2xl p-6 shadow-[0_0_40px_-15px_rgba(139,92,246,0.1)] relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wide"><Lock size={16} className="text-violet-400" /> Active WAF Defenses</h3>
                    </div>
                  </div>
                  {wafRules.length === 0 ? (
                    <div className="text-center py-12 text-white/20">
                      <Lock size={40} className="mx-auto mb-3 opacity-20 text-violet-400" />
                      <p className="text-sm font-medium">No active blocks.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {wafRules.map(r => (
                        <div key={r.id} className="flex flex-col bg-black/40 border border-violet-900/50 p-4 rounded-xl relative overflow-hidden group">
                           <div className="absolute inset-y-0 left-0 w-1 bg-violet-500/20 group-hover:bg-violet-500/50 transition-colors" />
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-violet-400 font-mono text-[9px] font-bold uppercase tracking-wider mb-1">Rule ID: {r.id}</p>
                              <p className="text-white text-sm font-medium">{r.description}</p>
                            </div>
                            <button onClick={() => removeWafRule(r.id)} className="px-3 py-1.5 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-lg border border-red-800/40 text-[10px] font-bold uppercase tracking-wider transition-colors">Revoke</button>
                          </div>
                          <div className="bg-red-950/20 border border-red-900/30 p-2 rounded-lg mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-red-500 font-bold uppercase shrink-0">Regex Match:</span>
                            <code className="text-[11px] text-red-300 font-mono truncate">{r.pattern}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ AI CHAT TAB ═══════════════ */}
          {activeTab === 'ai' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[#0b0f1f] border border-white/8 rounded-2xl flex flex-col h-[520px]">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">H-vision AI Swarm</p>
                    <p className="text-white/30 text-[11px]">Groq Llama3-70b · Multi-Agent Command Center</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm lg:max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed
                        ${m.role==='user' ? 'bg-cyan-600/80 text-white rounded-br-sm' : 'bg-white/5 border border-white/8 text-white/80 rounded-bl-sm'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/8 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                        {[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-white/5 flex gap-2">
                  <input className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500/40 transition-colors placeholder-white/20"
                    placeholder="Ask about vulnerabilities, MITRE techniques, remediations..."
                    value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendChat()} />
                  <button onClick={sendChat} disabled={chatLoading || !input.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white rounded-xl px-4 py-2.5 transition-colors">
                    <Send size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Agents:</span>
                  <button onClick={() => setInput('@ThreatHunter ')} className="text-xs bg-violet-900/30 text-violet-300 border border-violet-700/50 px-2 py-1 rounded hover:bg-violet-800/40">@ThreatHunter</button>
                  <button onClick={() => setInput('@Responder ')} className="text-xs bg-amber-900/30 text-amber-300 border border-amber-700/50 px-2 py-1 rounded hover:bg-amber-800/40">@Responder</button>
                  <button onClick={() => setInput('@Commander ')} className="text-xs bg-cyan-900/30 text-cyan-300 border border-cyan-700/50 px-2 py-1 rounded hover:bg-cyan-800/40">@Commander</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    '@ThreatHunter What anomalies did you find?',
                    '@Responder How do we patch the SQL Injection?',
                    '@Commander Give me an executive summary.',
                    'Generate a WAF rule for XSS',
                    'How does SSRF work?'
                  ].map((q, i) => (
                    <button key={i} onClick={() => setInput(q)}
                      className="text-[11px] bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:text-cyan-400 text-white/40 px-3 py-1.5 rounded-full transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ REPORTS TAB ═══════════════ */}
          {activeTab === 'reports' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">Security Reports</h3>
                  <p className="text-white/40 text-sm">Auto-generated incident reports with MITRE mapping</p>
                </div>
                <button onClick={generateReport} disabled={reportLoading}
                  className="flex items-center gap-2 bg-cyan-700/80 hover:bg-cyan-600/80 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors border border-cyan-600/30">
                  <FileText size={14} /> {reportLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
              {reports.length === 0 ? (
                <div className="text-center py-24 text-white/20">
                  <FileText size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium mb-1">No reports yet</p>
                  <p className="text-sm">Click "Generate Report" to create your first security report</p>
                </div>
              ) : reports.map((rep, i) => (
                <div key={i} className="bg-[#0b0f1f] border border-white/8 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-semibold text-sm">{rep.title}</h4>
                      <p className="text-white/30 text-xs mt-0.5 font-mono">{rep.id}</p>
                    </div>
                    <span className="text-[11px] bg-cyan-900/40 text-cyan-400 border border-cyan-800/30 px-2 py-0.5 rounded-lg font-semibold">HTML</span>
                  </div>
                  <div className="bg-black/40 rounded-xl p-4 text-sm text-white/70 max-h-52 overflow-auto border border-white/5"
                    dangerouslySetInnerHTML={{ __html: rep.content }} />
                </div>
              ))}
            </div>
          )}

          {/* ═══════════════ COMPLIANCE TAB ═══════════════ */}
          {activeTab === 'compliance' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><ShieldCheck size={22} className="text-emerald-400" /> Compliance & Risk Scoring Engine</h3>
                <p className="text-white/60 text-sm">Real-time OWASP Top 10 compliance status with automated security posture scoring.</p>
              </div>

              {compliance ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="col-span-2 bg-[#0b0f1f] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${compliance.security_posture_score >= 70 ? 'from-emerald-900/20 to-transparent' : compliance.security_posture_score >= 40 ? 'from-amber-900/20 to-transparent' : 'from-red-900/20 to-transparent'} pointer-events-none`} />
                      <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2 relative z-10">Security Posture</p>
                      <p className={`text-7xl font-black relative z-10 ${compliance.security_posture_score >= 70 ? 'text-emerald-400' : compliance.security_posture_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{compliance.security_posture_score}</p>
                      <p className="text-white/60 text-sm font-mono mt-1 relative z-10">/ 100</p>
                      <p className={`text-3xl font-black mt-2 relative z-10 ${compliance.security_posture_score >= 70 ? 'text-emerald-300' : compliance.security_posture_score >= 40 ? 'text-amber-300' : 'text-red-300'}`}>Grade: {compliance.grade}</p>
                    </div>
                    <StatCard icon={AlertOctagon} label="Critical" value={compliance.critical_vulns} gradient="bg-gradient-to-br from-red-900/40 to-red-950/60 border border-red-800/30" />
                    <StatCard icon={AlertTriangle} label="High" value={compliance.high_vulns} gradient="bg-gradient-to-br from-orange-900/40 to-orange-950/60 border border-orange-800/30" />
                    <StatCard icon={Shield} label="WAF Rules" value={compliance.active_waf_rules} gradient="bg-gradient-to-br from-violet-900/40 to-violet-950/60 border border-violet-800/30" />
                  </div>

                  <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6">
                    <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-400" /> OWASP Top 10 — 2021 Compliance Matrix</h4>
                    <div className="space-y-2">
                      {(compliance.owasp_top_10 || []).map((o: any) => (
                        <div key={o.code} className="flex items-center gap-4 p-3 rounded-xl bg-black/30 border border-white/5">
                          <span className="text-white/40 font-mono text-xs font-bold w-10">{o.code}</span>
                          <span className="text-white text-sm font-medium flex-1">{o.name}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                            o.status === 'PASSING' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' :
                            o.status === 'MITIGATED' ? 'bg-blue-900/40 text-blue-400 border border-blue-700/40' :
                            o.status === 'FAILING' ? 'bg-red-900/40 text-red-400 border border-red-700/40' :
                            'bg-white/5 text-white/30 border border-white/10'
                          }`}>{o.status === 'PASSING' ? '✅ Passing' : o.status === 'MITIGATED' ? '🛡️ Mitigated' : o.status === 'FAILING' ? '❌ Failing' : '⬜ Not Tested'}</span>
                          <span className="text-white/30 text-[10px] w-16 text-right">{o.vulnerabilities_found} vulns</span>
                          <span className="text-white/30 text-[10px] w-16 text-right">{o.waf_rules_active} rules</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-24 text-white/20">
                  <ShieldCheck size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-lg">Loading compliance data...</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ HONEYPOT TAB ═══════════════ */}
          {activeTab === 'honeypot' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-2xl p-6 shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><Bug size={22} className="text-amber-400" /> Honeypot Deception Network</h3>
                  <p className="text-white/60 text-sm">Deploy fake vulnerable endpoints to trap and profile attackers before they reach real assets.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-amber-950/50 border border-amber-800/40 rounded-xl px-4 py-2 flex flex-col items-center">
                    <span className="text-amber-400 text-xl font-bold">{honeypotStats?.active_endpoints ?? 10}</span>
                    <span className="text-amber-500/60 text-[9px] uppercase font-bold tracking-wider">Traps Set</span>
                  </div>
                  <div className="bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-2 flex flex-col items-center">
                    <span className="text-red-400 text-xl font-bold">{honeypotTraps.length}</span>
                    <span className="text-red-500/60 text-[9px] uppercase font-bold tracking-wider">Caught</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {['/admin','/wp-admin','/.env','/.git/config','/backup.sql','/phpmyadmin','/debug','/server-status','/config.json','/api/v1/users/export'].map(ep => (
                  <div key={ep} className="bg-[#0b0f1f] border border-amber-900/30 rounded-xl p-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-300/70 font-mono text-[10px] truncate">{ep}</span>
                  </div>
                ))}
              </div>

              {honeypotTraps.length === 0 ? (
                <div className="text-center py-16 text-white/20">
                  <Bug size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">Honeypots are armed and waiting...</p>
                  <p className="text-sm">No attackers have triggered any traps yet.</p>
                </div>
              ) : (
                <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6">
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">🍯 Trap Log ({honeypotTraps.length} events)</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {honeypotTraps.slice().reverse().map((t: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-amber-900/20">
                        <span className="text-lg">🍯</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold">{t.trap_type}</p>
                          <p className="text-white/40 text-[10px] font-mono truncate">{t.endpoint} — from {t.source_ip}</p>
                        </div>
                        <span className="text-red-400 text-[10px] font-bold bg-red-900/30 px-2 py-0.5 rounded border border-red-800/30">HIGH</span>
                        <span className="text-white/30 text-[10px] font-mono shrink-0">{t.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ WAF BUILDER TAB ═══════════════ */}
          {activeTab === 'waf_builder' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-violet-900/20 to-fuchsia-900/20 border border-violet-500/30 rounded-2xl p-6 shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><Fingerprint size={22} className="text-violet-400" /> Interactive WAF Rule Builder</h3>
                <p className="text-white/60 text-sm">Create custom firewall rules and deploy them to the live Sentinel Gateway in real-time.</p>
              </div>

              <div className="bg-[#0b0f1f] border border-violet-800/30 rounded-2xl p-6">
                <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Plus size={14} className="text-violet-400" /> Create New Rule</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Match Field</label>
                    <select value={newRuleField} onChange={e => setNewRuleField(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500/50">
                      <option value="url">URL Path</option>
                      <option value="body">Request Body</option>
                      <option value="header">HTTP Header</option>
                      <option value="query">Query Parameters</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Regex Pattern</label>
                    <input value={newRulePattern} onChange={e => setNewRulePattern(e.target.value)} placeholder="e.g. (?i)(union\\s+select|drop\\s+table)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-mono outline-none focus:border-violet-500/50 placeholder-white/20" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] uppercase tracking-wider font-bold block mb-1.5">Description</label>
                    <input value={newRuleDesc} onChange={e => setNewRuleDesc(e.target.value)} placeholder="Block SQL injection attempts"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500/50 placeholder-white/20" />
                  </div>
                </div>
                <button onClick={addWafRule} disabled={!newRulePattern.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-30 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-900/30">
                  <Zap size={14} /> Deploy Rule to Live Gateway
                </button>
              </div>

              <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6">
                <h4 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Shield size={14} className="text-violet-400" /> Active Gateway Rules ({wafRules.length})</h4>
                {wafRules.length === 0 ? (
                  <p className="text-white/20 text-sm text-center py-8">No active WAF rules. Create one above or let the AI generate them automatically.</p>
                ) : (
                  <div className="space-y-2">
                    {wafRules.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-violet-900/20 group">
                        <Lock size={14} className="text-violet-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold">{r.description}</p>
                          <p className="text-white/30 text-[10px] font-mono truncate">{r.id} — Pattern: {r.pattern}</p>
                        </div>
                        <button onClick={() => removeWafRule(r.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-900/30 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════ KILL CHAIN TAB ═══════════════ */}
          {activeTab === 'kill_chain' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-2xl p-6 shadow-[0_0_30px_-5px_rgba(239,68,68,0.15)]">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><Layers size={22} className="text-red-400" /> MITRE ATT&CK Kill Chain Visualization</h3>
                <p className="text-white/60 text-sm">Real-time mapping of all detected attacks to the 13-phase MITRE ATT&CK framework. Used by every Fortune 500 SOC.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {killChain.map((phase: any) => (
                  <div key={phase.id} className={`bg-[#0b0f1f] border rounded-2xl p-4 relative overflow-hidden transition-all ${
                    phase.status === 'BREACHED' ? 'border-red-600/50 shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]' :
                    phase.status === 'DEFENDED' ? 'border-emerald-600/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]' :
                    'border-white/10'
                  }`}>
                    <div className={`absolute top-0 left-0 w-full h-1 ${
                      phase.status === 'BREACHED' ? 'bg-red-500' :
                      phase.status === 'DEFENDED' ? 'bg-emerald-500' : 'bg-white/10'
                    }`} />
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{phase.icon}</span>
                        <div>
                          <p className="text-white font-bold text-xs">{phase.name}</p>
                          <p className="text-white/30 text-[9px] font-mono">{phase.tactic_id}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        phase.status === 'BREACHED' ? 'bg-red-900/40 text-red-400 border border-red-700/40' :
                        phase.status === 'DEFENDED' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40' :
                        'bg-white/5 text-white/30 border border-white/10'
                      }`}>{phase.status === 'NO_ACTIVITY' ? 'Clear' : phase.status}</span>
                    </div>
                    {phase.total_attacks > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-red-400">Attacks: {phase.total_attacks}</span>
                          <span className="text-emerald-400">Blocked: {phase.blocked}</span>
                        </div>
                        <div className="h-1.5 w-full bg-red-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${phase.total_attacks > 0 ? (phase.blocked / phase.total_attacks * 100) : 0}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {killChain.length === 0 && (
                <div className="text-center py-16 text-white/20">
                  <Layers size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-lg">Kill chain data will populate as attacks are detected.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ SOAR TAB ═══════════════ */}
          {activeTab === 'soar' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-sky-900/20 to-blue-900/20 border border-sky-500/30 rounded-2xl p-6 shadow-[0_0_30px_-5px_rgba(14,165,233,0.15)]">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><ClipboardList size={22} className="text-sky-400" /> SOAR — Automated Incident Response Playbooks</h3>
                <p className="text-white/60 text-sm">Security Orchestration, Automation & Response. Pre-built workflows that automatically respond to threats. Used by CrowdStrike, Splunk SOAR, and Palo Alto XSOAR.</p>
              </div>
              <div className="space-y-4">
                {soarPlaybooks.map((pb: any) => (
                  <div key={pb.id} className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold bg-sky-900/40 text-sky-400 border border-sky-700/40 px-2 py-0.5 rounded uppercase tracking-wider">{pb.id}</span>
                          <span className="text-[9px] font-bold bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 px-2 py-0.5 rounded uppercase tracking-wider">ENABLED</span>
                        </div>
                        <h4 className="text-white font-bold text-sm">{pb.name}</h4>
                        <p className="text-white/40 text-[10px] mt-0.5">Trigger: <span className="text-sky-400 font-mono">{pb.trigger}</span> • Severity: <span className="text-orange-400">{pb.severity_threshold}+</span></p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button onClick={() => executePlaybook(pb.id)} disabled={executingPb === pb.id}
                          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-900/30 disabled:opacity-50">
                          <Play size={12} /> {executingPb === pb.id ? 'Executing...' : 'Execute'}
                        </button>
                        {executedPbs[pb.id] && (
                          <span className="text-[10px] text-emerald-400 font-mono animate-pulse">{executedPbs[pb.id]}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-2">
                      {pb.steps.map((step: any, i: number) => (
                        <div key={i} className="flex items-center gap-1 shrink-0">
                          <div className="bg-black/40 border border-sky-900/30 rounded-lg px-3 py-2 min-w-[140px]">
                            <p className="text-sky-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">{step.action}</p>
                            <p className="text-white/50 text-[10px] leading-tight">{step.description.slice(0, 50)}...</p>
                            <p className="text-white/20 text-[8px] font-mono mt-1">{step.module}</p>
                          </div>
                          {i < pb.steps.length - 1 && <ChevronRight size={12} className="text-sky-700 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {soarPlaybooks.length === 0 && (
                <div className="text-center py-16 text-white/20">
                  <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-lg">Loading SOAR playbooks...</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ API DISCOVERY TAB ═══════════════ */}
          {activeTab === 'discovery' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-teal-900/20 to-cyan-900/20 border border-teal-500/30 rounded-2xl p-6 shadow-[0_0_30px_-5px_rgba(20,184,166,0.15)] flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><Scan size={22} className="text-teal-400" /> Attack Surface Discovery & API Inventory</h3>
                  <p className="text-white/60 text-sm">Automatically discover all accessible endpoints, check security headers, and map the target’s attack surface. Used by Tenable, Qualys, and BugCrowd.</p>
                </div>
                <button onClick={runDiscoveryScan} disabled={discoveryScanning}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-teal-900/30 shrink-0">
                  <Scan size={14} /> {discoveryScanning ? 'Scanning...' : 'Scan Target'}
                </button>
              </div>

              {discoveryResults ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={Globe} label="Endpoints Found" value={discoveryResults.endpoints_found} gradient="bg-gradient-to-br from-teal-900/40 to-teal-950/60 border border-teal-800/30" />
                    <StatCard icon={CheckCircle} label="Accessible" value={discoveryResults.accessible_endpoints} gradient="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border border-emerald-800/30" />
                    <StatCard icon={AlertTriangle} label="Missing Headers" value={discoveryResults.risk_summary?.missing_headers} gradient="bg-gradient-to-br from-orange-900/40 to-orange-950/60 border border-orange-800/30" />
                    <div className={`relative rounded-xl p-5 overflow-hidden border ${discoveryResults.risk_summary?.risk_level === 'CRITICAL' ? 'bg-gradient-to-br from-red-900/40 to-red-950/60 border-red-800/30' : 'bg-gradient-to-br from-amber-900/40 to-amber-950/60 border-amber-800/30'}`}>
                      <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest">Risk Level</p>
                      <p className={`text-3xl font-bold mt-1 ${discoveryResults.risk_summary?.risk_level === 'CRITICAL' ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>{discoveryResults.risk_summary?.risk_level}</p>
                    </div>
                  </div>

                  {discoveryResults.missing_security_headers?.length > 0 && (
                    <div className="bg-[#0b0f1f] border border-orange-800/30 rounded-2xl p-5">
                      <h4 className="text-orange-400 font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Missing Security Headers</h4>
                      <div className="flex flex-wrap gap-2">
                        {discoveryResults.missing_security_headers.map((h: string) => (
                          <span key={h} className="text-[10px] font-mono bg-orange-900/30 text-orange-300 border border-orange-700/40 px-2.5 py-1 rounded-lg">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {discoveryResults.technologies_detected?.length > 0 && (
                    <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-5">
                      <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Cpu size={14} className="text-teal-400" /> Technologies Detected</h4>
                      <div className="flex flex-wrap gap-2">
                        {discoveryResults.technologies_detected.map((t: string, i: number) => (
                          <span key={i} className="text-[10px] bg-teal-900/30 text-teal-300 border border-teal-700/40 px-2.5 py-1 rounded-lg">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-5">
                    <h4 className="text-white font-bold text-sm mb-3">Discovered Endpoints ({discoveryEndpoints.length})</h4>
                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
                      {discoveryEndpoints.map((ep: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-white/5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ep.status_code < 300 ? 'bg-emerald-900/40 text-emerald-400' :
                            ep.status_code < 400 ? 'bg-blue-900/40 text-blue-400' :
                            ep.status_code < 500 ? 'bg-orange-900/40 text-orange-400' :
                            'bg-red-900/40 text-red-400'
                          }`}>{ep.status_code}</span>
                          <span className="text-white/70 font-mono text-xs flex-1 truncate">{ep.path}</span>
                          <span className="text-white/20 text-[10px]">{ep.content_type?.split(';')[0]}</span>
                          <span className="text-white/20 text-[10px]">{(ep.content_length/1024).toFixed(1)}KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-white/20">
                  <Scan size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">Click "Scan Target" to discover the attack surface</p>
                  <p className="text-sm">The scanner will probe 50+ common paths, check security headers, and detect technologies.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ DARK WEB INTEL TAB ═══════════════ */}
          {activeTab === 'darkweb' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-slate-900/40 to-zinc-900/40 border border-slate-500/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><Skull size={22} className="text-slate-300" /> Dark Web Intelligence Monitor</h3>
                <p className="text-white/60 text-sm">Real-time credential leak detection and breach alerts from actual attack payloads. Powered by CrowdStrike/SpyCloud-grade analysis.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Skull} label="Credential Leaks" value={darkwebLeaks.length} gradient="bg-gradient-to-br from-slate-900/40 to-slate-950/60 border border-slate-800/30" />
                <StatCard icon={AlertTriangle} label="Breach Alerts" value={darkwebBreaches.length} gradient="bg-gradient-to-br from-red-900/40 to-red-950/60 border border-red-800/30" />
                <StatCard icon={Shield} label="Sources Monitored" value={darkwebSummary?.sources_monitored || 0} gradient="bg-gradient-to-br from-cyan-900/40 to-cyan-950/60 border border-cyan-800/30" />
                <div className={`relative rounded-xl p-5 overflow-hidden border ${darkwebSummary?.threat_level === 'CRITICAL' ? 'bg-gradient-to-br from-red-900/40 to-red-950/60 border-red-800/30' : 'bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border-emerald-800/30'}`}>
                  <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest">Threat Level</p>
                  <p className={`text-3xl font-bold mt-1 ${darkwebSummary?.threat_level === 'CRITICAL' ? 'text-red-400 animate-pulse' : darkwebSummary?.threat_level === 'HIGH' ? 'text-orange-400' : 'text-emerald-400'}`}>{darkwebSummary?.threat_level || 'LOW'}</p>
                </div>
              </div>
              {darkwebLeaks.length > 0 && (
                <div className="bg-[#0b0f1f] border border-slate-800/30 rounded-2xl p-5">
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Hash size={14} className="text-red-400" /> Credential Exposures ({darkwebLeaks.length})</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {darkwebLeaks.map((leak: any) => (
                      <div key={leak.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-red-900/20">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${leak.risk_level === 'CRITICAL' ? 'bg-red-900/40 text-red-400' : 'bg-orange-900/40 text-orange-400'}`}>{leak.risk_level}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold">{leak.credential_type}</p>
                          <p className="text-white/30 text-[10px] font-mono truncate">{leak.endpoint_targeted} — via {leak.attack_vector}</p>
                        </div>
                        <span className="text-white/20 text-[9px] font-mono">{leak.source}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded ${leak.status === 'RESOLVED' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>{leak.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {darkwebBreaches.length > 0 && (
                <div className="bg-[#0b0f1f] border border-red-800/30 rounded-2xl p-5">
                  <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Breach Alerts ({darkwebBreaches.length})</h4>
                  <div className="space-y-2">
                    {darkwebBreaches.slice(0, 10).map((b: any) => (
                      <div key={b.id} className="p-3 bg-red-950/20 rounded-xl border border-red-900/30">
                        <p className="text-white text-xs font-bold">{b.title}</p>
                        <p className="text-white/40 text-[10px] mt-1">{b.description}</p>
                        <p className="text-white/20 text-[9px] font-mono mt-1">IOC: {b.ioc_value} — Source: {b.source}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {darkwebLeaks.length === 0 && darkwebBreaches.length === 0 && (
                <div className="text-center py-16 text-white/20"><Skull size={48} className="mx-auto mb-3 opacity-20" /><p className="text-lg">Dark web monitoring active. Alerts will appear as attacks generate credential exposure data.</p></div>
              )}
            </div>
          )}

          {/* ═══════════════ THREAT HUNT TAB ═══════════════ */}
          {activeTab === 'hunt' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><Terminal size={22} className="text-emerald-400" /> Threat Hunting Query Console</h3>
                <p className="text-white/60 text-sm">Splunk-style query engine. Search across ALL real data: detections, events, honeypots, WAF rules, dark web leaks, and attack timeline.</p>
              </div>
              <div className="bg-[#0b0f1f] border border-emerald-800/30 rounded-2xl p-5">
                <div className="flex gap-2 mb-3">
                  <input value={huntQuery} onChange={e => setHuntQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runHuntQuery()}
                    placeholder="severity:critical AND type:sql_injection"
                    className="flex-1 bg-black/60 border border-emerald-900/30 rounded-xl px-4 py-3 text-emerald-400 font-mono text-sm outline-none focus:border-emerald-500/50 placeholder-white/20" />
                  <button onClick={runHuntQuery} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all"><Search size={16} /></button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['severity:critical','blocked:false','type:sql','endpoint:/admin','time:last_1h'].map(q => (
                    <button key={q} onClick={() => { setHuntQuery(q); }} className="text-[10px] bg-emerald-900/20 text-emerald-400 border border-emerald-800/30 px-2.5 py-1 rounded-lg hover:bg-emerald-900/40 transition-all">{q}</button>
                  ))}
                </div>
              </div>
              {huntStats && (
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(huntStats).filter(([k]) => k !== 'total_searchable').map(([k, v]) => (
                    <div key={k} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px]">
                      <span className="text-white/40">{k.replace(/_/g,' ')}: </span><span className="text-emerald-400 font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
              {huntResults && (
                <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-bold text-sm mb-1">Results: {huntResults.total} matches from {huntResults.sources_searched?.join(', ')}</h4>
                  <p className="text-white/30 text-[10px] mb-3 font-mono">Query: {huntResults.query} — {huntResults.execution_time_ms}ms</p>
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {huntResults.results?.slice(0, 100).map((r: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-white/5">
                        <span className="text-lg">{r._source_icon}</span>
                        <span className="text-[9px] bg-white/10 text-white/60 px-2 py-0.5 rounded font-mono">{r._source}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${r.severity === 'Critical' ? 'bg-red-900/40 text-red-400' : r.severity === 'High' ? 'bg-orange-900/40 text-orange-400' : 'bg-white/10 text-white/40'}`}>{r.severity || r.risk_level || '-'}</span>
                        <span className="text-white/60 text-xs flex-1 truncate">{r.rule_name || r.trap_type || r.credential_type || r.description || r.endpoint || '-'}</span>
                        <span className="text-white/20 text-[9px] font-mono">{r.event_path || r.endpoint || r.endpoint_targeted || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ EXECUTIVE METRICS TAB ═══════════════ */}
          {activeTab === 'executive' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-indigo-900/20 to-violet-900/20 border border-indigo-500/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><TrendingUp size={22} className="text-indigo-400" /> Executive Security Metrics — C-Suite Dashboard</h3>
                <p className="text-white/60 text-sm">MTTD, MTTR, Risk Score, Cost Avoidance — all calculated from real live detection data. The metrics CISOs present to the board.</p>
              </div>
              {executiveMetrics ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0b0f1f] border border-emerald-800/30 rounded-2xl p-5 text-center">
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">MTTD (Mean Time to Detect)</p>
                      <p className="text-4xl font-black text-emerald-400 mt-2">{executiveMetrics.mttd?.display}</p>
                      <p className="text-white/20 text-[9px] mt-1">{executiveMetrics.mttd?.benchmark}</p>
                    </div>
                    <div className="bg-[#0b0f1f] border border-cyan-800/30 rounded-2xl p-5 text-center">
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">MTTR (Mean Time to Respond)</p>
                      <p className="text-4xl font-black text-cyan-400 mt-2">{executiveMetrics.mttr?.display}</p>
                      <p className="text-white/20 text-[9px] mt-1">{executiveMetrics.mttr?.benchmark}</p>
                    </div>
                    <div className="bg-[#0b0f1f] border border-indigo-800/30 rounded-2xl p-5 text-center">
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Security Risk Score</p>
                      <p className={`text-4xl font-black mt-2 ${executiveMetrics.risk_score?.value >= 70 ? 'text-emerald-400' : executiveMetrics.risk_score?.value >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{executiveMetrics.risk_score?.value}<span className="text-lg text-white/30">/100</span></p>
                      <p className="text-white/30 text-sm font-bold">Grade: {executiveMetrics.risk_score?.grade}</p>
                    </div>
                    <div className="bg-[#0b0f1f] border border-green-800/30 rounded-2xl p-5 text-center">
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Estimated Cost Avoidance</p>
                      <p className="text-4xl font-black text-green-400 mt-2">{executiveMetrics.cost_avoidance?.display}</p>
                      <p className="text-white/20 text-[9px] mt-1">Based on IBM 2023 breach cost data</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={Activity} label="Detection Rate" value={`${executiveMetrics.detection_rate?.value}%`} gradient="bg-gradient-to-br from-blue-900/40 to-blue-950/60 border border-blue-800/30" />
                    <StatCard icon={Shield} label="Block Rate" value={`${executiveMetrics.block_rate?.value}%`} gradient="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border border-emerald-800/30" />
                    <StatCard icon={Zap} label="Attack Velocity" value={executiveMetrics.attack_velocity?.display} gradient="bg-gradient-to-br from-orange-900/40 to-orange-950/60 border border-orange-800/30" />
                    <StatCard icon={AlertTriangle} label="Total Events" value={executiveMetrics.summary?.total_events} gradient="bg-gradient-to-br from-slate-900/40 to-slate-950/60 border border-slate-800/30" />
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-white/20"><TrendingUp size={48} className="mx-auto mb-3 opacity-20" /><p className="text-lg">Loading executive metrics from live data...</p></div>
              )}
            </div>
          )}

          {/* ═══════════════ VULNERABILITY LIFECYCLE TAB ═══════════════ */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><RefreshCw size={22} className="text-amber-400" /> Vulnerability Lifecycle Tracker</h3>
                <p className="text-white/60 text-sm">Tracks every real vulnerability through 7 stages: Discovered → Triaged → Assigned → In Progress → Patched → Verified → Closed</p>
              </div>
              {lifecycleStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard icon={AlertCircle} label="Total Vulnerabilities" value={lifecycleStats.total} gradient="bg-gradient-to-br from-red-900/40 to-red-950/60 border border-red-800/30" />
                  <StatCard icon={Clock} label="Open" value={lifecycleStats.open} gradient="bg-gradient-to-br from-orange-900/40 to-orange-950/60 border border-orange-800/30" />
                  <StatCard icon={CheckCircle} label="Closed" value={lifecycleStats.closed} gradient="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 border border-emerald-800/30" />
                  <StatCard icon={TrendingUp} label="Closure Rate" value={`${lifecycleStats.closure_rate}%`} gradient="bg-gradient-to-br from-cyan-900/40 to-cyan-950/60 border border-cyan-800/30" />
                </div>
              )}
              {lifecycleBoard && (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                  {Object.values(lifecycleBoard.board || {}).map((col: any) => (
                    <div key={col.stage.id} className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-3 min-h-[200px]">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-sm">{col.stage.icon}</span>
                        <p className="text-white font-bold text-[10px] uppercase tracking-wider">{col.stage.name}</p>
                        <span className="ml-auto text-white/30 text-[10px] bg-white/10 px-1.5 rounded">{col.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {col.items.slice(0, 5).map((v: any) => (
                          <div key={v.id} className={`p-2 rounded-lg border cursor-pointer group ${v.severity === 'Critical' ? 'bg-red-950/20 border-red-900/30' : v.severity === 'High' ? 'bg-orange-950/20 border-orange-900/30' : 'bg-white/5 border-white/10'}`}>
                            <p className="text-white text-[10px] font-semibold truncate">{v.attack_type}</p>
                            <p className="text-white/30 text-[8px] font-mono truncate">{v.endpoint}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${v.severity === 'Critical' ? 'bg-red-900/40 text-red-400' : v.severity === 'High' ? 'bg-orange-900/40 text-orange-400' : 'bg-white/10 text-white/40'}`}>{v.severity}</span>
                              {v.stage !== 'closed' && <button onClick={() => advanceVuln(v.id)} className="opacity-0 group-hover:opacity-100 text-[8px] bg-cyan-900/30 text-cyan-400 px-1.5 py-0.5 rounded transition-all"><ArrowRight size={8} /></button>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!lifecycleBoard && (
                <div className="text-center py-16 text-white/20"><RefreshCw size={48} className="mx-auto mb-3 opacity-20" /><p className="text-lg">Vulnerability data will appear as attacks are detected.</p></div>
              )}
            </div>
          )}

          {/* ═══════════════ PEN TEST SCHEDULER TAB ═══════════════ */}
          {activeTab === 'pentest_scheduler' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-violet-900/20 to-fuchsia-900/20 border border-violet-500/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-3"><Calendar size={22} className="text-violet-400" /> Automated Penetration Test Scheduler</h3>
                <p className="text-white/60 text-sm">Schedule real penetration tests that fire actual attacks through the Sentinel proxy against the live target. Like Pentera and Horizon3.ai.</p>
              </div>
              <div className="bg-[#0b0f1f] border border-violet-800/30 rounded-2xl p-5">
                <h4 className="text-white font-bold text-sm mb-3">Create New Scheduled Test</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <input value={newScheduleName} onChange={e => setNewScheduleName(e.target.value)} placeholder="Test name..."
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500/50 placeholder-white/20" />
                  <select value={newScheduleFreq} onChange={e => setNewScheduleFreq(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
                    <option value="manual">Manual</option><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
                  </select>
                  <select value={newScheduleIntensity} onChange={e => setNewScheduleIntensity(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none">
                    <option value="light">Light</option><option value="standard">Standard</option><option value="aggressive">Aggressive</option>
                  </select>
                  <button onClick={createSchedule}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"><Plus size={14} /> Create</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['sql_injection','xss','path_traversal','command_injection','idor','auth_bypass','ssrf','nosql','jwt_attack'].map(cat => (
                    <button key={cat} onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${selectedCategories.includes(cat) ? 'bg-violet-900/40 text-violet-400 border-violet-700/40' : 'bg-white/5 text-white/30 border-white/10'}`}>{cat.replace(/_/g,' ')}</button>
                  ))}
                </div>
              </div>
              {schedules.length > 0 && (
                <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-bold text-sm mb-3">Active Schedules ({schedules.length})</h4>
                  <div className="space-y-2">
                    {schedules.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-violet-900/20">
                        <Calendar size={14} className="text-violet-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold">{s.name}</p>
                          <p className="text-white/30 text-[10px] font-mono">{s.id} — {s.frequency} — {s.intensity} — {s.total_payloads} payloads — {s.total_runs} runs</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${s.status === 'ACTIVE' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-white/10 text-white/30'}`}>{s.status}</span>
                        <button onClick={() => runScheduleNow(s.id)} className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"><Play size={10} /> Run Now</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {scheduleHistory.length > 0 && (
                <div className="bg-[#0b0f1f] border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-bold text-sm mb-3">Run History ({scheduleHistory.length})</h4>
                  <div className="space-y-2">
                    {scheduleHistory.map((r: any) => (
                      <div key={r.id} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${r.result === 'PASS' ? 'bg-emerald-900/40 text-emerald-400' : r.result === 'FAIL' ? 'bg-red-900/40 text-red-400' : 'bg-amber-900/40 text-amber-400'}`}>{r.result}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold">{r.schedule_name}</p>
                          <p className="text-white/30 text-[10px]">{r.attacks_fired} attacks — {r.attacks_blocked} blocked ({r.block_rate}%) — {r.new_findings} new findings</p>
                        </div>
                        <span className="text-white/20 text-[9px] font-mono">{r.started_at}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ═══════════════ SYSTEM OVERVIEW & ARCHITECTURE MODAL ═══════════════ */}
      {showCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCredits(false)}>
          <div className="bg-[#0b0f1f] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/50">
                      <Eye size={20} className="text-white" />
                    </div>
                    H-VISION
                  </h2>
                  <p className="text-white/40 text-sm mt-1">Enterprise Autonomous Security Operations Center</p>
                </div>
                <button onClick={() => setShowCredits(false)} className="text-white/30 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/20 rounded-2xl p-6 mb-6">
                <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Platform Overview</p>
                <h3 className="text-white text-2xl font-bold mb-2">Autonomous Cyber Defense Architecture</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Engineered to deliver continuous adversarial simulation, multi-agent LLM reasoning, and real-time self-healing WAF defense across enterprise cloud infrastructure.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-bold text-sm mb-3">System Architecture</h4>
                  <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"/> FastAPI High-Performance Backend</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> React + TypeScript Frontend Core</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"/> Multi-Agent AI (Red/Blue/Green)</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> RAG + ChromaDB Intelligence Engine</li>
                  </ul>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-bold text-sm mb-3">Enterprise Capabilities</h4>
                  <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> MITRE ATT&CK Kill Chain</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> SOAR Automated Playbooks</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"/> Real-time API Surface Discovery</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/> OWASP Top 10 Compliance Engine</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 text-center text-white/30 text-[10px] font-mono">
                H-VISION OS v2.0 • ALL RIGHTS RESERVED • ENTERPRISE DEFENSIVE OPERATIONS
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
