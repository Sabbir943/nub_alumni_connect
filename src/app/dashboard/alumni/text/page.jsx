'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Search,
  MessageSquare,
  UserX,
  Loader2,
  AlertTriangle,
  GraduationCap,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  ChevronLeft,
  ImageIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

const getInitials = (name) => {
  if (!name) return 'A';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};

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
  const a = new Date(current);
  const b = new Date(previous);
  return a.toDateString() !== b.toDateString();
};

export default function MessengerPage() {
  const searchParams = useSearchParams();
  const targetChatEmail = searchParams.get('chatWith');

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const currentUserEmail = session?.user?.email;

  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [activeFriend, setActiveFriend] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const pollingRef = useRef(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = (smooth = true) => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (activeFriend && !loadingMessages) {
      inputRef.current?.focus();
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [activeFriend, loadingMessages]);

  // Fetch Friends and Unread Count Summary
  useEffect(() => {
    if (!currentUserEmail) return;
    let isMounted = true;

    const fetchFriendsAndUnread = async () => {
      setFetchError(null);
      try {
        const friendsData = await apiFetch(`/api/follow/following/${encodeURIComponent(currentUserEmail)}`);
        const connectionsList = friendsData.following || [];

        if (!isMounted) return;
        setFriends(connectionsList);

        try {
          const unreadData = await apiFetch(`/api/messages/unread-summary/${encodeURIComponent(currentUserEmail)}`);
          if (isMounted && unreadData.success) {
            setUnreadCounts(unreadData.unreadCounts || {});
          }
        } catch {
          // Unread fetch failed silently
        }

        if (targetChatEmail && connectionsList.length > 0) {
          const found = connectionsList.find((f) => f.email === targetChatEmail);
          if (found) {
            setActiveFriend(found);
            setShowMobileSidebar(false);
          }
        }
      } catch (err) {
        console.error('Error fetching friends list:', err);
        if (isMounted) setFetchError('Failed to load contacts. Please try again.');
      } finally {
        if (isMounted) setLoadingFriends(false);
      }
    };

    fetchFriendsAndUnread();
    return () => { isMounted = false; };
  }, [currentUserEmail, targetChatEmail]);

  const fetchConversation = useCallback(async (friendEmail, showLoading = false) => {
    if (!currentUserEmail || !friendEmail) return;
    if (showLoading) setLoadingMessages(true);
    try {
      const data = await apiFetch(
        `/api/messages/conversation?user1=${encodeURIComponent(currentUserEmail)}&user2=${encodeURIComponent(friendEmail)}`
      );
      if (data.success) {
        setMessages(data.messages || []);
        setUnreadCounts((prev) => ({ ...prev, [friendEmail]: 0 }));
        setFetchError(null);
      }
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setFetchError('Could not load messages. Retrying...');
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, [currentUserEmail]);

  // Fetch conversation + set up polling when active friend changes
  useEffect(() => {
    const friendEmail = activeFriend?.email;
    if (!friendEmail || !currentUserEmail) return;

    fetchConversation(friendEmail, true);

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      fetchConversation(friendEmail, false);
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeFriend?.email, currentUserEmail, fetchConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeFriend || !currentUserEmail || sending) return;

    const payload = {
      senderEmail: currentUserEmail,
      receiverEmail: activeFriend.email,
      text: newMessageText,
    };

    setSending(true);
    try {
      const data = await apiFetch(`/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessageText('');
        setFetchError(null);
        isNearBottomRef.current = true;
        setTimeout(() => scrollToBottom(), 50);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setFetchError('Message not sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSelectFriend = (friend) => {
    setActiveFriend(friend);
    setShowMobileSidebar(false);
    setFetchError(null);
    setLoadingMessages(true);
  };

  const filteredFriends = friends.filter((friend) => {
    const name = friend.fullName?.toLowerCase() || '';
    const job = friend.jobTitle?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || job.includes(searchTerm.toLowerCase());
  });

  const sortedFriends = [...filteredFriends].sort((a, b) => {
    const aUnread = unreadCounts[a.email] || 0;
    const bUnread = unreadCounts[b.email] || 0;
    if (aUnread && !bUnread) return -1;
    if (!aUnread && bUnread) return 1;
    return 0;
  });

  if (sessionLoading) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <div className="absolute inset-0 w-10 h-10 border-4 border-blue-200 rounded-full animate-ping opacity-30" />
          </div>
          <p className="text-sm text-slate-500 font-medium">Loading messenger...</p>
        </motion.div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl border border-slate-200/60 text-center max-w-md shadow-xl shadow-slate-200/50"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">Please log in to access the messenger and connect with alumni.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-100 via-blue-50/30 to-slate-100 p-2 sm:p-3 lg:p-4 flex flex-col"
    >
      <div className="max-w-[1400px] w-full mx-auto bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/40 flex-1 flex overflow-hidden">

        {/* ===== SIDEBAR ===== */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`
            ${showMobileSidebar ? 'flex' : 'hidden'}
            md:flex flex-col w-full md:w-80 lg:w-[340px] border-r border-slate-200/60 bg-white/60 backdrop-blur-sm
            absolute md:relative inset-0 z-20 md:z-auto
          `}
        >
          {/* Sidebar Header */}
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <MessageSquare className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">Chats</h1>
                  <p className="text-[11px] text-slate-400 font-medium">{friends.length} contact{friends.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200/50 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
              />
            </div>
          </div>

          {/* Friend List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {loadingFriends ? (
              <div className="p-10 text-center">
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-medium">Loading contacts...</p>
              </div>
            ) : sortedFriends.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <UserX className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No contacts found</p>
                <p className="text-xs text-slate-400 mt-1">Connect with alumni to start chatting</p>
              </div>
            ) : (
              <AnimatePresence>
                {sortedFriends.map((friend, idx) => {
                  const isSelected = activeFriend?.email === friend.email;
                  const unread = unreadCounts[friend.email] || 0;

                  return (
                    <motion.button
                      key={friend._id || friend.email}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      onClick={() => handleSelectFriend(friend)}
                      className={`
                        w-full p-3 flex items-center gap-3 rounded-2xl text-left transition-all duration-200 mb-0.5 group
                        ${isSelected
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 shadow-sm'
                          : 'hover:bg-slate-100/80 border border-transparent'
                        }
                      `}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {friend.profilePictureUrl ? (
                          <img
                            src={friend.profilePictureUrl}
                            alt={friend.fullName}
                            className={`w-12 h-12 rounded-full object-cover ring-2 transition-all ${
                              isSelected ? 'ring-blue-400 shadow-md shadow-blue-400/20' : 'ring-white group-hover:ring-slate-200'
                            }`}
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-blue-400 shadow-md shadow-blue-400/20'
                              : 'bg-gradient-to-br from-slate-400 to-slate-500 ring-white group-hover:ring-slate-200'
                          }`}>
                            {getInitials(friend.fullName)}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {friend.fullName}
                          </p>
                          {unread > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-2 flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-blue-500/25"
                            >
                              {unread}
                            </motion.span>
                          )}
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                          {friend.jobTitle || friend.organization || 'Alumni Member'}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* ===== CHAT AREA ===== */}
        <div className={`flex-1 flex flex-col ${showMobileSidebar ? 'hidden md:flex' : 'flex'}`}>
          <AnimatePresence mode="wait">
            {activeFriend ? (
              <motion.div
                key={activeFriend.email}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {/* Chat Header */}
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="px-4 sm:px-6 py-3 border-b border-slate-200/60 bg-white/70 backdrop-blur-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileSidebar(true)}
                      className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      {activeFriend.profilePictureUrl ? (
                        <img
                          src={activeFriend.profilePictureUrl}
                          alt={activeFriend.fullName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600 ring-2 ring-white shadow-sm">
                          {getInitials(activeFriend.fullName)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{activeFriend.fullName}</h2>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                        <span>{activeFriend.graduationYear ? `Class of ${activeFriend.graduationYear}` : 'Alumni'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-emerald-500 font-medium">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-all">
                      <Phone className="w-4.5 h-4.5" />
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-all">
                      <Video className="w-4.5 h-4.5" />
                    </button>
                    <button className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                      <MoreVertical className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </motion.div>

                {/* Messages Area */}
                <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto space-y-1 bg-gradient-to-b from-slate-50/50 to-blue-50/20">
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                        <p className="text-xs text-slate-400 font-medium">Loading messages...</p>
                      </motion.div>
                    </div>
                  ) : messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                        <MessageSquare className="w-9 h-9 text-blue-400" />
                      </div>
                      <p className="text-base font-bold text-slate-700">Start a conversation</p>
                      <p className="text-sm text-slate-400 mt-1 max-w-xs">
                        Send a message to {activeFriend.fullName} to begin your conversation
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isMe = msg.senderEmail === currentUserEmail;
                        const prevMsg = idx > 0 ? messages[idx - 1] : null;
                        const showDivider = shouldShowDateDivider(msg.createdAt, prevMsg?.createdAt);
                        const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                        const isLastInGroup = !nextMsg || nextMsg.senderEmail !== msg.senderEmail;
                        const isFirstInGroup = !prevMsg || prevMsg.senderEmail !== msg.senderEmail;

                        return (
                          <React.Fragment key={msg._id || idx}>
                            {showDivider && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center py-3"
                              >
                                <div className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-sm">
                                  <span className="text-[11px] font-semibold text-slate-400">
                                    {formatDateDivider(msg.createdAt)}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.2, delay: 0.02 }}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}
                            >
                              {!isMe && (
                                <div className="flex-shrink-0 mr-2 self-end">
                                  {isLastInGroup ? (
                                    activeFriend.profilePictureUrl ? (
                                      <img
                                        src={activeFriend.profilePictureUrl}
                                        alt=""
                                        className="w-7 h-7 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-slate-400 to-slate-500">
                                        {getInitials(activeFriend.fullName)}
                                      </div>
                                    )
                                  ) : <div className="w-7" />}
                                </div>
                              )}
                              <div
                                className={`max-w-[70%] sm:max-w-[65%] px-4 py-2.5 text-sm leading-relaxed transition-all
                                  ${isMe
                                    ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/15 ${
                                        isFirstInGroup && isLastInGroup ? 'rounded-2xl' :
                                        isFirstInGroup ? 'rounded-2xl rounded-br-lg' :
                                        isLastInGroup ? 'rounded-2xl rounded-tr-lg' :
                                        'rounded-2xl rounded-r-lg'
                                      }`
                                    : `bg-white text-slate-800 border border-slate-100 shadow-sm ${
                                        isFirstInGroup && isLastInGroup ? 'rounded-2xl' :
                                        isFirstInGroup ? 'rounded-2xl rounded-bl-lg' :
                                        isLastInGroup ? 'rounded-2xl rounded-tl-lg' :
                                        'rounded-2xl rounded-l-lg'
                                      }`
                                  }
                                `}
                              >
                                <p>{msg.text}</p>
                                <div className={`flex items-center justify-end gap-1 mt-1 ${
                                  isMe ? 'text-blue-100' : 'text-slate-400'
                                }`}>
                                  <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                                  {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                            </motion.div>
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Error Toast */}
                <AnimatePresence>
                  {fetchError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mx-4 mb-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium flex items-center gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {fetchError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message Input */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                  className="px-4 sm:px-6 py-3 border-t border-slate-200/60 bg-white/70 backdrop-blur-md"
                >
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex items-center gap-1">
                      <button type="button" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-all">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button type="button" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-all">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <button type="button" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-all">
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder={`Message ${activeFriend.fullName}...`}
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        className="w-full bg-slate-100/80 border border-slate-200/50 rounded-2xl px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 focus:bg-white transition-all"
                      />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={sending || !newMessageText.trim()}
                      whileTap={{ scale: 0.92 }}
                      className={`p-3 rounded-2xl transition-all flex-shrink-0 ${
                        newMessageText.trim()
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-50/50 to-blue-50/20"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-5">
                  <MessageSquare className="w-11 h-11 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-1">Welcome to Messenger</h3>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  Select a conversation from the sidebar to start chatting with your alumni network
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
