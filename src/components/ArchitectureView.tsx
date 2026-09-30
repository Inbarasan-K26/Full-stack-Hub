import { useState } from 'react';
import {
  Server,
  Layers,
  Shield,
  Database,
  Cpu,
  Terminal,
  FileCode,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface ArchitectureViewProps {
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function ArchitectureView({ onNotify }: ArchitectureViewProps) {
  const [activeTab, setActiveTab] = useState<'diagram' | 'docker' | 'security' | 'env'>('diagram');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
    onNotify('info', 'Copied to Clipboard', `${label} copied.`);
  };

  const dockerComposeCode = `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: fullstack-hub-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=production-secure-random-token-secret-change-me
    volumes:
      - app_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  app_data:`;

  const envExampleCode = `# Environment Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Cryptographic Token Secret (32+ random characters)
JWT_SECRET="fullstack-nexus-production-secret-key-987654321"

# Client Base URL
APP_URL="http://localhost:3000"
`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Full-Stack System Architecture</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production blueprint detailing service composition, container orchestration, token cryptography, and
              database layer.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800/80 pt-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'diagram'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Interactive Diagram
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'docker'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Docker Compose
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Security & Cryptography
          </button>

          <button
            onClick={() => setActiveTab('env')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'env'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Environment Variables
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'diagram' && (
        <div className="space-y-6">
          {/* Visual Architecture Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Client Tier */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-3">
                <Layers className="w-4 h-4" />
                Frontend Client (SPA)
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  React 19 + TypeScript + Vite
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Tailwind CSS (utility-first system)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Dynamic Kanban & Table CRUD views
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Built-in Interactive API Explorer
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                Port: 3000 (Internal Vite Middleware)
              </div>
            </div>

            {/* Box 2: Server Tier */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
                <Server className="w-4 h-4" />
                Backend REST Engine
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Express 4.21 + tsx on Node.js 22
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Auth router (/api/auth/*)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Resource router (/api/items/*)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Telemetry & OpenAPI specs (/api/*)
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                Host: 0.0.0.0:3000 (HTTP/JSON)
              </div>
            </div>

            {/* Box 3: Data & Security Tier */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
                <Database className="w-4 h-4" />
                Database & Security
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  PBKDF2 SHA-512 password hashing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  HMAC-SHA256 JWT access tokens
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Persistent ACID-compliant JSON store
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Automatic audit logging & indexing
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                Data Volume: /data/database.json
              </div>
            </div>
          </div>

          {/* Quick cURL examples */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-white text-sm mb-3">Quick Terminal Verification Commands</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                <div className="text-slate-500 text-[11px] mb-1"># Test Healthcheck Probe:</div>
                <div className="text-emerald-400 select-all">curl -s http://localhost:3000/api/health</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                <div className="text-slate-500 text-[11px] mb-1"># Authenticate as Admin:</div>
                <div className="text-indigo-400 select-all">
                  {'curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@example.com","password":"admin123"}\''}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docker' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm">docker-compose.yml</h3>
            <button
              onClick={() => copyToClipboard(dockerComposeCode, 'docker-compose.yml')}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              {copiedCode === 'docker-compose.yml' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCode === 'docker-compose.yml' ? 'Copied' : 'Copy Compose YAML'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto leading-relaxed">
            {dockerComposeCode}
          </pre>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Cryptographic Specifications & Policies</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-indigo-300">Password Encryption (PBKDF2)</h4>
              <p className="text-slate-400">
                Passwords are never stored in plaintext. They undergo PBKDF2 key derivation using SHA-512 with 100,000
                iterations and a cryptographically randomized 16-byte salt per user.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-[11px] text-slate-300">
                salt (16 hex) : hash (64 hex sha512)
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-emerald-300">JWT Token Signing (HMAC-SHA256)</h4>
              <p className="text-slate-400">
                Access tokens are signed using HS256 with an ephemeral/configurable JWT_SECRET. Tokens carry identity,
                role (`admin` or `user`), and expiration claims (`exp`).
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-[11px] text-slate-300">
                Authorization: Bearer &lt;header.payload.signature&gt;
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'env' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm">Environment Configuration (.env.example)</h3>
            <button
              onClick={() => copyToClipboard(envExampleCode, '.env.example')}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
            >
              {copiedCode === '.env.example' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedCode === '.env.example' ? 'Copied' : 'Copy .env.example'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto leading-relaxed">
            {envExampleCode}
          </pre>
        </div>
      )}
    </div>
  );
}
