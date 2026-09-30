import { useState, useEffect } from 'react';
import {
  Send,
  Terminal,
  Copy,
  Check,
  ShieldCheck,
  Code,
  Clock,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.js';
import { ApiEndpointSpec, User } from '../types/index.js';

interface ApiExplorerViewProps {
  currentUser: User | null;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function ApiExplorerView({ currentUser, onNotify }: ApiExplorerViewProps) {
  const [endpoints, setEndpoints] = useState<ApiEndpointSpec[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointSpec | null>(null);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [path, setPath] = useState('/api/health');
  const [includeAuth, setIncludeAuth] = useState(true);
  const [bodyText, setBodyText] = useState('');
  const [sending, setSending] = useState(false);
  const [responseResult, setResponseResult] = useState<any>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    api.getApiSpec().then((spec) => {
      setEndpoints(spec.endpoints);
      if (spec.endpoints.length > 0) {
        selectEndpoint(spec.endpoints[0]);
      }
    });
  }, []);

  const selectEndpoint = (ep: ApiEndpointSpec) => {
    setSelectedEndpoint(ep);
    setMethod(ep.method);
    setPath(ep.path);
    setIncludeAuth(ep.auth);
    if (ep.body) {
      setBodyText(JSON.stringify(ep.body, null, 2));
    } else {
      setBodyText('');
    }
    setResponseResult(null);
  };

  const handleSend = async () => {
    setSending(true);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = api.getToken();
    if (includeAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await api.executeRawRequest(path, method, headers, bodyText);
      setResponseResult(res);
      if (res.ok) {
        onNotify('success', `HTTP ${res.status}`, `${method} ${path} completed in ${res.durationMs}ms`);
      } else {
        onNotify('error', `HTTP ${res.status || 'Failed'}`, res.statusText || 'Request failed');
      }
    } catch (err: any) {
      onNotify('error', 'Execution Error', err.message);
    } finally {
      setSending(false);
    }
  };

  const generateCurl = () => {
    const token = api.getToken();
    let curl = `curl -X ${method} "${window.location.origin}${path}" \\\n  -H "Content-Type: application/json"`;
    if (includeAuth && token) {
      curl += ` \\\n  -H "Authorization: Bearer ${token.substring(0, 20)}..."`;
    }
    if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText.trim()) {
      curl += ` \\\n  -d '${bodyText.replace(/\n/g, ' ')}'`;
    }
    return curl;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
    onNotify('info', 'cURL Copied', 'Command copied to clipboard.');
  };

  const handleCopyResponse = () => {
    if (!responseResult) return;
    navigator.clipboard.writeText(JSON.stringify(responseResult.data, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
    onNotify('info', 'JSON Copied', 'Response payload copied.');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-base">Interactive REST API Playground</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test and inspect all backend endpoints in real-time. Bearer JWT tokens are auto-injected from your active
            session.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-400">Token Status:</span>
            {api.getToken() ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active ({currentUser?.role || 'user'})
              </span>
            ) : (
              <span className="text-amber-400 font-medium">None (Public Only)</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Endpoints Catalog */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col max-h-[700px]">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Available Endpoints ({endpoints.length})
          </h3>
          <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
            {endpoints.map((ep, idx) => {
              const isSelected = selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method;
              return (
                <button
                  key={`${ep.method}-${ep.path}-${idx}`}
                  onClick={() => selectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/50 border-indigo-500/50 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'GET'
                          ? 'bg-blue-500/20 text-blue-400'
                          : ep.method === 'POST'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : ep.method === 'PUT'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs truncate">{ep.path}</span>
                  </div>
                  {ep.auth && (
                    <span className="text-[10px] text-slate-500 shrink-0 ml-1" title="Requires Authentication">
                      🔒
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Request & Response Workbench */}
        <div className="lg:col-span-8 space-y-4">
          {/* Request Configuration Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Method Selector */}
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              {/* Endpoint Path Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="/api/..."
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Request
              </button>
            </div>

            {/* Options Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={includeAuth}
                  onChange={(e) => setIncludeAuth(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <span>Attach Bearer JWT Authorization Header</span>
              </label>

              <button
                onClick={handleCopyCurl}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy cURL</span>
              </button>
            </div>

            {/* Request Body (for POST/PUT) */}
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>JSON Request Payload:</span>
                  {selectedEndpoint?.body && (
                    <button
                      type="button"
                      onClick={() => setBodyText(JSON.stringify(selectedEndpoint.body, null, 2))}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Reset to Example Body
                    </button>
                  )}
                </label>
                <textarea
                  rows={5}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  placeholder='{ "key": "value" }'
                />
              </div>
            )}
          </div>

          {/* Response Console */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Response Inspector</h4>
                {responseResult && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                        responseResult.status >= 200 && responseResult.status < 300
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : responseResult.status >= 400
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {responseResult.status} {responseResult.statusText}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {responseResult.durationMs} ms
                    </span>
                  </div>
                )}
              </div>

              {responseResult && (
                <button
                  onClick={handleCopyResponse}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  {copiedResponse ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedResponse ? 'Copied' : 'Copy Response'}</span>
                </button>
              )}
            </div>

            <div className="relative">
              <pre className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-96">
                {responseResult ? (
                  JSON.stringify(responseResult.data, null, 2)
                ) : (
                  <span className="text-slate-600 italic">
                    // Click "Send Request" above to execute and view the live JSON response
                  </span>
                )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
