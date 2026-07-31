'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  FiPlus, FiFileText, FiTrash2, FiEdit2, FiX, FiMapPin, FiSend,
  FiAlertTriangle, FiCheck,
} from 'react-icons/fi';

export default function AdminNotices() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const user = session?.user;

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'medium', audience: 'all' });
  const [editingNotice, setEditingNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!user || user.role?.toLowerCase() !== 'admin') { router.push('/dashboard'); return; }
    loadNotices();
  }, [user, isPending, router]);

  async function loadNotices() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/notices');
      setNotices(data.notices || []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingNotice) {
        await apiFetch(`/api/admin/notices/${editingNotice._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        setNotices(prev => prev.map(n => n._id === editingNotice._id ? { ...n, ...formData } : n));
      } else {
        const data = await apiFetch('/api/admin/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        await loadNotices();
      }
      setShowForm(false);
      setEditingNotice(null);
      setFormData({ title: '', content: '', priority: 'medium', audience: 'all' });
    } catch (err) {
      console.error('Failed to save notice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePin = async (notice) => {
    try {
      await apiFetch(`/api/admin/notices/${notice._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !notice.pinned }),
      });
      setNotices(prev => prev.map(n => n._id === notice._id ? { ...n, pinned: !n.pinned } : n));
    } catch (err) {
      console.error('Failed to pin notice:', err);
    }
  };

  const handleDelete = async (notice) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await apiFetch(`/api/admin/notices/${notice._id}`, { method: 'DELETE' });
      setNotices(prev => prev.filter(n => n._id !== notice._id));
    } catch (err) {
      console.error('Failed to delete notice:', err);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Notices</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{notices.length} notices</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingNotice(null); setFormData({ title: '', content: '', priority: 'medium', audience: 'all' }); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <FiPlus className="w-4 h-4" /> New Notice
        </button>
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                  {editingNotice ? 'Edit Notice' : 'New Notice'}
                </h2>
                <button type="button" onClick={() => { setShowForm(false); setEditingNotice(null); }} className="p-1 hover:bg-zinc-100 rounded-lg">
                  <FiX className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notice title"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
              />
              <textarea
                required
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Notice content..."
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
              />
              <div className="flex gap-3">
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <select
                  value={formData.audience}
                  onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
                  className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="alumni">Alumni Only</option>
                  <option value="students">Students Only</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
                >
                  <FiSend className="w-4 h-4" />
                  {submitting ? 'Saving...' : editingNotice ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notices List */}
      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <FiFileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">No notices yet</p>
          </div>
        ) : (
          notices.map((notice) => (
            <motion.div
              key={notice._id}
              layout
              className={`bg-white dark:bg-zinc-900 rounded-2xl border p-5 ${
                notice.pinned ? 'border-violet-200 dark:border-violet-800 ring-1 ring-violet-100 dark:ring-violet-900' : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {notice.pinned && <FiMapPin className="w-3 h-3 text-violet-500" />}
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{notice.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      notice.priority === 'high' ? 'bg-red-50 text-red-600' :
                      notice.priority === 'low' ? 'bg-zinc-100 text-zinc-500' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {notice.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600">
                      {notice.audience}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">{notice.content}</p>
                  <p className="text-[10px] text-zinc-400 mt-2">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button onClick={() => handlePin(notice)} className={`p-1.5 rounded-lg transition-colors ${notice.pinned ? 'bg-violet-50 text-violet-600' : 'hover:bg-zinc-100 text-zinc-400'}`}>
                    <FiMapPin className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setEditingNotice(notice); setFormData({ title: notice.title, content: notice.content, priority: notice.priority, audience: notice.audience }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(notice)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors">
                    <FiTrash2 className="w-3.5 h-3.5" />
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
