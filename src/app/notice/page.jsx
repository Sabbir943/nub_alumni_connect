'use client'
import React, { useState } from 'react';
import { 
  Bell, 
  Pin, 
  Calendar, 
  Tag, 
  Search, 
  Plus, 
  Trash2, 
  AlertCircle, 
  UserCheck, 
  ChevronRight,
  X
} from 'lucide-react';

// Sample Initial Notices
const initialNotices = [
  {
    id: '1',
    title: 'Upcoming Alumni Reunion & Networking Dinner 2026',
    category: 'Event',
    content: 'We are thrilled to announce our annual alumni gathering! Join us for an evening of networking, dinner, and sharing experiences with fellow graduates.',
    date: '2026-08-15',
    author: 'Admin',
    isPinned: true,
    urgent: false,
  },
  {
    id: '2',
    title: 'Important: System Maintenance Notice',
    category: 'Urgent',
    content: 'The alumni portal will undergo scheduled maintenance on Saturday from 2:00 AM to 5:00 AM UTC. Some services may be temporarily unavailable.',
    date: '2026-07-28',
    author: 'IT Support',
    isPinned: true,
    urgent: true,
  },
  {
    id: '3',
    title: 'Career Mentorship Program Registration Open',
    category: 'Academic',
    content: 'Registration for the Fall Mentorship Batch is now live. Senior alumni are invited to register as mentors, and final-year students can apply as mentees.',
    date: '2026-07-20',
    author: 'Career Center',
    isPinned: false,
    urgent: false,
  },
];

const NoticeBoard = () => {
  const [notices, setNotices] = useState(initialNotices);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAdmin, setIsAdmin] = useState(false); // Toggle for admin view simulation
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Notice Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    content: '',
    urgent: false,
    isPinned: false,
  });

  const categories = ['All', 'General', 'Academic', 'Event', 'Urgent'];

  // Handle Form Input Changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Add New Notice (Admin Feature)
  const handleAddNotice = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    const newNotice = {
      id: Date.now().toString(),
      title: formData.title,
      category: formData.category,
      content: formData.content,
      date: new Date().toISOString().split('T')[0],
      author: 'Admin',
      isPinned: formData.isPinned,
      urgent: formData.urgent,
    };

    setNotices([newNotice, ...notices]);
    setFormData({ title: '', category: 'General', content: '', urgent: false, isPinned: false });
    setIsModalOpen(false);
  };

  // Delete Notice (Admin Feature)
  const handleDeleteNotice = (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      setNotices(notices.filter((n) => n.id !== id));
    }
  };

  // Filter Notices
  const filteredNotices = notices
    .filter((notice) => {
      const matchesCategory = selectedCategory === 'All' || notice.category === selectedCategory;
      const matchesSearch =
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)); // Pinned posts at top

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Notice Board</h1>
              <p className="text-blue-100 text-sm mt-1">Stay updated with official announcements & news</p>
            </div>
          </div>

          {/* Admin Toggle Simulation & Add Button */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                isAdmin ? 'bg-amber-500 text-white border-amber-400' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              {isAdmin ? 'Admin Mode: ON' : 'Switch to Admin Mode'}
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg shadow-sm transition duration-200"
              >
                <Plus className="w-4 h-4" />
                Post Notice
              </button>
            )}
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
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`relative bg-white border rounded-2xl p-6 transition-all hover:shadow-md ${
                notice.urgent ? 'border-l-4 border-l-red-500 border-gray-200' : 'border-gray-200'
              } ${notice.isPinned ? 'bg-blue-50/20 border-blue-200' : ''}`}
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {notice.isPinned && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  {notice.urgent && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-600 rounded-lg">
                      <AlertCircle className="w-3 h-3" /> Urgent
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                    <Tag className="w-3 h-3" /> {notice.category}
                  </span>
                </div>

                {/* Actions (Admin Only) */}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteNotice(notice.id)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Title & Body */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{notice.content}</p>

              {/* Footer Meta */}
              <div className="flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> {notice.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400" /> By {notice.author}
                  </span>
                </div>
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

      {/* Modal for Creating Notice (Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Post New Notice</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Notice title..."
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Event">Event</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  name="content"
                  required
                  rows="4"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write the details here..."
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleInputChange}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Pin Notice
                </label>

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="urgent"
                    checked={formData.urgent}
                    onChange={handleInputChange}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  Mark Urgent
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-md"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;