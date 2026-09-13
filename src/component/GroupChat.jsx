'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Search, Users, Loader2, AlertTriangle,
  Phone, Video, MoreVertical, Smile, ChevronLeft,
  ImageIcon, Info, X, RefreshCw, Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { useGroupSocket } from '@/lib/useGroupSocket';

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊',
  '😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋',
  '👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘',
  '👌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐',
  '❤️','🔥','💯','✨','🎉','🎊','💕','💞','💓','💗',
  '🙏','💪','🫶','👋','🤙','👏','🤝','🫡','🤔','😏',
];

const getInitials = (name) => {
  if (!name) return '?';
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
    /^https?:\/\/i\.imgbb\.com\//i.test(text.trim());
};

export default function GroupChat({ group, currentUserEmail, onBack, onShowInfo, role, onStartCall }) {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessageText, setNewMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [senderProfiles, setSenderProfiles] = useState({});

  const typingTimeoutRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  const {
    newGroupMessage,
    groupTypingUsers,
    sendGroupMessage,
    emitGroupTyping,
    emitGroupStopTyping,
    clearNewGroupMessage,
  } = useGroupSocket(currentUserEmail);

  const groupId = group._id;
  const typingUsers = (groupTypingUsers[groupId] || []).filter((e) => e !== currentUserEmail);

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
    if (!loadingMessages) {
      inputRef.current?.focus();
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [loadingMessages]);

  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch messages
  useEffect(() => {
    if (!groupId) return;
    let isMounted = true;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await apiFetch(
          `/api/groups/${groupId}/messages?email=${encodeURIComponent(currentUserEmail)}&limit=50`
        );
        if (isMounted && data.success) {
          setMessages(data.messages || []);
          setFetchError(null);
        }
      } catch {
        if (isMounted) setFetchError('Could not load messages.');
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchMessages();
    return () => { isMounted = false; };
  }, [groupId, currentUserEmail]);

  // Fetch sender profiles for name/avatar display
  useEffect(() => {
    if (!group?.participants) return;
    const profiles = {};
    group.participants.forEach((p) => {
      if (p.name) {
        profiles[p.email] = { name: p.name, avatar: p.avatar };
      }
    });
    setSenderProfiles(profiles);
  }, [group?.participants]);

  // Handle incoming socket messages
  useEffect(() => {
    if (!newGroupMessage || newGroupMessage.groupId !== groupId) return;
    const msg = newGroupMessage.message;

    setMessages((prev) => {
      if (prev.some((m) => m._id === msg._id)) return prev;
      const withoutPending = prev.filter(
        (m) => !(m.pending && m.senderEmail === msg.senderEmail && m.text === msg.text)
      );
      return [...withoutPending, msg];
    });
    isNearBottomRef.current = true;

    if (msg.senderEmail !== currentUserEmail) {
      setSenderProfiles((prev) => ({
        ...prev,
        [msg.senderEmail]: {
          name: msg.senderName || prev[msg.senderEmail]?.name,
          avatar: msg.senderAvatar || prev[msg.senderEmail]?.avatar,
        },
      }));
    }

    clearNewGroupMessage();
  }, [newGroupMessage, groupId, currentUserEmail, clearNewGroupMessage]);

  // Mark messages as read
  useEffect(() => {
    if (!groupId || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.senderEmail !== currentUserEmail) {
      apiFetch(`/api/groups/${groupId}/unread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail, after: lastMsg.createdAt }),
      }).catch(() => {});
    }
  }, [messages, groupId, currentUserEmail]);

  const getSenderName = (email) => {
    if (senderProfiles[email]) return senderProfiles[email].name;
    const participant = group.participants?.find((p) => p.email === email);
    return participant?.name || email.split('@')[0];
  };

  const getSenderAvatar = (email) => {
    if (senderProfiles[email]?.avatar) return senderProfiles[email].avatar;
    const participant = group.participants?.find((p) => p.email === email);
    return participant?.avatar || null;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || sending) return;

    const text = newMessageText.trim();
    setNewMessageText('');
    setShowEmojiPicker(false);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        groupId,
        senderEmail: currentUserEmail,
        text,
        type: 'text',
        readBy: [{ email: currentUserEmail, readAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        senderName: getSenderName(currentUserEmail),
        senderAvatar: getSenderAvatar(currentUserEmail),
        pending: true,
      },
    ]);
    isNearBottomRef.current = true;
    setTimeout(() => scrollToBottom(), 50);

    const sentViaSocket = sendGroupMessage(groupId, text);

    if (!sentViaSocket) {
      setSending(true);
      try {
        const data = await apiFetch(`/api/groups/${groupId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderEmail: currentUserEmail,
            text,
            type: 'text',
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
        setMessages((prev) =>
          prev.map((m) => m._id === tempId ? { ...m, pending: false, failed: true } : m)
        );
      } finally {
        setSending(false);
      }
    }
  };

  const handleRetryMessage = async (msg) => {
    setFetchError(null);
    setMessages((prev) => prev.filter((m) => m._id !== msg._id));
    setNewMessageText(msg.text);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSendMessage(fakeEvent);
    }, 50);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) {
      setFetchError('Image must be under 5MB.');
      return;
    }
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
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

  const handleInputChange = (e) => {
    setNewMessageText(e.target.value);
    const now = Date.now();
    if (now - lastTypingEmitRef.current > 1500) {
      lastTypingEmitRef.current = now;
      emitGroupTyping(groupId);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      lastTypingEmitRef.current = 0;
      emitGroupStopTyping(groupId);
    }, 2000);
  };

  const handleEmojiClick = (emoji) => {
    setNewMessageText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleStartCall = (type) => {
    if (onStartCall) onStartCall(type);
  };

  const onlineCount = group.participants?.length || 0;

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {group.avatar ? (
            <img src={group.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0084ff] to-[#0066cc] flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-gray-900 text-[15px] leading-tight">{group.name}</h2>
            <p className="text-xs text-gray-500">
              {group.participants?.length || 0} members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleStartCall('audio')}
            className="p-2.5 rounded-full hover:bg-gray-100 text-[#0084ff] transition-colors"
            title="Group Audio Call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleStartCall('video')}
            className="p-2.5 rounded-full hover:bg-gray-100 text-[#0084ff] transition-colors"
            title="Group Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={onShowInfo}
            className="p-2.5 rounded-full hover:bg-gray-100 text-[#0084ff] transition-colors"
            title="Group Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto bg-white">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#e4e6eb] flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-[17px] font-bold text-gray-900">Start a group conversation</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              Send the first message to {group.name}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.type === 'system') {
              return (
                <div key={msg._id || idx} className="flex items-center justify-center py-2">
                  <span className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isMe = msg.senderEmail === currentUserEmail;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
            const showDivider = shouldShowDateDivider(msg.createdAt, prevMsg?.createdAt);
            const isFirstInGroup = !prevMsg || prevMsg.senderEmail !== msg.senderEmail || prevMsg.type === 'system';
            const isLastInGroup = !nextMsg || nextMsg.senderEmail !== msg.senderEmail || nextMsg.type === 'system';
            const isImage = isImageUrl(msg.text);
            const senderName = getSenderName(msg.senderEmail);
            const senderAvatar = getSenderAvatar(msg.senderEmail);

            return (
              <React.Fragment key={msg._id || idx}>
                {showDivider && (
                  <div className="flex items-center justify-center py-3">
                    <span className="text-[11px] font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                      {formatDateDivider(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}>
                  {!isMe && (
                    <div className="flex-shrink-0 w-7">
                      {isLastInGroup ? (
                        senderAvatar ? (
                          <img src={senderAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[9px] font-bold text-white">
                            {getInitials(senderName)}
                          </div>
                        )
                      ) : null}
                    </div>
                  )}
                  <div className={`max-w-[65%] ${isImage ? 'p-1' : ''}`}>
                    {isFirstInGroup && !isMe && (
                      <p className="text-[11px] font-semibold text-[#0084ff] mb-0.5 ml-1">{senderName}</p>
                    )}
                    <div className={`${isImage ? '' : 'px-3 py-2'} text-[15px] leading-[1.35] ${
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
                    {isMe && msg.failed && (
                      <button
                        onClick={() => handleRetryMessage(msg)}
                        className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition-colors flex-shrink-0 mt-0.5"
                        title="Retry sending"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
      {typingUsers.length > 0 && (
        <div className="px-4 sm:px-6 py-2 flex items-center gap-2">
          <div className="flex gap-1 -space-x-1">
            {typingUsers.slice(0, 3).map((email) => {
              const avatar = getSenderAvatar(email);
              return avatar ? (
                <img key={email} src={avatar} alt="" className="w-5 h-5 rounded-full border border-white" />
              ) : (
                <div key={email} className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[7px] font-bold text-white border border-white">
                  {getInitials(getSenderName(email))}
                </div>
              );
            })}
          </div>
          <div className="bg-[#e4e6eb] rounded-full px-4 py-2 flex items-center gap-1">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[11px] text-gray-500 ml-1">
              {typingUsers.length === 1
                ? `${getSenderName(typingUsers[0])} is typing...`
                : typingUsers.length === 2
                ? `${getSenderName(typingUsers[0])} and ${getSenderName(typingUsers[1])} are typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
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
    </div>
  );
}
