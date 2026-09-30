import { useState } from 'react';
import { X, User as UserIcon, Key, Copy, Check, Shield, Save, Loader2, FileCode } from 'lucide-react';
import { api } from '../services/api.js';
import { User } from '../types/index.js';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdated: (user: User) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onNotify,
}: ProfileModalProps) {
  const [tab, setTab] = useState<'details' | 'security' | 'token'>('details');
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !currentUser) return null;

  const rawToken = api.getToken() || '';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api.updateProfile({ fullName, bio, avatar });
      onUserUpdated(updated);
      onNotify('success', 'Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      onNotify('error', 'Update Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onNotify('error', 'Validation Error', 'New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      onNotify('success', 'Password Changed', 'Your password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      onNotify('error', 'Password Change Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(rawToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onNotify('info', 'Copied to Clipboard', 'Bearer JWT token copied.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`}
              alt={currentUser.fullName}
              className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
            />
            <div>
              <h3 className="font-bold text-white text-base leading-tight">{currentUser.fullName}</h3>
              <p className="text-xs text-slate-400">@{currentUser.username} • {currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 gap-4 text-xs font-semibold">
          <button
            onClick={() => setTab('details')}
            className={`py-3 border-b-2 transition-all flex items-center gap-2 ${
              tab === 'details'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profile Details
          </button>
          <button
            onClick={() => setTab('security')}
            className={`py-3 border-b-2 transition-all flex items-center gap-2 ${
              tab === 'security'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security & Password
          </button>
          <button
            onClick={() => setTab('token')}
            className={`py-3 border-b-2 transition-all flex items-center gap-2 ${
              tab === 'token'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            JWT Token & Session
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto text-xs space-y-4">
          {tab === 'details' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Bio / Headline</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your team about yourself..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Avatar Image URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Accepts any HTTPS image or DiceBear avatar URL.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-slate-300">
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Shield className="w-4 h-4" />
                  Password Protection
                </div>
                <p className="text-[11px] text-slate-400">
                  Passwords are encrypted server-side using cryptographic PBKDF2 hashing with 100,000 iterations and random salt.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          )}

          {tab === 'token' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    Active Bearer JWT Token
                  </span>
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Token'}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-400 break-all bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 max-h-32 overflow-y-auto">
                  {rawToken || 'No active token'}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="font-semibold text-slate-300 block mb-2">Decoded Claims & Identity:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">User ID:</span>
                    <span className="text-slate-200 font-mono">{currentUser.id}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Role:</span>
                    <span className="text-emerald-400 font-mono uppercase font-semibold">{currentUser.role}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Email:</span>
                    <span className="text-slate-200">{currentUser.email}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Member Since:</span>
                    <span className="text-slate-200">{new Date(currentUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
