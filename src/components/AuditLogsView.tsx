import { useState } from 'react';
import { FileText, RefreshCw, Shield, User, Clock, Terminal } from 'lucide-react';
import { AuditLog } from '../types/index.js';
import { api } from '../services/api.js';

interface AuditLogsViewProps {
  logs: AuditLog[];
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function AuditLogsView({ logs, onRefresh, onNotify }: AuditLogsViewProps) {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
    onNotify('info', 'Logs Updated', 'Retrieved latest server audit trail.');
  };

  const filteredLogs = filterAction === 'all'
    ? logs
    : logs.filter((l) => l.action.toLowerCase().includes(filterAction.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-white text-base">Server Audit Activity Logs</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security trail capturing user authentication events, resource mutations, and system state
            transitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Event Actions</option>
            <option value="LOGIN">User Logins</option>
            <option value="REGISTER">Registrations</option>
            <option value="ITEM">Item Operations</option>
            <option value="PASSWORD">Password Changes</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">No audit logs found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-5">Timestamp</th>
                  <th className="p-3.5">Action Event</th>
                  <th className="p-3.5">Triggered By</th>
                  <th className="p-3.5">Details</th>
                  <th className="p-3.5 pr-5">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 pl-5 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action.includes('LOGIN')
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : log.action.includes('REGISTER')
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : log.action.includes('DELETE')
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300 font-sans">{log.userEmail}</td>
                    <td className="p-3.5 text-slate-400 font-sans max-w-md">{log.details}</td>
                    <td className="p-3.5 pr-5 text-slate-500 text-[10px]">{log.ip || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
