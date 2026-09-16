'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authClient } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FiSearch, FiSend, FiArrowLeft, FiMessageSquare,
  FiUser, FiCheck, FiCheckSquare, FiLoader,
} from 'react-icons/fi';

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateDivider = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const shouldShowDateDivider = (current, previous) => {
  if (!previous) return true;
  return new Date(current).toDateString() !== new Date(previous).toDateString();
};

export default function AdminMessages() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetChatEmail = searchParams.get('chatWith');

  const user = session?.user;
  const currentUserEmail = user?.email;

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // User search for starting new conversations
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (isPending) return;
    if (!user || user.role?.toLowerCase() !== 'admin') {
      router.push('/dashboard');
      return;
    }
    loadConversations();
  }, [user, isPending, router]);

  useEffect(() => {
    if (targetChatEmail && currentUserEmail && conversations.length > 0) {
      const found = conversations.find(c => c.email === targetChatEmail);
      if (found) {
        setActiveConversation(found);
        setShowMobileSidebar(false);
      }
    }
  }, [targetChatEmail, currentUserEmail, conversations]);

  async function loadConversations() {
    setLoadingConversations(true);
    try {
      const data = await apiFetch(`/api/messages/conversations/${encodeURIComponent(currentUserEmail)}`);
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadMessages(partnerEmail) {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const data = await apiFetch(
        `/api/messages/conversation?user1=${encodeURIComponent(currentUserEmail)}&user2=${encodeURIComponent(partnerEmail)}`
      );
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.email);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessageText.trim() || !activeConversation || sending) return;

    const text = newMessageText.trim();
    setNewMessageText('');
    setSending(true);

    try {
      const data = await apiFetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: currentUserEmail,
          receiverEmail: activeConversation.email,
          text,
        }),
      });

      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        // Update conversation list
        setConversations(prev => {
          const updated = prev.map(c => {
            if (c.email === activeConversation.email) {
              return { ...c, lastMessage: text, lastMessageAt: new Date().toISOString(), lastMessageBy: currentUserEmail };
            }
            return c;
          });
          return updated.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearchingUsers(true);
    try {
      const data = await apiFetch(`/api/admin/users?search=${encodeURIComponent(userSearch.trim())}&limit=10`);
      const filtered = (data.users || []).filter(u => u.email !== currentUserEmail);
      setSearchResults(filtered);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startConversation = (selectedUser) => {
    const convo = {
      email: selectedUser.email,
      fullName: selectedUser.name,
      role: selectedUser.role,
    };
    setActiveConversation(convo);
    setShowMobileSidebar(false);
    setShowUserSearch(false);
    setUserSearch('');
    setSearchResults([]);
  };

  const filteredConversations = conversations.filter(c =>
    (c.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (isPending || (!conversations.length && loadingConversations)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Messages</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Send direct messages to any user</p>
        </div>
        <button
          onClick={() => setShowUserSearch(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <FiSearch className="w-4 h-4" />
          Find User
        </button>
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[calc(100vh-12rem)]">
        <div className="flex h-full">
          {/* Sidebar - Conversations */}
          <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800`}>
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-4">
                  <FiMessageSquare className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm text-center">No conversations yet</p>
                  <p className="text-xs text-center mt-1">Click &quot;Find User&quot; to start messaging</p>
                </div>
              ) : (
                filteredConversations.map((convo) => (
                  <button
                    key={convo.email}
                    onClick={() => {
                      setActiveConversation(convo);
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800 ${
                      activeConversation?.email === convo.email ? 'bg-violet-50 dark:bg-violet-950/20' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {convo.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{convo.fullName || convo.email}</p>
                        {convo.lastMessageAt && (
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            {new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{convo.lastMessage || convo.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1`}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {activeConversation.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{activeConversation.fullName || activeConversation.email}</p>
                    <p className="text-[10px] text-zinc-400">{activeConversation.role || 'User'}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50 dark:bg-zinc-950">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                      <FiMessageSquare className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Send the first message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isOwn = msg.senderEmail === currentUserEmail;
                      const showDateDivider = shouldShowDateDivider(msg.createdAt, messages[i - 1]?.createdAt);

                      return (
                        <div key={msg._id || i}>
                          {showDateDivider && (
                            <div className="flex items-center gap-3 my-4">
                              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                              <span className="text-[10px] font-semibold text-zinc-400">{formatDateDivider(msg.createdAt)}</span>
                              <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                            </div>
                          )}
                          <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                              isOwn
                                ? 'bg-violet-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-bl-md'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[10px] ${isOwn ? 'text-violet-200' : 'text-zinc-400'}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isOwn && (
                                  msg.read
                                    ? <FiCheckSquare className="w-3 h-3 text-violet-200" />
                                    : <FiCheck className="w-3 h-3 text-violet-200" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <input
                      ref={messageInputRef}
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessageText.trim() || sending}
                      className="p-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                <FiMessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-semibold">Select a conversation</p>
                <p className="text-sm mt-1">Or click &quot;Find User&quot; to start a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUserSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Find User</h3>
                <button onClick={() => setShowUserSearch(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <FiSearch className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                  placeholder="Search by name or email..."
                  className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
                  autoFocus
                />
                <button
                  onClick={handleSearchUsers}
                  disabled={searchingUsers || !userSearch.trim()}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {searchingUsers ? '...' : 'Search'}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">
                    {userSearch ? 'No users found' : 'Search for a user to start messaging'}
                  </p>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => startConversation(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      {u.image ? (
                        <img src={u.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {u.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{u.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'Admin' ? 'bg-violet-50 text-violet-600' :
                        u.role === 'Alumni' ? 'bg-blue-50 text-blue-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}>
                        {u.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
