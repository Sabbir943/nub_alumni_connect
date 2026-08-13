'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiTrendingUp, FiUsers, FiActivity, FiGrid,
  FiBookOpen, FiBriefcase, FiMessageSquare,
  FiHash, FiFileText, FiInfo, FiCompass,
} from 'react-icons/fi';
import { apiFetch } from '@/lib/api';

const CATEGORIES = [
  { name: 'All', icon: <FiGrid size={14} />, color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' },
  { name: 'Career Advice', icon: <FiBriefcase size={14} />, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  { name: 'Technology', icon: <FiCompass size={14} />, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  { name: 'Events', icon: <FiBookOpen size={14} />, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  { name: 'Job Opportunities', icon: <FiBriefcase size={14} />, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  { name: 'Academic', icon: <FiFileText size={14} />, color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' },
  { name: 'Networking', icon: <FiUsers size={14} />, color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
  { name: 'General', icon: <FiInfo size={14} />, color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' },
];

const QUICK_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: <FiGrid size={16} /> },
  { label: 'Events', href: '/dashboard/alumni/events', icon: <FiBookOpen size={16} /> },
  { label: 'Job Portal', href: '/job-portal', icon: <FiBriefcase size={16} /> },
  { label: 'Messages', href: '/dashboard/alumni/text', icon: <FiMessageSquare size={16} /> },
  { label: 'Notices', href: '/notice', icon: <FiFileText size={16} /> },
];

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function BlogSidebar({ selectedCategory, onCategoryChange, currentUserEmail, isMobile }) {
  const [trending, setTrending] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [activity, setActivity] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const [trendRes, contribRes, actRes] = await Promise.all([
          apiFetch('/api/blog/trending?limit=5'),
          apiFetch('/api/blog/contributors?limit=5'),
          apiFetch('/api/blog/activity?limit=5'),
        ]);
        setTrending(trendRes.posts || []);
        setContributors(contribRes.contributors || []);
        setActivity(actRes.activity || []);

        const tagMap = {};
        for (const post of trendRes.posts || []) {
          for (const tag of post.tags || []) {
            tagMap[tag] = (tagMap[tag] || 0) + 1;
          }
        }
        const sorted = Object.entries(tagMap)
          .sort((a, b) => b[1] - a[1])
          .map(([tag, count]) => ({ tag, count }));
        setAllTags(sorted);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchSidebar();
  }, []);

  return (
    <aside className={`${isMobile ? 'block w-full' : 'hidden lg:block w-80 xl:w-[340px] shrink-0'} space-y-5 ${!isMobile ? 'sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin pb-6' : ''}`}>
      {/* Categories */}
      <Section title="Categories" icon={<FiGrid size={16} />}>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onCategoryChange(cat.name)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat.name
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span className={cat.color}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </Section>

      {/* Trending Posts */}
      <Section title="Trending Posts" icon={<FiTrendingUp size={16} />}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-3">No posts yet</p>
        ) : (
          <div className="space-y-3">
            {trending.map((post, i) => (
              <div key={post._id} className="flex gap-3 group">
                <span className="text-xs font-bold text-zinc-300 dark:text-zinc-600 mt-0.5 w-4 text-right shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 group-hover:text-blue-500 transition-colors cursor-pointer">
                    {post.text?.substring(0, 80)}{post.text?.length > 80 ? '...' : ''}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {post.authorName} · {post.totalReactions} reactions
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Active Contributors */}
      <Section title="Top Contributors" icon={<FiUsers size={16} />}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : contributors.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-3">No contributors yet</p>
        ) : (
          <div className="space-y-3">
            {contributors.map((user, i) => (
              <div key={user.email} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate group-hover:text-blue-500 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {user.postCount} post{user.postCount !== 1 ? 's' : ''} · {user.commentCount} comment{user.commentCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600">
                  {user.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Recent Activity */}
      <Section title="Recent Activity" icon={<FiActivity size={16} />}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-3">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {activity.map((item, i) => (
              <div key={item._id || i} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[8px] font-bold shrink-0 overflow-hidden">
                  {item.authorAvatar ? (
                    <img src={item.authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    item.authorName?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.authorName}</span>
                    {' '}commented on{' '}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.postAuthor}&apos;s post</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{timeAgo(item.createdAt)} ago</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Popular Tags */}
      {allTags.length > 0 && (
        <Section title="Popular Tags" icon={<FiHash size={16} />}>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(({ tag, count }) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-[11px] font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
              >
                #{tag}
                <span className="text-[9px] text-zinc-400">{count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Quick Links */}
      <Section title="Quick Links" icon={<FiCompass size={16} />}>
        <div className="space-y-1">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-blue-500 transition-colors"
            >
              <span className="text-zinc-400">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </Section>

      {/* About Blog */}
      <Section title="About Blog" icon={<FiInfo size={16} />}>
        <div className="space-y-2.5">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Share your knowledge, experiences, and insights with the NUB Alumni community. Post articles, career tips, and stay connected.
          </p>
          <div className="text-[11px] text-zinc-400 space-y-1">
            <p>Be respectful and constructive</p>
            <p>No spam or self-promotion</p>
            <p>Keep content relevant to the community</p>
          </div>
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-zinc-400">{icon}</span>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
