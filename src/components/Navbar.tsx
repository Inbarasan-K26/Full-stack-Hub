import { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Terminal,
  Server,
  FileText,
  User as UserIcon,
  LogOut,
  LogIn,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { User } from '../types/index.js';

interface NavbarProps {
  activeTab: 'dashboard' | 'items' | 'api' | 'architecture' | 'logs';
  setActiveTab: (tab: 'dashboard' | 'items' | 'api' | 'architecture' | 'logs') => void;
  currentUser: User | null;
  onOpenAuth: (defaultMode?: 'login' | 'register') => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onQuickLogin: (email: string) => void;
  serverOnline: boolean;
}

export function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  onQuickLogin,
  serverOnline,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Status */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Server className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">FullStack Hub</span>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                  v1.0
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    serverOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'
                  }`}
                />
                <span className="text-slate-400 text-[11px]">
                  {serverOnline ? 'Express API: 0.0.0.0:3000' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'items'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              Items & CRUD
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'api'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              API Playground
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Server className="w-4 h-4 text-cyan-400" />
              Architecture
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-400" />
              Audit Logs
            </button>
          </nav>
        </div>

        {/* Right Section: Auth & User Menu */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 transition-all text-left"
              >
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(currentUser.username)}`
                  }
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700"
                />
                <div className="hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white leading-tight">{currentUser.fullName}</span>
                    <span
                      className={`text-[10px] font-mono px-1 py-0.2 rounded uppercase ${
                        currentUser.role === 'admin'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block leading-tight">{currentUser.email}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl p-1.5 z-50 text-xs"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="font-medium text-white">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                  </div>

                  <button
                    onClick={onOpenProfile}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    Profile & Security Settings
                  </button>

                  <div className="border-t border-slate-800/80 my-1"></div>

                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400">
                    Switch Active User
                  </div>
                  <button
                    onClick={() => onQuickLogin('admin@example.com')}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-[11px]"
                  >
                    <span>Switch to Admin</span>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded">Admin</span>
                  </button>
                  <button
                    onClick={() => onQuickLogin('demo@example.com')}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-[11px]"
                  >
                    <span>Switch to Demo</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded">User</span>
                  </button>

                  <div className="border-t border-slate-800/80 my-1"></div>

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQuickLogin('admin@example.com')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                Quick Admin
              </button>

              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-800/60 overflow-x-auto bg-slate-950/90 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1 rounded-lg shrink-0 ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-3 py-1 rounded-lg shrink-0 ${
            activeTab === 'items' ? 'bg-emerald-600 text-white' : 'text-slate-400'
          }`}
        >
          Items CRUD
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-3 py-1 rounded-lg shrink-0 ${
            activeTab === 'api' ? 'bg-amber-600 text-white' : 'text-slate-400'
          }`}
        >
          API Playground
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-3 py-1 rounded-lg shrink-0 ${
            activeTab === 'architecture' ? 'bg-cyan-600 text-white' : 'text-slate-400'
          }`}
        >
          Architecture
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1 rounded-lg shrink-0 ${
            activeTab === 'logs' ? 'bg-purple-600 text-white' : 'text-slate-400'
          }`}
        >
          Logs
        </button>
      </div>
    </header>
  );
}
