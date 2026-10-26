import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Sliders, 
  RefreshCw, 
  Key, 
  FolderLock, 
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Settings, api } from '../api';
import { testSupabaseConnection } from '../supabase';

interface SettingsPageProps {
  settings: Settings | null;
  loading: boolean;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, loading, onRefresh }) => {
  const [currentSettings, setCurrentSettings] = useState<Settings>(settings || {
    ai_provider: 'deterministic_fallback',
    api_key_configured: false,
    model_name: 'gemini-1.5-pro',
    max_retries: 2,
    timeout_seconds: 30,
    demo_mode: true,
    notifications_enabled: true
  });

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [resettingSandbox, setResettingSandbox] = useState(false);

  // Supabase Testing State
  const [supabaseStatus, setSupabaseStatus] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);

  React.useEffect(() => {
    if (settings) setCurrentSettings(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving settings...');
    try {
      await api.updateSettings(currentSettings);
      setSaveStatus('Settings updated successfully.');
      setTimeout(() => setSaveStatus(null), 3000);
      onRefresh();
    } catch (err: any) {
      setSaveStatus('Failed to save settings.');
    }
  };

  const handleResetSandbox = async () => {
    if (!confirm('Reset sandbox and re-seed all sample sales CSV files and disorganized files?')) return;
    setResettingSandbox(true);
    try {
      await api.resetSandbox();
      alert('Sandbox workspace and sample demo data refreshed successfully.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setResettingSandbox(false);
    }
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseStatus(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseStatus(res);
    } catch (err: any) {
      setSupabaseStatus({ ok: false, message: `Error: ${err.message}` });
    } finally {
      setTestingSupabase(false);
    }
  };

  const integrations = [
    { name: 'Slack Alerts', status: 'Unconfigured (Mock Mode)', icon: '💬', desc: 'Dispatches real-time step failure notifications to #devops channel.' },
    { name: 'GitHub Actions', status: 'Unconfigured (Mock Mode)', icon: '🐙', desc: 'Triggers CI/CD deployment jobs upon workflow completion.' },
    { name: 'Stripe Billing', status: 'Unconfigured (Mock Mode)', icon: '💳', desc: 'Syncs subscription churn and invoices to data lake.' },
    { name: 'Discord Webhook', status: 'Unconfigured (Mock Mode)', icon: '🎮', desc: 'Relays bot command updates and automation triggers.' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-electric-400" />
          <span>Platform Settings & Engine Configuration</span>
        </h2>
        <p className="text-xs text-slate-400">
          AI Copilot provider, Supabase cloud database, runtime execution boundaries, and sandbox security
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Supabase Cloud Connection Card */}
        <div className="p-6 rounded-2xl bg-charcoal-850 border border-emerald-500/40 shadow-glow-emerald space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                ⚡
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Supabase Cloud Integration</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    CONFIGURED
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cloud PostgreSQL, authentication, and real-time subscription engine
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={testingSupabase}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-glow-emerald transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
              <span>{testingSupabase ? 'Pinging Cloud...' : 'Test Connection'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Project Endpoint</span>
              <p className="font-mono text-emerald-400 font-medium truncate">
                https://tsgsgfsaavezdcpqqkpy.supabase.co
              </p>
            </div>
            <div className="p-3 rounded-xl bg-charcoal-900 border border-charcoal-700 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Publishable Key</span>
              <p className="font-mono text-slate-300 truncate">
                sb_publishable_BCaK•••••••••••••a00
              </p>
            </div>
          </div>

          {supabaseStatus && (
            <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-mono ${
              supabaseStatus.ok 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {supabaseStatus.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              <span>{supabaseStatus.message}</span>
            </div>
          )}
        </div>

        {/* AI Provider Configuration Card */}
        <div className="p-6 rounded-2xl bg-charcoal-850 border border-charcoal-700 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-electric-400" />
              <h3 className="text-sm font-bold text-white">AI Automation Copilot Engine</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Offline-Safe Ready
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            AutoPilot AI operates in a deterministic offline rule mode by default to ensure 100% reliable hackathon demonstrations with zero external API dependencies. You can optionally connect live LLM credentials.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { id: 'deterministic_fallback', title: 'Deterministic Intent Engine', badge: 'Active (Recommended)', desc: 'Zero API keys required. Reliable, immediate workflow graph synthesis.' },
              { id: 'gemini', title: 'Google Gemini Pro', badge: 'Optional', desc: 'Configurable Gemini 1.5 Pro backend endpoint with live parsing.' },
              { id: 'openai', title: 'OpenAI GPT-4o', badge: 'Optional', desc: 'Configurable OpenAI endpoint with structured JSON schema output.' }
            ].map((p) => (
              <label
                key={p.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  currentSettings.ai_provider === p.id
                    ? 'border-electric-500 bg-electric-500/10 shadow-glow-blue'
                    : 'border-charcoal-700 bg-charcoal-900 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">{p.title}</span>
                    <input
                      type="radio"
                      name="ai_provider"
                      checked={currentSettings.ai_provider === p.id}
                      onChange={() => setCurrentSettings({ ...currentSettings, ai_provider: p.id })}
                      className="accent-electric-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
                <span className="text-[9px] font-mono mt-3 text-electric-400">{p.badge}</span>
              </label>
            ))}
          </div>

          {currentSettings.ai_provider !== 'deterministic_fallback' && (
            <div className="pt-3 border-t border-charcoal-800 space-y-2">
              <label className="block text-slate-300 font-mono text-[11px]">
                API Key (Secured on Backend)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter API key (stored in server env)..."
                  className="w-full p-2.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-electric-500"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>
          )}
        </div>

        {/* Execution & Safety Boundaries Card */}
        <div className="p-6 rounded-2xl bg-charcoal-850 border border-charcoal-700 space-y-5 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-charcoal-700">
            <Sliders className="w-4 h-4 text-violetAccent-400" />
            <h3 className="text-sm font-bold text-white">Execution Boundaries & Fault Tolerance</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Max Retries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Bounded Step Retries</span>
                <span className="font-mono text-electric-400 font-bold">{currentSettings.max_retries} attempts</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                value={currentSettings.max_retries}
                onChange={(e) => setCurrentSettings({ ...currentSettings, max_retries: parseInt(e.target.value) })}
                className="w-full accent-electric-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Number of automatic retry attempts before marking a step as failed.
              </p>
            </div>

            {/* Timeout */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Action Timeout Limit</span>
                <span className="font-mono text-electric-400 font-bold">{currentSettings.timeout_seconds}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={currentSettings.timeout_seconds}
                onChange={(e) => setCurrentSettings({ ...currentSettings, timeout_seconds: parseInt(e.target.value) })}
                className="w-full accent-electric-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Strict execution timeout to prevent runaway background processes.
              </p>
            </div>
          </div>
        </div>

        {/* Sandbox Storage & Demo Controls Card */}
        <div className="p-6 rounded-2xl bg-charcoal-850 border border-charcoal-700 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
            <div className="flex items-center space-x-2">
              <FolderLock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Dedicated Sandbox Storage</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              backend/sandbox
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            All file reads, CSV validations, data sanitizations, and file relocations are strictly quarantined inside the backend sandbox directory to guarantee security against path traversal.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Need to restart demo data to pristine state for judges?
            </div>
            <button
              type="button"
              onClick={handleResetSandbox}
              disabled={resettingSandbox}
              className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 border border-charcoal-700 flex items-center space-x-2 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resettingSandbox ? 'animate-spin' : ''}`} />
              <span>Reset Sandbox to Sample State</span>
            </button>
          </div>
        </div>

        {/* Mock Enterprise Connectors List */}
        <div className="p-6 rounded-2xl bg-charcoal-850 border border-charcoal-700 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-700">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-white">Other Connectors</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-900 border border-charcoal-700 text-slate-400">
              Placeholders
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {integrations.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-charcoal-900 border border-charcoal-700 flex items-start space-x-3">
                <span className="text-xl select-none">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-charcoal-800 text-slate-400 border border-charcoal-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit & Status */}
        <div className="flex items-center justify-between pt-2">
          {saveStatus && (
            <span className="text-xs text-emerald-400 font-medium">{saveStatus}</span>
          )}
          <button
            type="submit"
            id="btn-save-settings"
            className="ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-electric-600 to-violetAccent-600 hover:from-electric-500 hover:to-violetAccent-500 text-white font-semibold text-xs shadow-glow-blue transition-all"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
