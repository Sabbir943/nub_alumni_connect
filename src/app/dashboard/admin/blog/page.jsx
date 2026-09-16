'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  FiSearch, FiTrash2, FiX, FiFileText, FiCalendar,
  FiAlertTriangle, FiEye, FiUser, FiMapPin,
} from 'react-icons/fi';

export default function AdminBlogManagement() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const user = session?.user;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deletingPost, setDeletingPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingPost, setViewingPost] = useState(null);
  const [pinningPost, setPinningPost] = useState(null);

  useEffect(() => {
    if (isPending) return;
    if (!user || user.role?.toLowerCase() !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadPosts();
  }, [user, isPending, router]);

  async function loadPosts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      const data = await apiFetch(`/api/blog?${params.toString()}`);
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleDeletePost = async () => {
    if (!deletingPost) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/blog/${deletingPost._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        },
      });
      setPosts(prev => prev.filter(p => p._id !== deletingPost._id));
      setDeletingPost(null);
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePinPost = async (post) => {
    setPinningPost(post._id);
    try {
      const newPinned = !post.pinned;
      await apiFetch(`/api/blog/${post._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': user.email },
        body: JSON.stringify({ pinned: newPinned }),
      });
      setPosts(prev => prev.map(p => p._id === post._id ? { ...p, pinned: newPinned } : p));
    } catch (err) {
      console.error('Failed to pin post:', err);
    } finally {
      setPinningPost(null);
    }
  };

  const categories = ['All', 'General', 'Career Advice', 'Technology', 'Events', 'Job Opportunities', 'Academic', 'Networking'];

  if (isPending || (!posts.length && loading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Blog Management</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage all blog posts across the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none cursor-pointer"
        >
          {categories.map(cat => (
            <option key={cat} value={cat === 'All' ? '' : cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={loadPosts}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Post Image */}
            {post.images && post.images.length > 0 && (
              <div className="h-40 overflow-hidden">
                <img
                  src={post.images[0]}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4">
              {/* Category & Date */}
              <div className="flex items-center gap-2 mb-2">
                {post.pinned && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                    <FiMapPin className="w-3 h-3" />
                    Pinned
                  </span>
                )}
                {post.category && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-200">
                    {post.category}
                  </span>
                )}
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {post.authorName?.charAt(0) || '?'}
                </div>
                <span className="text-xs text-zinc-500">{post.authorName || post.authorEmail}</span>
              </div>

              {/* Text Preview */}
              <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 mb-3">
                {post.text || 'No text content'}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-[10px] text-zinc-400 mb-3">
                <span>{Object.values(post.reactions || {}).flat().length} reactions</span>
                <span>{post.commentCount || 0} comments</span>
                <span>{post.shares || 0} shares</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingPost(post)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <FiEye className="w-3.5 h-3.5" />
                  View
                </button>
                <button
                  onClick={() => handlePinPost(post)}
                  disabled={pinningPost === post._id}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    post.pinned
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }`}
                >
                  <FiMapPin className="w-3.5 h-3.5" />
                  {post.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => setDeletingPost(post)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {posts.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-zinc-400">
            <FiFileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No blog posts found</p>
          </div>
        )}
      </div>

      {/* View Post Modal */}
      <AnimatePresence>
        {viewingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setViewingPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Post Details</h3>
                <button onClick={() => setViewingPost(null)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <FiX className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {viewingPost.authorName || viewingPost.authorEmail}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm text-zinc-500">
                    {new Date(viewingPost.createdAt).toLocaleString()}
                  </span>
                </div>
                {viewingPost.category && (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-600 border border-violet-200">
                    {viewingPost.category}
                  </span>
                )}
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {viewingPost.text}
                </p>
                {viewingPost.images && viewingPost.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {viewingPost.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="rounded-xl object-cover h-32 w-full" />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletingPost(null)}
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
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white text-center">Delete Post</h3>
              <p className="text-sm text-zinc-500 text-center mt-2">
                Are you sure you want to delete this post by <strong>{deletingPost.authorName}</strong>?
              </p>
              <p className="text-xs text-red-500 text-center mt-2 font-semibold">
                This will permanently remove the post and all its comments. This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeletingPost(null)}
                  className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
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
