'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  FiPlus, FiCalendar, FiTrash2, FiEdit2, FiX, FiMapPin, FiClock,
} from 'react-icons/fi';

export default function AdminEvents() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const user = session?.user;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '', type: 'reunion' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!user || user.role?.toLowerCase() !== 'admin') { router.push('/dashboard'); return; }
    loadEvents();
  }, [user, isPending, router]);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin/events');
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingEvent) {
        await apiFetch(`/api/admin/events/${editingEvent._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        setEvents(prev => prev.map(ev => ev._id === editingEvent._id ? { ...ev, ...formData } : ev));
      } else {
        await apiFetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        await loadEvents();
      }
      setShowForm(false);
      setEditingEvent(null);
      setFormData({ title: '', description: '', date: '', location: '', type: 'reunion' });
    } catch (err) {
      console.error('Failed to save event:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (event) => {
    if (!confirm('Delete this event?')) return;
    try {
      await apiFetch(`/api/admin/events/${event._id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(ev => ev._id !== event._id));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  if (isPending || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Reunion & Events</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{events.length} events total</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingEvent(null); setFormData({ title: '', description: '', date: '', location: '', type: 'reunion' }); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <FiPlus className="w-4 h-4" /> New Event
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
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h2>
                <button type="button" onClick={() => { setShowForm(false); setEditingEvent(null); }} className="p-1 hover:bg-zinc-100 rounded-lg">
                  <FiX className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Event title"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
              />
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Event description..."
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="datetime-local"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none"
                />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location"
                  className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none"
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none"
                >
                  <option value="reunion">Reunion</option>
                  <option value="workshop">Workshop</option>
                  <option value="networking">Networking</option>
                  <option value="seminar">Seminar</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event._id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{event.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-600">{event.type}</span>
                    </div>
                    {event.description && <p className="text-xs text-zinc-500 mt-1">{event.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
                      {event.date && <span className="flex items-center gap-1"><FiClock className="w-2.5 h-2.5" />{new Date(event.date).toLocaleString()}</span>}
                      {event.location && <span className="flex items-center gap-1"><FiMapPin className="w-2.5 h-2.5" />{event.location}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => { setEditingEvent(event); setFormData({ title: event.title, description: event.description, date: event.date, location: event.location, type: event.type }); setShowForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(event)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">Past Events</h2>
          <div className="space-y-3">
            {pastEvents.map((event) => (
              <div key={event._id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 opacity-60">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{event.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400">
                      {event.date && <span>{new Date(event.date).toLocaleDateString()}</span>}
                      {event.location && <span>{event.location}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(event)} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors">
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <FiCalendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500">No events yet</p>
        </div>
      )}
    </div>
  );
}
