/**
 * FullStack Hub - Main Application Container
 */
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.js';
import { DashboardView } from './components/DashboardView.js';
import { ItemsView } from './components/ItemsView.js';
import { ApiExplorerView } from './components/ApiExplorerView.js';
import { ArchitectureView } from './components/ArchitectureView.js';
import { AuditLogsView } from './components/AuditLogsView.js';
import { AuthModal } from './components/AuthModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { ToastContainer } from './components/Toast.js';
import { api } from './services/api.js';
import { User, Item, SystemStats, AuditLog, ToastMessage } from './types/index.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'api' | 'architecture' | 'logs'>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(api.getCurrentUser());
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshItems = useCallback(async () => {
    try {
      const data = await api.getItems();
      setItems(data.items);
    } catch (err: any) {
      console.error('Failed to fetch items:', err);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([refreshItems(), refreshStats(), refreshLogs()]);
  }, [refreshItems, refreshStats, refreshLogs]);

  // Initial load & health verification
  useEffect(() => {
    api.getHealth()
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));

    refreshAll();

    if (api.getToken()) {
      api.getMe()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          api.clearSession();
          setCurrentUser(null);
        });
    }
  }, [refreshAll]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    api.clearSession();
    setCurrentUser(null);
    addToast('info', 'Signed Out', 'You have been logged out of your session.');
  };

  const handleQuickLogin = async (email: string) => {
    try {
      const pass = email === 'admin@example.com' ? 'admin123' : 'demo123';
      const res = await api.login({ email, password: pass });
      setCurrentUser(res.user);
      addToast('success', `Signed In as ${res.user.fullName}`, `Role: ${res.user.role.toUpperCase()}`);
      refreshAll();
    } catch (err: any) {
      addToast('error', 'Login Failed', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
        onQuickLogin={handleQuickLogin}
        serverOnline={serverOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            items={items}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onOpenCreateItem={() => setActiveTab('items')}
            onRefresh={refreshAll}
            onNotify={addToast}
          />
        )}

        {activeTab === 'items' && (
          <ItemsView
            items={items}
            currentUser={currentUser}
            onRefreshItems={refreshItems}
            onOpenAuth={() => handleOpenAuth('login')}
            onNotify={addToast}
          />
        )}

        {activeTab === 'api' && (
          <ApiExplorerView currentUser={currentUser} onNotify={addToast} />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView onNotify={addToast} />
        )}

        {activeTab === 'logs' && (
          <AuditLogsView logs={logs} onRefresh={refreshLogs} onNotify={addToast} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>FullStack Hub • Production-Ready Node.js + React Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Port 3000</span>
            <span>•</span>
            <span>RESTful Engine</span>
            <span>•</span>
            <span>PBKDF2 + JWT</span>
          </div>
        </div>
      </footer>

      {/* Modals & Toasts */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshAll();
        }}
        onNotify={addToast}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(user) => setCurrentUser(user)}
        onNotify={addToast}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
