'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';
import { apiFetch } from '@/lib/api';
import CreatePost from './CreatePost';
import BlogPostCard from './BlogPostCard';
import BlogSidebar from './BlogSidebar';

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800 p-5 sm:p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="space-y-2">
          <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
        </div>
      </div>
      <div className="space-y-2.5 mb-4">
        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-4/5" />
        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
      </div>
      <div className="h-56 sm:h-72 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
    </div>
  );
}

export default function BlogFeed({ currentUserEmail }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialFetched, setInitialFetched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      setHasNext(data.pagination.hasNext);
    } catch {
      // silent
    }
  }, [currentUserEmail]);

  useEffect(() => {
    if (initialFetched) return;
    setLoading(true);
    fetchPosts(1, false, selectedCategory).then(() => {
      setLoading(false);
      setInitialFetched(true);
    });
  }, [fetchPosts, initialFetched, selectedCategory]);

  const handleCategoryChange = (cat) => {
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
  };

  const handleDelete = async (postId) => {
    try {
      await apiFetch(`/api/blog/${postId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUserEmail },
      });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      // silent
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-1">Blog</h1>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">Share your knowledge and insights with the community</p>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <FiMenu size={20} className="text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar - Left */}
          <BlogSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            currentUserEmail={currentUserEmail}
          />

          {/* Main Feed - Right */}
          <div className="flex-1 min-w-0">
            <div className="mb-5 sm:mb-6">
              <CreatePost authorEmail={currentUserEmail} onPostCreated={handlePostCreated} />
            </div>

            {selectedCategory !== 'All' && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Showing:</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{selectedCategory}</span>
                <button
                  onClick={() => handleCategoryChange('All')}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  ✕ Clear
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-5 sm:space-y-6">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 sm:py-24">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                  <span className="text-3xl">✍️</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-lg sm:text-xl font-semibold">No posts yet</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm sm:text-base mt-2">Be the first to share something with the community!</p>
              </div>
            ) : (
              <>
                <div className="space-y-5 sm:space-y-6">
                  {posts.map((post) => (
                    <BlogPostCard
                      key={post._id}
                      post={post}
                      currentUserEmail={currentUserEmail}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>

                {hasNext && (
                  <div className="mt-6 sm:mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all disabled:opacity-50 border border-blue-200 dark:border-blue-800"
                    >
                      {loadingMore ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
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

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-[320px] max-w-[85vw] bg-zinc-50 dark:bg-zinc-950 z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Blog Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
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
