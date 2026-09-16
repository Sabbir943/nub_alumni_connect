'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiFileText, FiUsers } from 'react-icons/fi';
import { apiFetch } from '@/lib/api';
import CreatePost from './CreatePost';
import BlogPostCard from './BlogPostCard';
import BlogSidebar, { CATEGORIES } from './BlogSidebar';
import OnlineUsers from './OnlineUsers';

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-100 dark:border-zinc-800/60 p-5 sm:p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600" />
        <div className="space-y-2">
          <div className="h-3.5 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 rounded-full w-36" />
          <div className="h-2.5 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 rounded-full w-20" />
        </div>
      </div>
      <div className="space-y-2.5 mb-4">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full w-full" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full w-4/5" />
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full w-2/3" />
      </div>
      <div className="h-52 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 rounded-xl" />
    </div>
  );
}

export default function BlogFeed({ currentUserEmail, currentUserRole }) {
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialFetched, setInitialFetched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [othersCount, setOthersCount] = useState(0);

  const fetchPosts = useCallback(async (pageNum, append = false, category = 'All') => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '10' });
      if (category && category !== 'All') params.set('category', category);
      const data = await apiFetch(`/api/blog?${params.toString()}`, {
        headers: { 'x-user-email': currentUserEmail || '' },
      });
      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setTotalPosts(data.pagination?.total ?? 0);
      setHasNext(data.pagination.hasNext);
    } catch {
      // silent
    }
  }, [currentUserEmail]);

  useEffect(() => {
    if (initialFetched) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchPosts is async; setState runs after await
    fetchPosts(1, false, selectedCategory).then(() => {
      setLoading(false);
      setInitialFetched(true);
    });
  }, [fetchPosts, initialFetched, selectedCategory]);

  const handleCategoryChange = (cat) => {
    if (cat === selectedCategory) return;
    setSelectedCategory(cat);
    setPage(1);
    setLoading(true);
    setInitialFetched(false);
    fetchPosts(1, false, cat).then(() => {
      setLoading(false);
      setInitialFetched(true);
    });
    setSidebarOpen(false);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchPosts(nextPage, true, selectedCategory);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setTotalPosts((prev) => prev + 1);
  };

  const handleDelete = async (postId) => {
    try {
      await apiFetch(`/api/blog/${postId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUserEmail },
      });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setTotalPosts((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleEdit = (postId, updated) => {
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, ...updated } : p)));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImVudmVsb3BlIj48ZyBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDMiPjxwYXRoIGQ9Ik0zNiAzNGMyLjEgMCAzLjgtMS43IDMuOC0zLjggMC0yLjEtMS43LTMuOC0zLjgtMy44cy0zLjggMS43LTMuOCAzLjhjMCAyLjEgMS43IDMuOCAzLjggM3oiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-xs font-medium mb-4"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live Community
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight"
              >
                Campus Blog
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base text-white/50 mt-3 max-w-lg"
              >
                Share knowledge, experiences and insights with the NUB Alumni community.
              </motion.p>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10"
              >
                <FiFileText className="w-4 h-4 text-white/60" />
                <span className="text-sm font-semibold text-white">{totalPosts}</span>
                <span className="text-xs text-white/40">posts</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10"
              >
                <div className="relative">
                  <FiUsers className="w-4 h-4 text-white/60" />
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-white">{othersCount}</span>
                <span className="text-xs text-white/40">online</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
        {/* Category chips */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-white dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md hover:shadow-indigo-500/10'
                  }`}
                >
                  <span className={active ? 'text-white/80' : cat.color}>{cat.icon}</span>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Online Users */}
        <div className="mb-6">
          <OnlineUsers currentUserEmail={currentUserEmail} onUsersChange={setOthersCount} />
        </div>

        {/* Mobile menu bar */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Browse the community</p>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/60 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <FiMenu size={20} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <BlogSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            currentUserEmail={currentUserEmail}
          />

          {/* Main Feed */}
          <div className="flex-1 min-w-0">
            <div className="mb-5 sm:mb-6">
              <CreatePost authorEmail={currentUserEmail} onPostCreated={handlePostCreated} />
            </div>

            {selectedCategory !== 'All' && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Showing:</span>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{selectedCategory}</span>
                <button
                  onClick={() => handleCategoryChange('All')}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-100 dark:border-zinc-800/60">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <span className="text-2xl">✍️</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-lg font-semibold">No posts yet</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1.5">Be the first to share something with the community!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <BlogPostCard
                      key={post._id}
                      post={post}
                      currentUserEmail={currentUserEmail}
                      currentUserRole={currentUserRole}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>

                {hasNext && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/60 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        'Load more posts'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-[320px] max-w-[85vw] bg-zinc-50 dark:bg-zinc-950 z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                <h2 className="font-semibold text-lg text-zinc-900 dark:text-white">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <BlogSidebar
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  currentUserEmail={currentUserEmail}
                  isMobile
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
