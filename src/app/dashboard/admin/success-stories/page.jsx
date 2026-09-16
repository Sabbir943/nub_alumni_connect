'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiStar, FiAward,
  FiAlertTriangle, FiImage,
} from 'react-icons/fi';

export default function AdminSuccessStories() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const user = session?.user;

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [deletingStory, setDeletingStory] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    authorName: '',
    story: '',
    achievement: '',
    category: 'General',
    images: [],
    featured: false,
  });

  useEffect(() => {
    if (isPending) return;
    if (!user || user.role?.toLowerCase() !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadStories();
  }, [user, isPending, router]);

  async function loadStories() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/success-stories');
      setStories(data.stories || []);
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      authorName: '',
      story: '',
      achievement: '',
      category: 'General',
      images: [],
      featured: false,
    });
    setEditingStory(null);
    setShowForm(false);
  };

  const handleEdit = (story) => {
    setFormData({
      title: story.title || '',
      authorName: story.authorName || '',
      story: story.story || '',
      achievement: story.achievement || '',
      category: story.category || 'General',
      images: story.images || [],
      featured: story.featured || false,
    });
    setEditingStory(story);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.story) return;

    setActionLoading(true);
    try {
      if (editingStory) {
        await apiFetch(`/api/admin/success-stories/${editingStory._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        setStories(prev => prev.map(s =>
          s._id === editingStory._id ? { ...s, ...formData } : s
        ));
      } else {
        const data = await apiFetch('/api/admin/success-stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            authorEmail: user.email,
          }),
        });
        setStories(prev => [data.story, ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save story:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStory) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/admin/success-stories/${deletingStory._id}`, {
        method: 'DELETE',
      });
      setStories(prev => prev.filter(s => s._id !== deletingStory._id));
      setDeletingStory(null);
    } catch (err) {
      console.error('Failed to delete story:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFeatured = async (story) => {
    try {
      await apiFetch(`/api/admin/success-stories/${story._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !story.featured }),
      });
      setStories(prev => prev.map(s =>
        s._id === story._id ? { ...s, featured: !s.featured } : s
      ));
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const categories = ['General', 'Career', 'Startup', 'Academic', 'Leadership', 'Community'];

  if (isPending || (!stories.length && loading)) {
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
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Success Stories</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Share alumni achievements and success stories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Story
        </button>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stories.map((story) => (
          <motion.div
            key={story._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Story Image */}
            {story.images && story.images.length > 0 && (
              <div className="h-40 overflow-hidden">
                <img src={story.images[0]} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-4">
              {/* Category & Featured */}
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                  {story.category}
                </span>
                {story.featured && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-200 flex items-center gap-1">
                    <FiStar className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 line-clamp-2">
                {story.title}
              </h3>

              {/* Achievement */}
              {story.achievement && (
                <div className="flex items-center gap-1.5 mb-2">
                  <FiAward className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{story.achievement}</span>
                </div>
              )}

              {/* Story Preview */}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-3">
                {story.story}
              </p>

              {/* Author & Date */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-3">
                <span>{story.authorName || 'Admin'}</span>
                <span>{new Date(story.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFeatured(story)}
                  className={`p-2 rounded-xl transition-colors ${
                    story.featured
                      ? 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                      : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-violet-600'
                  }`}
                  title={story.featured ? 'Remove from featured' : 'Mark as featured'}
                >
                  <FiStar className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleEdit(story)}
                  className="p-2 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingStory(story)}
                  className="p-2 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {stories.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-zinc-400">
            <FiAward className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No success stories yet</p>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {editingStory ? 'Edit Story' : 'Add Success Story'}
                </h3>
                <button onClick={resetForm} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <FiX className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., From NUB to Google: A Journey of Persistence"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Author Name</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                    placeholder="e.g., Sabbir Ahmed"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Achievement</label>
                  <input
                    type="text"
                    value={formData.achievement}
                    onChange={(e) => setFormData(prev => ({ ...prev, achievement: e.target.value }))}
                    placeholder="e.g., Software Engineer at Google"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Story *</label>
                  <textarea
                    value={formData.story}
                    onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                    placeholder="Share the inspiring journey..."
                    rows={5}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor="featured" className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                    Feature this story
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : editingStory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletingStory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white text-center">Delete Story</h3>
              <p className="text-sm text-zinc-500 text-center mt-2">
                Are you sure you want to delete <strong>{deletingStory.title}</strong>?
              </p>
              <p className="text-xs text-red-500 text-center mt-2 font-semibold">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeletingStory(null)}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
