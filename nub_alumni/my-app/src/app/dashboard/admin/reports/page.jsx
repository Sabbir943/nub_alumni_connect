'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle, FiCheck, FiX, FiUser } from 'react-icons/fi';

export default function AdminReports() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const user = session?.user;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (isPending) return;
    if (!user || user.role?.toLowerCase() !== 'admin') { router.push('/dashboard'); return; }
    loadReports();
  }, [user, isPending, router, statusFilter]);

  async function loadReports() {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const data = await apiFetch(`/api/admin/reports${params}`);
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (reportId, status) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setReports(prev => prev.map(r => r._id === reportId ? { ...r, status } : r));
    } catch (err) {
      console.error('Failed to update report:', err);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, { method: 'DELETE' });
      setReports(prev => prev.filter(r => r._id !== reportId));
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Reported Content</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{reports.length} reports</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'pending', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <FiAlertTriangle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">No reports found</p>
          </div>
        ) : (
          reports.map((report) => (
            <motion.div
              key={report._id}
              layout
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                      report.status === 'dismissed' ? 'bg-zinc-100 text-zinc-500' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600">
                      {report.targetType}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">{report.reason}</p>
                  {report.description && <p className="text-xs text-zinc-500 mt-1">{report.description}</p>}
                  <p className="text-[10px] text-zinc-400 mt-2">
                    Reported by {report.reporterEmail} · {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(report._id, 'resolved')}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 transition-colors"
                        title="Resolve"
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(report._id, 'dismissed')}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                        title="Dismiss"
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(report._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
