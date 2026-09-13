'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Users, Loader2, Check, ImagePlus,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { uploadImage } from '@/lib/upload';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};

export default function CreateGroupModal({ isOpen, onClose, currentUserEmail, contacts, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [error, setError] = useState(null);
  const avatarInputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setSelectedEmails([]);
      setSearchTerm('');
      setError(null);
      setGroupAvatar(null);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredContacts = contacts.filter((c) => {
    if (c.email === currentUserEmail) return false;
    const q = searchTerm.toLowerCase();
    return (
      (c.fullName?.toLowerCase() || '').includes(q) ||
      (c.email?.toLowerCase() || '').includes(q) ||
      (c.jobTitle?.toLowerCase() || '').includes(q) ||
      (c.department?.toLowerCase() || '').includes(q)
    );
  });

  const toggleSelect = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar must be under 5MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      setGroupAvatar(url);
    } catch (err) {
      setError(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedEmails.length === 0) {
      setError('Please select at least one person');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const data = await apiFetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          avatar: groupAvatar,
          participantEmails: selectedEmails,
          creatorEmail: currentUserEmail,
        }),
      });

      if (data.success) {
        onGroupCreated(data.group);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Create Group</h2>
                  <p className="text-xs text-gray-500">Add people and name your group</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Group Avatar + Name */}
            <div className="flex items-center gap-4 mb-5">
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative w-16 h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center overflow-hidden flex-shrink-0 group"
              >
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                ) : groupAvatar ? (
                  <>
                    <img src={groupAvatar} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <ImagePlus className="w-6 h-6 text-gray-400" />
                )}
              </button>
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0084ff]/30 border border-gray-200 focus:border-[#0084ff]/40 transition-all"
              />
            </div>

            {/* Selected Chips */}
            {selectedEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedEmails.map((email) => {
                  const contact = contacts.find((c) => c.email === email);
                  return (
                    <motion.span
                      key={email}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0084ff]/10 text-[#0084ff] rounded-full text-xs font-semibold"
                    >
                      {contact?.fullName || email.split('@')[0]}
                      <button
                        onClick={() => toggleSelect(email)}
                        className="p-0.5 rounded-full hover:bg-[#0084ff]/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.span>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0084ff]/20 border border-gray-200 focus:border-[#0084ff]/40 transition-all"
              />
            </div>

            {/* Contact List */}
            <div className="space-y-0.5 max-h-[280px] overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No contacts found</p>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedEmails.includes(contact.email);
                  return (
                    <button
                      key={contact.email}
                      onClick={() => toggleSelect(contact.email)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-[#0084ff]/5 ring-1 ring-[#0084ff]/20'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {contact.profilePictureUrl ? (
                          <img src={contact.profilePictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-xs font-bold text-white">
                            {getInitials(contact.fullName)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-gray-900 truncate">{contact.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {contact.jobTitle || contact.department || contact.email}
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#0084ff] border-[#0084ff]'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {error && (
              <p className="text-xs text-red-500 mb-3 font-medium">{error}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {selectedEmails.length > 0
                  ? `${selectedEmails.length + 1} members (including you)`
                  : 'Select at least 1 person'}
              </p>
              <button
                onClick={handleCreate}
                disabled={creating || !groupName.trim() || selectedEmails.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0084ff] to-[#0066cc] text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#0084ff]/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                  </span>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
