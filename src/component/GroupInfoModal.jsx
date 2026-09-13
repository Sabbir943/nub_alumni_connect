'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Loader2, UserPlus, LogOut, Trash2, Shield, Crown,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useSocket } from '@/lib/useSocket';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};

export default function GroupInfoModal({ isOpen, onClose, group, currentUserEmail, onGroupUpdated }) {
  const [addingMember, setAddingMember] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [removing, setRemoving] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = group.participants?.some((p) => p.email === currentUserEmail && p.role === 'admin');
  const isCreator = group.createdBy === currentUserEmail;

  const handleAddMember = async () => {
    if (!addEmail.trim()) return;
    setAddingMember(true);
    setError(null);
    try {
      await apiFetch(`/api/groups/${group._id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim(), adminEmail: currentUserEmail }),
      });
      setAddEmail('');
      const data = await apiFetch(`/api/groups/${group._id}?email=${encodeURIComponent(currentUserEmail)}`);
      if (data.success) onGroupUpdated(data.group);
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (email) => {
    setRemoving(email);
    setError(null);
    try {
      await apiFetch(`/api/groups/${group._id}/participants`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail, targetEmail: email }),
      });
      const data = await apiFetch(`/api/groups/${group._id}?email=${encodeURIComponent(currentUserEmail)}`);
      if (data.success) onGroupUpdated(data.group);
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const handleLeaveGroup = async () => {
    setLeaving(true);
    setError(null);
    try {
      await apiFetch(`/api/groups/${group._id}/participants`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail }),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to leave group');
    } finally {
      setLeaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;
    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/groups/${group._id}?email=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Group Info</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Group Info */}
            <div className="flex flex-col items-center mb-6">
              {group.avatar ? (
                <img src={group.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center">
                  <Users className="w-10 h-10 text-white" />
                </div>
              )}
              <h3 className="mt-3 text-xl font-bold text-gray-900">{group.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Created by {group.createdBy?.split('@')[0]}
              </p>
            </div>

            {/* Add Member (Admin only) */}
            {isAdmin && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Add People</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember(); }}
                    className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0084ff]/20 border border-gray-200"
                  />
                  <button
                    onClick={handleAddMember}
                    disabled={addingMember || !addEmail.trim()}
                    className="px-4 py-2.5 bg-[#0084ff] text-white rounded-xl text-sm font-bold hover:bg-[#0073e6] transition-colors disabled:opacity-50"
                  >
                    {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Members */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Members ({group.participants?.length || 0})
              </p>
              <div className="space-y-1">
                {group.participants?.map((p) => {
                  const isYou = p.email === currentUserEmail;
                  const isMemberAdmin = p.role === 'admin';
                  return (
                    <div key={p.email} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      {p.avatar ? (
                        <img src={p.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-xs font-bold text-white">
                          {getInitials(p.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          {isYou && <span className="text-[10px] text-gray-400">(you)</span>}
                          {isMemberAdmin && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{p.email}</p>
                      </div>
                      {!isYou && isAdmin && (
                        <button
                          onClick={() => handleRemoveMember(p.email)}
                          disabled={removing === p.email}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove member"
                        >
                          {removing === p.email ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 mt-3 font-medium">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
            {!isCreator && (
              <button
                onClick={handleLeaveGroup}
                disabled={leaving}
                className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                {leaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Leave Group
              </button>
            )}
            {isCreator && (
              <button
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Group
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
