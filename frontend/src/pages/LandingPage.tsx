import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Zap,
  Bell,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Clock,
  Lock,
  Users,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Interactive Live Sandbox Widget State
  const [demoStatus, setDemoStatus] = useState<'UP' | 'DOWN'>('UP');
  const [demoLatency, setDemoLatency] = useState(38);
  const [demoStatusCode, setDemoStatusCode] = useState(200);
  const [isPinging, setIsPinging] = useState(false);
  const [activeCheckCount, setActiveCheckCount] = useState(14820);
  const [simulatedHeartbeats, setSimulatedHeartbeats] = useState<Array<'UP' | 'DOWN'>>([
    'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP',
    'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP',
    'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP', 'UP',
  ]);

  // Live counter animation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCheckCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateOutage = () => {
    setDemoStatus('DOWN');
    setDemoStatusCode(502);
    setDemoLatency(2450);
    setSimulatedHeartbeats((prev) => [...prev.slice(1), 'DOWN']);
  };

  const handleHealService = () => {
    setDemoStatus('UP');
    setDemoStatusCode(200);
    setDemoLatency(34 + Math.floor(Math.random() * 15));
    setSimulatedHeartbeats((prev) => [...prev.slice(1), 'UP']);
  };

  const handleTriggerProbe = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      if (demoStatus === 'UP') {
        const jitter = 28 + Math.floor(Math.random() * 25);
        setDemoLatency(jitter);
        setSimulatedHeartbeats((prev) => [...prev.slice(1), 'UP']);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-sky-500/10 blur-[140px] rounded-full" />
        <div className="absolute top-96 -left-40 w-[500px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full" />
        <div className="absolute top-[800px] -right-40 w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PulseWatch
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold uppercase tracking-wider">
                v2.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">
              Features
            </a>
            <a href="#sandbox" className="hover:text-slate-100 transition-colors">
              Interactive Demo
            </a>
            <a href="#architecture" className="hover:text-slate-100 transition-colors">
              Architecture
            </a>
            <a href="#security" className="hover:text-slate-100 transition-colors">
              Security & RBAC
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-xs font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 space-y-24 pb-24">
        {/* Hero Section */}
        <section className="pt-16 md:pt-24 px-6 max-w-5xl mx-auto text-center space-y-8">
          {/* Floating Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-slate-200">Synthetic Prober Live</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-400 font-mono">
              {activeCheckCount.toLocaleString()} checks completed today
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.12]">
              Website & API Monitoring{' '}
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                That Never Sleeps.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
              Detect outages in seconds, not hours. PulseWatch pings your websites, microservices, and APIs with 30-second interval checks, SSL certificate alerts, and zero-false-alarm incident management.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Start Monitoring in 60s</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Instant Demo Access</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">99.99% Precision</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">30s Interval Checks</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">SSL Expiry Radar</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Zero False Alarms</span>
            </div>
          </div>
        </section>

        {/* SECTION: Interactive Live Sandbox Widget */}
        <section id="sandbox" className="px-6 max-w-5xl mx-auto">
          <div className="p-1 rounded-3xl bg-gradient-to-b from-sky-500/20 via-slate-800 to-slate-900 shadow-2xl">
            <div className="rounded-[22px] bg-slate-900/95 border border-slate-800/80 p-6 md:p-8 space-y-6">
              {/* Widget Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                    <h2 className="text-base font-bold text-slate-100">Interactive Prober Simulator</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Test the real-time state machine right here. Trigger simulated outages and observe instant state transitions.
                  </p>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleTriggerProbe}
                    disabled={isPinging}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-sky-400' : ''}`} />
                    <span>Ping Now</span>
                  </button>

                  {demoStatus === 'UP' ? (
                    <button
                      onClick={handleSimulateOutage}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Simulate Outage</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleHealService}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Heal Service</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Simulated Monitor Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Status Dot */}
                    <div className="relative flex h-3.5 w-3.5 shrink-0">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          demoStatus === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                          demoStatus === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">Production Payment API Gateway</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          POST
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            demoStatus === 'UP'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {demoStatus}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        https://api.acme-corp.com/v1/payments/charge
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Numbers */}
                  <div className="flex items-center gap-6 self-start sm:self-auto">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Response Code</div>
                      <div
                        className={`text-sm font-bold font-mono ${
                          demoStatus === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        HTTP {demoStatusCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Latency</div>
                      <div
                        className={`text-sm font-bold font-mono ${
                          demoLatency > 500 ? 'text-rose-400' : 'text-sky-400'
                        }`}
                      >
                        {demoLatency}ms
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segmented Heartbeats Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Live 30-Check Segmented Activity Stream</span>
                    <span className="text-slate-500">Auto-refreshing</span>
                  </div>
                  <div className="flex items-center gap-1 h-6">
                    {simulatedHeartbeats.map((st, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-full rounded-sm transition-all ${
                          st === 'UP'
                            ? 'bg-emerald-500/80 hover:bg-emerald-400'
                            : 'bg-rose-500 hover:bg-rose-400 animate-pulse'
                        }`}
                        title={`Check #${idx + 1}: ${st}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Dynamic Incident Notification Toast preview */}
                {demoStatus === 'DOWN' && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        <strong>Incident #INC-921 Dispatched:</strong> HTTP 502 Bad Gateway detected. Email alert sent to on-call engineers.
                      </span>
                    </div>
                    <button
                      onClick={handleHealService}
                      className="px-2.5 py-1 bg-rose-500 text-white rounded-lg font-bold text-[11px] hover:bg-rose-400 transition-colors shrink-0"
                    >
                      Resolve Incident
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Features Bento Grid */}
        <section id="features" className="px-6 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100">
              Everything Needed for Production Uptime
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              From granular TLS validation to auto-resolving incident workflows, engineered to solve real DevOps pain points.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Millisecond Latency Telemetry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Probe response times with high-precision metrics. Interactive Recharts graphs display p50, p95, and p99 performance curves over 24h, 7d, and 30d.
              </p>
            </div>

            {/* Bento Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">SSL / TLS Expiry Radar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects to port 443 during probes to inspect peer TLS certificates. Calculates remaining validity days and notifies teams well before certificates expire.
              </p>
            </div>

            {/* Bento Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Flapping Protection Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents alarm fatigue from transient routing jitter. Uses state machine thresholds to confirm genuine outages before alerting engineers.
              </p>
            </div>

            {/* Bento Card 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Automated Incident Life-Cycle</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Auto-generates incident diagnostics upon downtime, tracks duration, and auto-resolves with recovery alert emails once the service is verified healthy.
              </p>
            </div>

            {/* Bento Card 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Team RBAC Workspaces</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Invite teammates with hierarchical roles (Owner, Admin, Member, Viewer). Manage credentials and permissions cleanly across your organization.
              </p>
            </div>

            {/* Bento Card 6 */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-100">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every monitor creation, pause, role modification, and authentication is captured with timestamp, user identity, and IP address for full compliance.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: Global Edge Simulation Network */}
        <section id="architecture" className="px-6 max-w-5xl mx-auto">
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                Synthetic Edge Nodes
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                Continuous Reliability Across Global Networks
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                PulseWatch verifies target availability from low-latency endpoints, catching regional DNS issues and localized outages.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              {[
                { city: 'Frankfurt, DE', region: 'eu-central-1', ping: '24ms' },
                { city: 'N. Virginia, US', region: 'us-east-1', ping: '18ms' },
                { city: 'Singapore, SG', region: 'ap-southeast-1', ping: '31ms' },
                { city: 'Mumbai, IN', region: 'ap-south-1', ping: '12ms' },
              ].map((loc, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{loc.city}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">{loc.region}</div>
                  <div className="text-xs font-mono font-bold text-sky-400">{loc.ping} avg</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="px-6 max-w-4xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-slate-900 border border-sky-500/20 space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
              Ready to eliminate unmonitored outages?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Join development teams using PulseWatch to maintain uninterrupted uptime and instant incident recovery.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2"
              >
                <span>Get Started in 60 Seconds</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm transition-colors"
              >
                Sign In with Demo Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-semibold text-slate-400">
          <Activity className="w-4 h-4 text-sky-400" />
          <span>PulseWatch SaaS</span>
          <span>•</span>
          <span>Website & API Monitoring Platform</span>
        </div>
        <p>© 2026 PulseWatch Inc. Production-grade distributed synthetics monitoring.</p>
      </footer>
    </div>
  );
};
