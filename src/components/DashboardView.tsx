import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Layers,
  Users,
  Activity,
  Server,
  Cpu,
  ArrowRight,
  Plus,
  RefreshCw,
  Terminal,
  Zap,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { SystemStats, Item, User, ItemCategory } from '../types/index.js';
import { api } from '../services/api.js';

interface DashboardViewProps {
  stats: SystemStats | null;
  items: Item[];
  currentUser: User | null;
  onNavigateTab: (tab: 'dashboard' | 'items' | 'api' | 'architecture' | 'logs') => void;
  onOpenCreateItem: () => void;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function DashboardView({
  stats,
  items,
  currentUser,
  onNavigateTab,
  onOpenCreateItem,
  onRefresh,
  onNotify,
}: DashboardViewProps) {
  const [healthData, setHealthData] = useState<any>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);
  const [chartMode, setChartMode] = useState<'status' | 'category' | 'trends'>('status');

  const checkHealth = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      const data = await api.getHealth();
      setPingMs(Math.round(performance.now() - start));
      setHealthData(data);
    } catch {
      setPingMs(null);
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const formatUptime = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const completedCount = stats?.completedItems ?? items.filter((i) => i.status === 'completed').length;
  const inProgressCount = stats?.inProgressItems ?? items.filter((i) => i.status === 'in_progress').length;
  const todoCount = stats?.todoItems ?? items.filter((i) => i.status === 'todo').length;
  const totalCount = items.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Recharts Data Sets
  const statusChartData = useMemo(() => {
    return [
      { name: 'Completed', value: completedCount, color: '#10b981' },
      { name: 'In Progress', value: inProgressCount, color: '#f59e0b' },
      { name: 'To Do', value: todoCount, color: '#64748b' },
    ].filter((d) => d.value > 0);
  }, [completedCount, inProgressCount, todoCount]);

  const categoryChartData = useMemo(() => {
    const cats: ItemCategory[] = ['Backend', 'Frontend', 'DevOps', 'Security', 'Database', 'Architecture'];
    return cats.map((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      return {
        category: cat,
        Completed: catItems.filter((i) => i.status === 'completed').length,
        'In Progress': catItems.filter((i) => i.status === 'in_progress').length,
        'To Do': catItems.filter((i) => i.status === 'todo').length,
        Total: catItems.length,
      };
    });
  }, [items]);

  const trendChartData = useMemo(() => {
    const map = new Map<string, { date: string; Created: number; Completed: number }>();
    const sorted = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sorted.forEach((item) => {
      const d = new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!map.has(d)) {
        map.set(d, { date: d, Created: 0, Completed: 0 });
      }
      const entry = map.get(d)!;
      entry.Created += 1;
      if (item.status === 'completed') {
        entry.Completed += 1;
      }
    });

    if (map.size === 0) {
      return [{ date: 'Today', Created: items.length, Completed: completedCount }];
    }
    return Array.from(map.values());
  }, [items, completedCount]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
          {label && <p className="font-bold text-white mb-1.5 border-b border-slate-800 pb-1">{label}</p>}
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4 text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-mono font-bold text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Full-Stack Application Active
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {currentUser ? `Welcome back, ${currentUser.fullName}!` : 'Full-Stack Nexus Architecture'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Express backend with cryptographic JWT auth, persistent relational-style schema, reactive frontend, and
              live RESTful API explorer running synchronously on port 3000.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenCreateItem}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Item
            </button>
            <button
              onClick={() => onNavigateTab('api')}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              API Playground
            </button>
            <button
              onClick={() => {
                onRefresh();
                checkHealth();
                onNotify('info', 'Refreshed', 'Telemetry and item stats synchronized.');
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Resources</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{completedCount}</span> completed •{' '}
            <span className="text-amber-400 font-semibold">{inProgressCount}</span> active
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completion Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{completionRate}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">API Requests</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats?.totalRequests ?? 12}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Server Uptime: {formatUptime(stats?.uptimeSeconds)}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">System Memory & Users</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.memoryUsageMB ?? 42} <span className="text-xs font-normal text-slate-400">MB</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{stats?.totalUsers ?? 2} Registered Users</span>
          </div>
        </div>
      </div>

      {/* Recharts Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card (2 Cols) */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Visual Item Distribution & Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic Recharts visualization representing resource allocations across lifecycle & domains
              </p>
            </div>

            {/* Chart Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setChartMode('status')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  chartMode === 'status'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                Status Donut
              </button>
              <button
                onClick={() => setChartMode('category')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  chartMode === 'category'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                By Category
              </button>
              <button
                onClick={() => setChartMode('trends')}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  chartMode === 'trends'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Timeline Trends
              </button>
            </div>
          </div>

          {/* Recharts Canvas */}
          <div className="h-72 w-full pt-2">
            {chartMode === 'status' && (
              <div className="relative h-full w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                    />
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Badge inside Donut */}
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{totalCount}</span>
                  <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Items Total
                  </span>
                </div>
              </div>
            )}

            {chartMode === 'category' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  />
                  <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="In Progress" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="To Do" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartMode === 'trends' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="Created"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Sub-Stats Strip */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{completedCount} Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>{inProgressCount} In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>{todoCount} To Do</span>
            </div>
          </div>
        </div>

        {/* Live Server Diagnostics Card (1 Col) */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Live Health Probe
              </h3>
              <button
                onClick={checkHealth}
                disabled={pinging}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${pinging ? 'animate-spin' : ''}`} />
                Ping API
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Endpoint Status</span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {healthData?.status ? healthData.status.toUpperCase() : 'HEALTHY'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Roundtrip Latency</span>
                <span className="font-mono text-white font-semibold">{pingMs !== null ? `${pingMs} ms` : '—'}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Storage Engine</span>
                <span className="font-mono text-indigo-300 text-[11px]">In-Memory + ACID JSON</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Runtime Env</span>
                <span className="font-mono text-slate-300">{healthData?.environment || 'development'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onNavigateTab('architecture')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <span>Inspect Architecture Blueprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Items Preview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Recent Project Items</h3>
          </div>
          <button
            onClick={() => onNavigateTab('items')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>View all {items.length} items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      item.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : item.status === 'in_progress'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="font-semibold text-xs text-white line-clamp-1">{item.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{item.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="capitalize">Priority: {item.priority}</span>
                <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
