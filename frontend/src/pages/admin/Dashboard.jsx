// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FiVideo, FiEye, FiThumbsUp, FiMessageSquare,
  FiTrendingUp, FiAlertTriangle, FiRefreshCw,
  FiBarChart2, FiUpload, FiFlag,
} from 'react-icons/fi';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import { Link } from 'react-router-dom';

import { adminAPI }   from '../../services/api';
import AdminLayout    from '../../components/admin/AdminLayout';
import StatsCard, { StatsCardSkeleton } from '../../components/admin/StatsCard';
import { formatViewsShort, formatDate } from '../../utils/helpers';

const CHART_COLORS = {
  primary: '#e11d48',
  blue:    '#3b82f6',
  green:   '#10b981',
  purple:  '#a855f7',
  amber:   '#f59e0b',
  cyan:    '#06b6d4',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-modal rounded-xl px-3 py-2.5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-xs">
      {label && <p className="text-white/50 mb-1.5 font-medium">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [stats,      setStats]      = useState(null);
  const [topVideos,  setTopVideos]  = useState([]);
  const [viewsData,  setViewsData]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [period,     setPeriod]     = useState('7d');

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setError(null);

    try {
      const [dashRes, analyticsRes, topRes] = await Promise.allSettled([
        adminAPI.getDashboard(),
        adminAPI.getAnalyticsDashboard().catch(() => null),
        adminAPI.getTopVideos(10).catch(() => ({ data: [] })),
      ]);

      if (!mountedRef.current) return;

      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value?.data;
        setStats(d?.stats || d || null);
        if (d?.viewsChart || d?.chartData) setViewsData(d.viewsChart || d.chartData || []);
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        const a = analyticsRes.value?.data;
        if (a?.viewsData || a?.views) setViewsData(a.viewsData || a.views || []);
      }

      if (topRes.status === 'fulfilled') {
        const tv = topRes.value?.data?.videos || topRes.value?.data || [];
        setTopVideos(Array.isArray(tv) ? tv.slice(0, 10) : []);
      }
    } catch {
      if (mountedRef.current) setError('Failed to load dashboard data');
    } finally {
      if (mountedRef.current) { setLoading(false); setRefreshing(false); }
    }
  };

  const s = stats || {};

  const statCards = [
    { title: 'Total Videos',   value: s.totalVideos?.toLocaleString() ?? '—',  subtitle: `${s.publicVideos ?? 0} public · ${s.privateVideos ?? 0} private`, icon: <FiVideo       className="w-5 h-5" />, variant: 'red',    trend: s.videosTrend   || null, trendLabel: 'this week' },
    { title: 'Total Views',    value: formatViewsShort(s.totalViews),           subtitle: `${formatViewsShort(s.todayViews ?? 0)} today`,                     icon: <FiEye         className="w-5 h-5" />, variant: 'blue',   trend: s.viewsTrend    || null, trendLabel: 'this week' },
    { title: 'Total Likes',    value: formatViewsShort(s.totalLikes),           subtitle: `${formatViewsShort(s.weekLikes ?? 0)} this week`,                  icon: <FiThumbsUp    className="w-5 h-5" />, variant: 'green',  trend: s.likesTrend    || null, trendLabel: 'this week' },
    { title: 'Comments',       value: s.totalComments?.toLocaleString() ?? '—', subtitle: `${s.pendingComments ?? 0} pending review`,                         icon: <FiMessageSquare className="w-5 h-5"/>, variant: 'purple', trend: s.commentsTrend || null, trendLabel: 'this week' },
    { title: 'Reports',        value: s.totalReports?.toLocaleString() ?? '—',  subtitle: `${s.pendingReports ?? 0} unresolved`,                              icon: <FiFlag        className="w-5 h-5" />, variant: 'amber',  trend: null },
    { title: 'Trending Videos',value: s.trendingCount?.toLocaleString() ?? '—', subtitle: 'In last 24 hours',                                                 icon: <FiTrendingUp  className="w-5 h-5" />, variant: 'cyan',   trend: null },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      actions={
        <button onClick={() => fetchAll(true)} disabled={refreshing} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.08] text-white/60 border border-white/10 hover:bg-white/15 hover:text-white disabled:opacity-50 transition-all duration-200">
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            <button onClick={() => fetchAll()} className="ml-auto text-xs underline hover:no-underline">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StatsCardSkeleton key={i} />)
            : statCards.map((card, i) => <StatsCard key={i} {...card} loading={loading} />)
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FiBarChart2 className="w-4 h-4 text-primary-400" />Views Over Time
              </h2>
              <div className="flex items-center gap-1">
                {['7d','30d','90d'].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${period === p ? 'bg-primary-600/20 text-primary-400 border border-primary-600/25' : 'text-white/30 hover:text-white/60'}`}>{p}</button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="h-48 rounded-xl skeleton-shimmer bg-dark-300" />
            ) : viewsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={viewsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => { const d = new Date(v); return isNaN(d) ? v : `${d.getMonth()+1}/${d.getDate()}`; }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatViewsShort(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="views" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#viewsGrad)" dot={false} activeDot={{ r: 4, fill: CHART_COLORS.primary }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center"><p className="text-sm text-white/25">No view data available</p></div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <FiVideo className="w-4 h-4 text-blue-400" />Content Status
            </h2>
            {loading ? (
              <div className="h-48 rounded-xl skeleton-shimmer bg-dark-300" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Public',  value: s.publicVideos  || 0, color: CHART_COLORS.green },
                        { name: 'Private', value: s.privateVideos || 0, color: CHART_COLORS.blue  },
                        { name: 'Draft',   value: s.draftVideos   || 0, color: CHART_COLORS.amber },
                      ]}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value"
                    >
                      {[CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.amber].map((color, i) => (
                        <Cell key={i} fill={color} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {[
                    { label: 'Public',  val: s.publicVideos  || 0, color: CHART_COLORS.green },
                    { label: 'Private', val: s.privateVideos || 0, color: CHART_COLORS.blue  },
                    { label: 'Draft',   val: s.draftVideos   || 0, color: CHART_COLORS.amber },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-white/50">{label}</span>
                      </div>
                      <span className="font-semibold text-white/80">{val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><FiTrendingUp className="w-4 h-4 text-primary-400" />Top Videos</h2>
              <Link to="/admin/videos" className="text-xs text-white/30 hover:text-primary-400 transition-colors">View all</Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex gap-3 animate-pulse"><div className="w-6 h-4 rounded skeleton-shimmer bg-dark-200 flex-shrink-0 mt-0.5" /><div className="flex-1 space-y-1.5"><div className="h-3.5 rounded skeleton-shimmer bg-dark-200 w-full" /><div className="h-3 rounded skeleton-shimmer bg-dark-300 w-1/3" /></div></div>)}</div>
            ) : topVideos.length > 0 ? (
              <div className="divide-y divide-white/5">
                {topVideos.slice(0, 8).map((video, i) => (
                  <div key={video._id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                    <span className="text-xs font-black text-white/20 w-5 text-right flex-shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/80 truncate">{video.title}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{formatViewsShort(video.views)} views · {formatDate(video.createdAt)}</p>
                    </div>
                    <span className="text-[10px] font-bold flex-shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{formatViewsShort(video.views)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-white/30">No video data available</div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FiUpload className="w-4 h-4 text-cyan-400" />Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Upload Video',   desc: 'Add new content',    icon: <FiUpload       className="w-5 h-5" />, path: '/admin/upload',     color: 'bg-primary-600/15 text-primary-400 border-primary-600/20 hover:bg-primary-600/25' },
                { label: 'Manage Videos',  desc: 'Edit & organize',    icon: <FiVideo        className="w-5 h-5" />, path: '/admin/videos',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500/25'           },
                { label: 'View Comments',  desc: 'Moderate comments',  icon: <FiMessageSquare className="w-5 h-5"/>, path: '/admin/comments',   color: 'bg-purple-500/15 text-purple-400 border-purple-500/20 hover:bg-purple-500/25'   },
                { label: 'View Reports',   desc: 'Handle reports',     icon: <FiFlag         className="w-5 h-5" />, path: '/admin/reports',    color: 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25'       },
                { label: 'Duplicates',     desc: 'Clean up dupes',     icon: <FiAlertTriangle className="w-5 h-5"/>, path: '/admin/duplicates', color: 'bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/25'             },
                { label: 'Manage Ads',     desc: 'Ad placements',      icon: <FiBarChart2    className="w-5 h-5" />, path: '/admin/ads',        color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25'},
              ].map((action) => (
                <Link key={action.path} to={action.path} className={`flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${action.color}`}>
                  {action.icon}
                  <div>
                    <p className="text-xs font-bold">{action.label}</p>
                    <p className="text-[10px] opacity-60 mt-0.5">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;