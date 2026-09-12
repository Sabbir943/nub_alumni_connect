'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import {
  Send,
  Search,
  MessageSquare,
  UserX,
  Loader2,
  AlertTriangle,
  CheckCheck,
  Check,
  Phone,
  Video,
  MoreVertical,
  Smile,
  ChevronLeft,
  ImageIcon,
  UserPlus,
  X,
  RefreshCw,
  User,
  BellOff,
  Trash2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { useCall } from '@/component/CallContext';
import { useSocket } from '@/lib/useSocket';
import CallOverlay from '@/component/CallOverlay';

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊',
  '😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋',
  '😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡',
  '😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌',
  '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵',
  '🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐',
  '👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘',
  '👌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐',
  '🖖','👋','🤙','💪','🫶','🙏','❤️','🔥','💯','✨',
  '🎉','🎊','😍','🥰','😘','💕','💞','💓','💗','💖',
];

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
  return new Date(current).toDateString() !== new Date(previous).toDateString();
};

const isImageUrl = (text) => {
  if (!text) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(text.trim()) ||
    /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(text.trim()) ||
    /^https?:\/\/i\.imgbb\.com\//i.test(text.trim());
};

export default function MessengerChat({ role = 'alumni' }) {
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastTypingEmitRef = useRef(0);

  const {
    incomingCall, callState, callFailed, callUser, answerCall, declineCall, endCall,
    localStream, remoteStream, audioEnabled, videoEnabled, toggleAudio, toggleVideo, callType,
  } = useCall();

  const {
    newMessage: socketNewMessage,
    typingUser: socketTypingUser,
    readReceipt: socketReadReceipt,
    messageError: socketMessageError,
    sendMessage: socketSendMessage,
    emitTyping,
    emitStopTyping,
    markRead,
    clearNewMessage,
    clearReadReceipt,
  } = useSocket(currentUserEmail);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const moreMenuRef = useRef(null);
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
    if (isNearBottomRef.current) scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeFriend && !loadingMessages) {
      inputRef.current?.focus();
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [activeFriend, loadingMessages]);

  // Close emoji picker / more menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!currentUserEmail) return;
    let isMounted = true;

    const fetchFriendsAndUnread = async () => {
      setFetchError(null);
      try {
        // Fetch following list (bidirectional) AND conversation partners
        const [friendsData, convoData, unreadData] = await Promise.all([
          apiFetch(`/api/follow/following/${encodeURIComponent(currentUserEmail)}`).catch(() => ({ following: [] })),
          apiFetch(`/api/messages/conversations/${encodeURIComponent(currentUserEmail)}`).catch(() => ({ conversations: [] })),
          apiFetch(`/api/messages/unread-summary/${encodeURIComponent(currentUserEmail)}`).catch(() => ({ unreadCounts: {} })),
        ]);

        if (!isMounted) return;

        const connectionsList = friendsData.following || [];
        const conversationPartners = convoData.conversations || [];

        // Merge: following list + conversation partners, dedup by email
        const mergedMap = new Map();
        for (const f of connectionsList) {
          mergedMap.set(f.email, { ...f, source: 'follow' });
        }
        for (const c of conversationPartners) {
          if (!mergedMap.has(c.email)) {
            mergedMap.set(c.email, { ...c, source: 'conversation' });
          } else {
            // Add lastMessage info to existing follow contact
            const existing = mergedMap.get(c.email);
            existing.lastMessage = c.lastMessage;
            existing.lastMessageAt = c.lastMessageAt;
            existing.lastMessageBy = c.lastMessageBy;
          }
        }

        const mergedFriends = [...mergedMap.values()];
        setFriends(mergedFriends);

        if (unreadData.success) setUnreadCounts(unreadData.unreadCounts || {});

        // Deep-link: open conversation from URL param
        if (targetChatEmail && mergedFriends.length > 0) {
          const found = mergedFriends.find((f) => f.email === targetChatEmail);
          if (found) { setActiveFriend(found); setShowMobileSidebar(false); }
        }
      } catch {
        if (isMounted) setFetchError('Failed to load contacts.');
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
        const newMessages = data.messages || [];
        setMessages((prev) => {
          if (prev.length === 0) return newMessages;
          if (newMessages.length === 0) return prev;
          const lastPrevId = prev[prev.length - 1]._id;
          const lastNewId = newMessages[newMessages.length - 1]._id;
          if (lastPrevId === lastNewId && prev.length === newMessages.length) return prev;
          return newMessages;
        });
        setUnreadCounts((prev) => ({ ...prev, [friendEmail]: 0 }));
        setFetchError(null);
      }
    } catch {
      setFetchError('Could not load messages.');
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, [currentUserEmail]);

  useEffect(() => {
    const friendEmail = activeFriend?.email;
    if (!friendEmail || !currentUserEmail) return;
    fetchConversation(friendEmail, true);
  }, [activeFriend?.email, currentUserEmail, fetchConversation]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!socketNewMessage) return;
    const msg = socketNewMessage;
    const isRelevant =
      (msg.senderEmail === currentUserEmail && msg.receiverEmail === activeFriend?.email) ||
      (msg.senderEmail === activeFriend?.email && msg.receiverEmail === currentUserEmail);

    if (isRelevant) {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        const withoutPending = prev.filter(
          (m) => !(m.pending && m.senderEmail === msg.senderEmail && m.text === msg.text)
        );
        return [...withoutPending, msg];
      });
      isNearBottomRef.current = true;
    }

    if (msg.senderEmail !== currentUserEmail && msg.senderEmail !== activeFriend?.email) {
      setUnreadCounts((prev) => ({ ...prev, [msg.senderEmail]: (prev[msg.senderEmail] || 0) + 1 }));
    }

    if (msg.senderEmail !== currentUserEmail && msg.senderEmail === activeFriend?.email) {
      markRead(msg.senderEmail);
    }

    clearNewMessage();
  }, [socketNewMessage, currentUserEmail, activeFriend?.email, markRead, clearNewMessage]);

  const isTyping = !!activeFriend && socketTypingUser === activeFriend.email;

  // Handle read receipts — track which messages the other person has read
  const [readByFriend, setReadByFriend] = useState(false);
  useEffect(() => {
    if (!socketReadReceipt) return;
    if (socketReadReceipt === activeFriend?.email) {
      setReadByFriend(true);
    }
    clearReadReceipt();
  }, [socketReadReceipt, activeFriend?.email, clearReadReceipt]);

  // Reset readByFriend when switching conversations
  useEffect(() => {
    setReadByFriend(false);
  }, [activeFriend?.email]);

  // Handle socket errors
  useEffect(() => {
    if (!socketMessageError) return;
    setFetchError(socketMessageError);
    const t = setTimeout(() => setFetchError(null), 5000);
    return () => clearTimeout(t);
  }, [socketMessageError]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeFriend || !currentUserEmail || sending) return;

    const text = newMessageText.trim();
    setNewMessageText('');
    setShowEmojiPicker(false);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        senderEmail: currentUserEmail,
        receiverEmail: activeFriend.email,
        text,
        read: false,
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ]);
    isNearBottomRef.current = true;
    setTimeout(() => scrollToBottom(), 50);

    const sentViaSocket = socketSendMessage(activeFriend.email, text);

    if (!sentViaSocket) {
      setSending(true);
      try {
        const data = await apiFetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderEmail: currentUserEmail,
            receiverEmail: activeFriend.email,
            text,
          }),
        });
        if (data.success && data.message) {
          setMessages((prev) =>
            prev.some((m) => m._id === data.message._id)
              ? prev
              : [
                  ...prev.filter(
                    (m) => !(m.pending && m.senderEmail === currentUserEmail && m.text === text)
                  ),
                  data.message,
                ]
          );
        }
      } catch {
        setFetchError('Failed to send message.');
        // Mark as failed instead of removing — user can retry
        setMessages((prev) =>
          prev.map((m) => m._id === tempId ? { ...m, pending: false, failed: true } : m)
        );
      } finally {
        setSending(false);
      }
    }
  };

  const handleRetryMessage = async (msg) => {
    if (!activeFriend || !currentUserEmail) return;
    setFetchError(null);
    // Remove the failed message
    setMessages((prev) => prev.filter((m) => m._id !== msg._id));
    // Re-send it
    setNewMessageText(msg.text);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSendMessage(fakeEvent);
    }, 50);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeFriend || !currentUserEmail) return;
    e.target.value = '';

    if (file.size > 5 * 1024 * 1024) {
      setFetchError('Image must be under 5MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      // Send the image URL as a message
      setNewMessageText(url);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} };
        handleSendMessage(fakeEvent);
      }, 50);
    } catch (err) {
      setFetchError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSelectFriend = (friend) => {
    setActiveFriend(friend);
    setShowMobileSidebar(false);
    setFetchError(null);
    setShowEmojiPicker(false);
    setShowMoreMenu(false);
    if (friend.email) markRead(friend.email);
  };

  const handleInputChange = (e) => {
    setNewMessageText(e.target.value);
    if (activeFriend?.email) {
      const now = Date.now();
      if (now - lastTypingEmitRef.current > 1500) {
        lastTypingEmitRef.current = now;
        emitTyping(activeFriend.email);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        lastTypingEmitRef.current = 0;
        emitStopTyping(activeFriend.email);
      }, 2000);
    }
  };

  const handleEmojiClick = (emoji) => {
    setNewMessageText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // Role-based config
  const config = role === 'student'
    ? {
        getSubtitle: (f) => f.department || f.studentId || 'Student Member',
        getHeaderSubtitle: (f) => f.department || f.studentId || 'Student',
        emptyContactsText: 'Follow or message someone to start chatting',
        filterFn: (f, q) =>
          (f.fullName?.toLowerCase() || '').includes(q) ||
          (f.department?.toLowerCase() || '').includes(q) ||
          (f.studentId?.toLowerCase() || '').includes(q),
      }
    : {
        getSubtitle: (f) => f.jobTitle || f.organization || 'Alumni Member',
        getHeaderSubtitle: (f) => f.jobTitle || f.organization || 'Alumni',
        emptyContactsText: 'Follow or message someone to start chatting',
        filterFn: (f, q) =>
          (f.fullName?.toLowerCase() || '').includes(q) ||
          (f.jobTitle?.toLowerCase() || '').includes(q) ||
          (f.organization?.toLowerCase() || '').includes(q),
      };

  const filteredFriends = friends.filter((f) => config.filterFn(f, searchTerm.toLowerCase()));

  const sortedFriends = [...filteredFriends].sort((a, b) => {
    // 1. Unread messages first
    const aU = unreadCounts[a.email] || 0;
    const bU = unreadCounts[b.email] || 0;
    if (aU && !bU) return -1;
    if (!aU && bU) return 1;
    // 2. Most recent conversation first
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    // 3. Alphabetical fallback
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  if (sessionLoading) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center bg-[#f0f2f5]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#0084ff] animate-spin" />
          <p className="text-sm text-gray-500">Loading messenger...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center bg-[#f0f2f5] p-4">
        <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center max-w-md shadow-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-500 mt-2">Please log in to access the messenger.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] bg-[#f0f2f5] flex flex-col">
      <div className="max-w-[1400px] w-full mx-auto flex-1 flex overflow-hidden bg-white shadow-sm rounded-none sm:rounded-2xl sm:my-0 border-0 sm:border border-gray-200">

        {/* ===== SIDEBAR ===== */}
        <div className={`
          ${showMobileSidebar ? 'flex' : 'hidden'}
          md:flex flex-col w-full md:w-80 lg:w-[340px] border-r border-gray-200 bg-white
          absolute md:relative inset-0 z-20 md:z-auto
        `}>
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Messenger"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] rounded-full text-sm placeholder:text-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0084ff]/20 focus:border-[#0084ff] border border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingFriends ? (
              <div className="p-10 text-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading contacts...</p>
              </div>
            ) : sortedFriends.length === 0 ? (
              <div className="p-10 text-center">
                <UserX className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">No contacts found</p>
                <p className="text-xs text-gray-400 mt-1">{config.emptyContactsText}</p>
              </div>
            ) : (
              sortedFriends.map((friend) => {
                const isSelected = activeFriend?.email === friend.email;
                const unread = unreadCounts[friend.email] || 0;
                return (
                  <button
                    key={friend._id || friend.email}
                    onClick={() => handleSelectFriend(friend)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-gray-100 ${isSelected ? 'bg-gray-100' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      {friend.profilePictureUrl ? (
                        <img src={friend.profilePictureUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-base font-bold text-white">
                          {getInitials(friend.fullName)}
                        </div>
                      )}
                      {friend.isMutual && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 border-b border-gray-100 pb-3">
                      <div className="flex items-center justify-between">
                        <p className={`text-[15px] truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                          {friend.fullName}
                        </p>
                        {friend.lastMessageAt && (
                          <span className="ml-2 flex-shrink-0 text-[11px] text-gray-400">
                            {formatTime(friend.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-[13px] truncate max-w-[200px] ${unread > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                          {friend.lastMessage
                            ? (friend.lastMessageBy === currentUserEmail ? 'You: ' : '') + friend.lastMessage
                            : config.getSubtitle(friend)
                          }
                        </p>
                        <div className="flex items-center gap-1.5">
                          {unread > 0 && (
                            <span className="flex-shrink-0 bg-[#0084ff] text-white text-[11px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
                              {unread}
                            </span>
                          )}
                          {!friend.isMutual && !friend.lastMessage && (
                            <span className="flex-shrink-0 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <UserPlus className="w-2.5 h-2.5" /> Follows you
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ===== CHAT AREA ===== */}
        <div className={`flex-1 flex flex-col bg-white ${showMobileSidebar ? 'hidden md:flex' : 'flex'}`}>
          {activeFriend ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    {activeFriend.profilePictureUrl ? (
                      <img src={activeFriend.profilePictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-sm font-bold text-white">
                        {getInitials(activeFriend.fullName)}
                      </div>
                    )}
                    {activeFriend.isMutual && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-[15px] leading-tight">{activeFriend.fullName}</h2>
                    <p className="text-xs text-gray-500">{config.getHeaderSubtitle(activeFriend)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => { if (activeFriend?.email) callUser(activeFriend.email, 'audio'); }}
                    disabled={!!callState}
                    className="p-2.5 rounded-full hover:bg-gray-100 text-[#0084ff] transition-colors disabled:opacity-50"
                    title="Audio Call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { if (activeFriend?.email) callUser(activeFriend.email, 'video'); }}
                    disabled={!!callState}
                    className="p-2.5 rounded-full hover:bg-gray-100 text-[#0084ff] transition-colors disabled:opacity-50"
                    title="Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <div className="relative" ref={moreMenuRef}>
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-2.5 rounded-full hover:bg-gray-100 text-[#0084ff] transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                        <a
                          href={`/dashboard/${role === 'student' ? 'students' : 'alumni'}/overview?profile=${activeFriend.email}`}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4" /> View Profile
                        </a>
                        <button
                          onClick={() => { setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <BellOff className="w-4 h-4" /> Mute Notifications
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={() => { setShowMoreMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto bg-white">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#e4e6eb] flex items-center justify-center mb-4">
                      <MessageSquare className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-[17px] font-bold text-gray-900">Start a conversation</p>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs">
                      Send a message to {activeFriend.fullName}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderEmail === currentUserEmail;
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const showDivider = shouldShowDateDivider(msg.createdAt, prevMsg?.createdAt);
                    const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                    const isLastInGroup = !nextMsg || nextMsg.senderEmail !== msg.senderEmail;
                    const isFirstInGroup = !prevMsg || prevMsg.senderEmail !== msg.senderEmail;
                    const showReadTick = isMe && isLastInGroup && !msg.pending && !msg.failed;
                    const isImage = isMe && isImageUrl(msg.text);

                    return (
                      <React.Fragment key={msg._id || idx}>
                        {showDivider && (
                          <div className="flex items-center justify-center py-3">
                            <span className="text-[11px] font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                              {formatDateDivider(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : 'mt-0.5'}`}>
                          {!isMe && (
                            <div className="flex-shrink-0 w-7">
                              {isLastInGroup ? (
                                activeFriend.profilePictureUrl ? (
                                  <img src={activeFriend.profilePictureUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[9px] font-bold text-white">
                                    {getInitials(activeFriend.fullName)}
                                  </div>
                                )
                              ) : null}
                            </div>
                          )}
                          <div className={`max-w-[65%] ${isImage ? 'p-1' : 'px-3 py-2'} text-[15px] leading-[1.35] ${
                            msg.failed ? 'opacity-80 ' : msg.pending ? 'opacity-60 ' : ''
                          }${
                            isMe
                              ? `bg-[#0084ff] text-white ${
                                  isFirstInGroup && isLastInGroup ? 'rounded-[18px]' :
                                  isFirstInGroup ? 'rounded-[18px] rounded-br-[4px]' :
                                  isLastInGroup ? 'rounded-[18px] rounded-tr-[4px]' :
                                  'rounded-[18px] rounded-r-[4px]'
                                }`
                              : `bg-[#e4e6eb] text-gray-900 ${
                                  isFirstInGroup && isLastInGroup ? 'rounded-[18px]' :
                                  isFirstInGroup ? 'rounded-[18px] rounded-bl-[4px]' :
                                  isLastInGroup ? 'rounded-[18px] rounded-tl-[4px]' :
                                  'rounded-[18px] rounded-l-[4px]'
                                }`
                          }`}>
                            {isImage ? (
                              <img
                                src={msg.text.trim()}
                                alt="Shared image"
                                className="max-w-full max-h-[300px] rounded-[14px] object-cover cursor-pointer"
                                onClick={() => window.open(msg.text.trim(), '_blank')}
                                loading="lazy"
                              />
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            )}
                          </div>
                          {/* Read ticks / failed indicator */}
                          {showReadTick && (
                            readByFriend
                              ? <CheckCheck className="w-4 h-4 text-[#0084ff] flex-shrink-0 mb-0.5" />
                              : <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mb-0.5" />
                          )}
                          {isMe && msg.failed && (
                            <button
                              onClick={() => handleRetryMessage(msg)}
                              className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition-colors flex-shrink-0 mb-0.5"
                              title="Retry sending"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {isLastInGroup && (
                          <div className={`flex items-center gap-1.5 ${isMe ? 'justify-end' : 'justify-start'} ml-8 mt-0.5`}>
                            <span className="text-[11px] text-gray-500">{formatTime(msg.createdAt)}</span>
                            {isMe && msg.failed && (
                              <span className="text-[11px] text-red-500 font-medium">Failed to send</span>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Typing Indicator */}
              {isTyping && (
                <div className="px-4 sm:px-6 py-2 flex items-center gap-2">
                  <div className="flex-shrink-0 w-7">
                    {activeFriend.profilePictureUrl ? (
                      <img src={activeFriend.profilePictureUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[9px] font-bold text-white">
                        {getInitials(activeFriend.fullName)}
                      </div>
                    )}
                  </div>
                  <div className="bg-[#e4e6eb] rounded-full px-4 py-2 flex items-center gap-1">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Toast */}
              {fetchError && (
                <div className="mx-4 mb-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1">{fetchError}</span>
                  <button onClick={() => setFetchError(null)} className="p-0.5 hover:bg-amber-100 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-2 rounded-full hover:bg-gray-100 text-[#0084ff] transition-colors flex-shrink-0 disabled:opacity-50"
                    title="Send Image"
                  >
                    {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Aa"
                      value={newMessageText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                      className="w-full bg-[#f0f2f5] rounded-full px-4 py-2.5 text-[15px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0084ff]/30 border border-transparent focus:border-[#0084ff]/40 transition-all"
                    />
                  </div>
                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${showEmojiPicker ? 'bg-[#0084ff]/10 text-[#0084ff]' : 'hover:bg-gray-100 text-[#0084ff]'}`}
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 w-[280px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-50">
                        <p className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wide">Emoji</p>
                        <div className="grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
                          {EMOJIS.map((emoji, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleEmojiClick(emoji)}
                              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !newMessageText.trim()}
                    className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${
                      newMessageText.trim()
                        ? 'bg-[#0084ff] text-white hover:bg-[#0073e6]'
                        : 'text-[#0084ff] hover:bg-gray-100'
                    }`}
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
              <div className="w-24 h-24 rounded-full bg-[#e4e6eb] flex items-center justify-center mb-5">
                <MessageSquare className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-[22px] font-bold text-gray-900 mb-1">Your Messenger</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Select a conversation from the sidebar to start chatting
              </p>
            </div>
          )}
        </div>
      </div>

      <CallOverlay
        callState={callState} incomingCall={incomingCall} localStream={localStream} remoteStream={remoteStream}
        audioEnabled={audioEnabled} videoEnabled={videoEnabled} callType={callType}
        callerName={activeFriend?.fullName || incomingCall?.callerEmail?.split('@')[0]}
        calleeName={activeFriend?.fullName || currentUserEmail?.split('@')[0]}
        onAccept={answerCall} onDecline={declineCall} onEndCall={endCall}
        onToggleAudio={toggleAudio} onToggleVideo={toggleVideo}
      />

      {callFailed && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-semibold">
          {callFailed}
        </div>
      )}
    </div>
  );
}
