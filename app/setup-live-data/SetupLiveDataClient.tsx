'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';

interface ProviderEntry {
  name: string;
  configured: boolean;
  missingEnvVars: string[];
}

interface DebugResponse {
  summary: { total: number; configured: number; notConfigured: number };
  byCategory: Record<string, ProviderEntry[]>;
}

export function SetupLiveDataClient() {
  const [status, setStatus] = useState<DebugResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const serpConfigured = status?.byCategory?.parts?.find(
    p => p.name === 'SerpApi Shopping',
  )?.configured ?? false;

  function loadStatus() {
    setStatusLoading(true);
    fetch('/api/debug/providers')
      .then(r => r.json())
      .then((d: DebugResponse) => setStatus(d))
      .catch(() => setStatus(null))
      .finally(() => setStatusLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadStatus(); }, []);

  async function handleSave() {
    const key = inputRef.current?.value?.trim() ?? '';
    if (!key) { setSaveError('Paste your SerpApi key first.'); return; }

    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/debug/save-env-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json() as { saved?: boolean; message?: string; error?: string };

      if (!res.ok || !data.saved) {
        setSaveError(data.error ?? 'Save failed.');
        return;
      }

      // Clear the input immediately — never hold the key in state
      if (inputRef.current) inputRef.current.value = '';
      setSaved(true);
      setShowInput(false);
    } catch {
      setSaveError('Network error — is the dev server running?');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] py-10 px-6">
      <div className="max-w-xl mx-auto space-y-6">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white">Live Data Setup</h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect your API keys to enable live parts search and price comparison.
            Keys are saved only to your local machine — never sent to any server.
          </p>
        </div>

        {/* SerpApi status card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">SerpApi</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Powers parts search, store search, and review signals.
                Free plan: 100 searches/month — no credit card required.
              </p>
            </div>
            {statusLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            ) : serpConfigured ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                <XCircle className="h-4 w-4" /> Not connected
              </span>
            )}
          </div>

          {saved ? (
            <div className="rounded-xl bg-emerald-950 border border-emerald-700 px-4 py-3 text-sm text-emerald-300 font-medium">
              Key saved. Restart the dev server, then test Find Parts again.
            </div>
          ) : (
            <>
              {!showInput && !serpConfigured && (
                <button
                  type="button"
                  onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
                >
                  Paste SerpApi key
                </button>
              )}

              {showInput && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Get your key at{' '}
                    <a
                      href="https://serpapi.com/manage-api-key"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 underline"
                    >
                      serpapi.com/manage-api-key
                    </a>
                    . Paste it below — it will be saved only to{' '}
                    <code className="text-slate-300">.env.local</code> on your machine.
                  </p>

                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={revealed ? 'text' : 'password'}
                      placeholder="Paste key here…"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setRevealed(r => !r)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {saveError && (
                    <p className="text-xs text-red-400">{saveError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                    >
                      {saving ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                        </span>
                      ) : (
                        'Save key locally'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowInput(false); setSaveError(null); if (inputRef.current) inputRef.current.value = ''; }}
                      className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Provider status */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3">
          <p className="text-white font-semibold">Provider Status</p>
          {statusLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking…
            </div>
          ) : status ? (
            <>
              <p className="text-sm text-slate-400">
                {status.summary.configured} of {status.summary.total} providers connected.
              </p>
              <div className="space-y-1.5">
                {(['parts', 'store', 'reviews'] as const).flatMap(cat =>
                  (status.byCategory[cat] ?? []).map(p => (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{p.name}</span>
                      {p.configured ? (
                        <span className="text-emerald-400 font-medium">✓ Connected</span>
                      ) : (
                        <span className="text-slate-500">
                          Missing: {p.missingEnvVars.join(', ')}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-red-400">Could not load provider status.</p>
          )}

          <button
            type="button"
            onClick={loadStatus}
            className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold transition-colors"
          >
            Refresh status
          </button>
        </div>

        {/* What to do next */}
        <div className="text-xs text-slate-500 space-y-1 leading-relaxed">
          <p className="font-semibold text-slate-400">After saving a key:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Stop the dev server (Ctrl+C in the terminal)</li>
            <li>Run <code className="text-slate-300">npm run dev</code> again</li>
            <li>Come back here and click &quot;Refresh status&quot; — it should show Connected</li>
            <li>Go back to your device report and click Find Parts</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
