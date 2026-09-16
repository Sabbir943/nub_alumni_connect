'use client'
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Pin, 
  Calendar, 
  Tag, 
  Search, 
  AlertCircle, 
  UserCheck, 
  Loader2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'General', 'Academic', 'Event', 'Urgent'];

  useEffect(() => {
    loadNotices();
  }, []);

  async function loadNotices() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/notices?limit=50');
      setNotices(data.notices || []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  }

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500 bg-red-50/20';
      case 'low': return 'border-l-4 border-l-green-500';
      default: return '';
    }
  };

  const getCategoryLabel = (notice) => {
    if (notice.priority === 'high') return 'Urgent';
    if (notice.audience === 'alumni') return 'Alumni';
    if (notice.audience === 'students') return 'Students';
    return notice.category || 'General';
  };

  const filteredNotices = notices
    .filter((notice) => {
      const matchesCategory = selectedCategory === 'All' || 
        getCategoryLabel(notice) === selectedCategory;
      const matchesSearch =
        notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Notice Board</h1>
            <p className="text-blue-100 text-sm mt-1">Stay updated with official announcements & news</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition"
          />
        </div>
      </div>

      {/* Notices List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500 font-medium">Loading notices...</p>
          </div>
        ) : filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div
              key={notice._id}
              className={`relative bg-white border rounded-2xl p-6 transition-all hover:shadow-md border-gray-200 ${
                notice.pinned ? 'bg-blue-50/20 border-blue-200' : ''
              } ${getPriorityStyle(notice.priority)}`}
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {notice.pinned && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
                {notice.priority === 'high' && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-600 rounded-lg">
                    <AlertCircle className="w-3 h-3" /> Urgent
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                  <Tag className="w-3 h-3" /> {getCategoryLabel(notice)}
                </span>
              </div>

              {/* Title & Body */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{notice.content}</p>

              {/* Footer Meta */}
              <div className="flex items-center border-t pt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" /> 
                  {notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'N/A'}
                </span>
                <span className="flex items-center gap-1 ml-4">
                  <UserCheck className="w-3.5 h-3.5 text-gray-400" /> By Admin
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notices found matching your query.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeBoard;
