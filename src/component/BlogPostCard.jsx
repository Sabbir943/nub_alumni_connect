'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiThumbsUp, FiMessageCircle, FiShare2, FiTrash2, FiSend, FiAlertTriangle, FiLink, FiX, FiVideo, FiZoomIn, FiEdit2, FiChevronDown, FiImage } from 'react-icons/fi';
import { apiFetch } from '@/lib/api';
import { getVideoEmbedUrl, uploadImage, uploadVideo } from '@/lib/upload';
import { CATEGORIES } from './BlogSidebar';
import MediaLightbox from './MediaLightbox';
import toast from 'react-hot-toast';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
  { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
  { type: 'dislike', emoji: '👎', label: 'Dislike', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
];

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function CommentItem({ comment, currentUserEmail, onDelete, onReply, depth = 0 }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(replyText.trim(), comment._id);
      setReplyText('');
      setShowReplyInput(false);
    } catch {
      // handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 ? 'ml-8 sm:ml-12' : ''}>
      <div className="flex gap-3 group">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0 overflow-hidden">
          {comment.authorAvatar ? (
            <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            comment.authorName?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5">
            <p className="text-[11px] sm:text-xs font-semibold text-zinc-900 dark:text-white">{comment.authorName}</p>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 break-words">{comment.text}</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-1 px-2">
            <span className="text-[10px] sm:text-xs text-zinc-400">{timeAgo(comment.createdAt)}</span>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-[10px] sm:text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Reply
            </button>
            {currentUserEmail === comment.authorEmail && (
              <button
                onClick={() => onDelete(comment._id)}
                className="text-[10px] sm:text-xs font-semibold text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReplyInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-8 sm:ml-12 mt-2 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder={`Reply to ${comment.authorName}...`}
                className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleReply}
                disabled={submitting || !replyText.trim()}
                className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors shrink-0"
              >
                <FiSend size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUserEmail={currentUserEmail}
              onDelete={onDelete}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BlogPostCard({ post, currentUserEmail, onDelete, onEdit }) {
  const [reactions, setReactions] = useState(post.reactions || {});
  const [userReactions, setUserReactions] = useState(post.userReactions || {});
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [shares, setShares] = useState(post.shares || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reactionPeople, setReactionPeople] = useState([]);
  const [showReactionPopover, setShowReactionPopover] = useState(false);
  const [loadingReactionPeople, setLoadingReactionPeople] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [textExpanded, setTextExpanded] = useState(false);
  const [isLongText, setIsLongText] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxVideo, setLightboxVideo] = useState(null);
  const textRef = useRef(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [editCategory, setEditCategory] = useState(post.category || 'General');
  const [showEditCategoryPicker, setShowEditCategoryPicker] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editImages, setEditImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [newVideoPreview, setNewVideoPreview] = useState('');
  const [editMediaPicker, setEditMediaPicker] = useState(false);
  const editImageInputRef = useRef(null);
  const editVideoInputRef = useRef(null);

  const openEdit = () => {
    if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
    setEditText(post.text || '');
    setEditCategory(post.category || 'General');
    setEditImages(post.images || []);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setEditVideoUrl(post.videoUrl || '');
    setNewVideoFile(null);
    setNewVideoPreview('');
    setShowEditCategoryPicker(false);
    setEditMediaPicker(false);
    setShowEdit(true);
  };

  const handleEditImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (editVideoUrl || newVideoFile) {
      toast.error('Remove video first to add images');
      e.target.value = '';
      return;
    }
    if (editImages.length + newImageFiles.length + files.length > 4) {
      toast.error('Maximum 4 images allowed');
      e.target.value = '';
      return;
    }
    setNewImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewImagePreviews((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
    setEditMediaPicker(false);
    e.target.value = '';
  };

  const removeEditImage = (index) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditVideoUrlSubmit = () => {
    const url = editVideoUrl.trim();
    if (!url) return;
    const embedUrl = getVideoEmbedUrl(url);
    if (!embedUrl) {
      toast.error('Invalid video URL. Use YouTube or Vimeo links.');
      return;
    }
    if (editImages.length > 0 || newImageFiles.length > 0) {
      toast.error('Remove images first to add a video');
      return;
    }
    setEditVideoUrl(embedUrl);
    setEditMediaPicker(false);
    toast.success('Video link added!');
  };

  const handleEditVideoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (editImages.length > 0 || newImageFiles.length > 0) {
      toast.error('Remove images first to add a video');
      e.target.value = '';
      return;
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Video must be under 50MB');
      e.target.value = '';
      return;
    }
    if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
    setNewVideoFile(file);
    setNewVideoPreview(URL.createObjectURL(file));
    setEditMediaPicker(false);
    toast.success('Video selected! Will upload when you save.');
    e.target.value = '';
  };

  const removeEditVideo = () => {
    if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
    setNewVideoFile(null);
    setNewVideoPreview('');
    setEditVideoUrl('');
  };

  const handleSaveEdit = async () => {
    if (
      !editText.trim() &&
      editImages.length === 0 &&
      newImageFiles.length === 0 &&
      !editVideoUrl &&
      !newVideoFile
    ) {
      toast.error('Post must have some text or media');
      return;
    }
    if (editImages.length + newImageFiles.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    setSavingEdit(true);
    try {
      const uploaded = [...editImages];
      if (newImageFiles.length > 0) {
        const uploadedNew = await Promise.all(newImageFiles.map((img) => uploadImage(img)));
        uploaded.push(...uploadedNew);
      }
      let video = editVideoUrl;
      if (newVideoFile) {
        const result = await uploadVideo(newVideoFile);
        video = result.url;
      }
      const data = await apiFetch(`/api/blog/${post._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUserEmail },
        body: JSON.stringify({
          text: editText.trim(),
          category: editCategory,
          images: uploaded,
          videoUrl: video || '',
        }),
      });
      onEdit?.(post._id, data.post);
      setShowEdit(false);
      toast.success('Post updated');
    } catch {
      toast.error('Failed to update post');
    } finally {
      setSavingEdit(false);
    }
  };

  const checkTextLength = useCallback(() => {
    if (textRef.current) {
      const lineHeight = parseFloat(getComputedStyle(textRef.current).lineHeight);
      const maxHeight = lineHeight * 3.5;
      setIsLongText(textRef.current.scrollHeight > maxHeight + 2);
    }
  }, []);

  useEffect(() => {
    if (post.text) {
      checkTextLength();
    }
  }, [post.text, checkTextLength]);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/blog' : '';
  const shareText = `${post.authorName} posted on NUB Alumni Connect`;

  const totalReactions = Object.values(reactions).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  const handleReaction = async (type) => {
    const prev = { ...reactions };
    const prevUser = { ...userReactions };

    const wasActive = userReactions[type];
    setUserReactions((u) => {
      const next = { ...u };
      if (wasActive) {
        delete next[type];
      } else {
        for (const t of Object.keys(next)) delete next[t];
        next[type] = true;
      }
      return next;
    });
    setReactions((r) => {
      const next = { ...r };
      for (const t of REACTIONS.map((r) => r.type)) {
        next[t] = Array.isArray(next[t]) ? [...next[t]] : [];
      }
      if (wasActive) {
        next[type] = next[type].filter((e) => e !== currentUserEmail);
      } else {
        for (const t of Object.keys(next)) {
          if (t !== type) next[t] = next[t].filter((e) => e !== currentUserEmail);
        }
        if (!next[type].includes(currentUserEmail)) next[type].push(currentUserEmail);
      }
      return next;
    });
    setShowReactions(false);

    try {
      const data = await apiFetch(`/api/blog/${post._id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUserEmail, type }),
      });
      setReactions(data.reactions);
      setUserReactions(data.userReactions);
    } catch {
      setReactions(prev);
      setUserReactions(prevUser);
    }
  };

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    if (comments.length > 0) return;
    setLoadingComments(true);
    try {
      const data = await apiFetch(`/api/blog/${post._id}/comments`);
      setComments(data.comments);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const data = await apiFetch(`/api/blog/${post._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorEmail: currentUserEmail, text: commentText.trim() }),
      });
      setComments((prev) => [data.comment, ...prev]);
      setCommentCount((c) => c + 1);
      setCommentText('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReply = async (text, parentId) => {
    const data = await apiFetch(`/api/blog/${post._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorEmail: currentUserEmail, text, parentId }),
    });
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === parentId) {
          return { ...c, replies: [...(c.replies || []), data.comment] };
        }
        return c;
      })
    );
    setCommentCount((c) => c + 1);
    return data;
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await apiFetch(`/api/blog/${post._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUserEmail },
      });
      setComments((prev) => {
        return prev
          .filter((c) => c._id !== commentId)
          .map((c) => ({
            ...c,
            replies: (c.replies || []).filter((r) => r._id !== commentId),
          }));
      });
      setCommentCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const incrementShare = async () => {
    try {
      const data = await apiFetch('/api/blog/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post._id }),
      });
      setShares(data.shares);
    } catch {}
  };

  const openShareWindow = (url) => {
    window.open(url, '_blank', 'width=600,height=500,scrollbars=yes');
  };

  const handleFacebookShare = () => {
    const msg = shareMessage.trim();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(msg || shareText)}`;
    openShareWindow(url);
    incrementShare();
    setShowShareModal(false);
    setShareMessage('');
    toast.success('Opening Facebook...');
  };

  const handleTwitterShare = () => {
    const msg = shareMessage.trim();
    const text = msg ? `${msg}\n\n${shareText}` : shareText;
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    openShareWindow(url);
    incrementShare();
    setShowShareModal(false);
    setShareMessage('');
    toast.success('Opening Twitter...');
  };

  const handleWhatsappShare = () => {
    const msg = shareMessage.trim();
    const text = msg ? `${msg}\n\n${shareText}\n${shareUrl}` : `${shareText}\n${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    openShareWindow(url);
    incrementShare();
    setShowShareModal(false);
    setShareMessage('');
    toast.success('Opening WhatsApp...');
  };

  const handleLinkedinShare = () => {
    const msg = shareMessage.trim();
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(msg || shareText)}`;
    openShareWindow(url);
    incrementShare();
    setShowShareModal(false);
    setShareMessage('');
    toast.success('Opening LinkedIn...');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
      incrementShare();
    } catch {
      toast.error('Failed to copy link');
    }
    setShowShareModal(false);
    setShareMessage('');
  };

  const activeReaction = REACTIONS.find((r) => userReactions[r.type]);
  const usedReactions = REACTIONS.filter((r) => (Array.isArray(reactions[r.type]) ? reactions[r.type].length > 0 : false));

  const reactionEmoji = (type) => REACTIONS.find((r) => r.type === type)?.emoji || '👍';

  const loadReactionPeople = useCallback(async () => {
    if (reactionPeople.length > 0 || totalReactions === 0) return;
    setLoadingReactionPeople(true);
    try {
      const data = await apiFetch(`/api/blog/${post._id}/reactions/people`);
      setReactionPeople(data.people || []);
    } catch {
      // silent
    } finally {
      setLoadingReactionPeople(false);
    }
  }, [post._id, reactionPeople.length, totalReactions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800 overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
              {post.authorAvatar ? (
                <img src={post.authorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                post.authorName?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white">{post.authorName}</p>
                {post.authorRole && (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      post.authorRole === 'Admin'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : post.authorRole === 'Alumni'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    }`}
                  >
                    {post.authorRole}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {timeAgo(post.createdAt)}
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <span className="text-zinc-400 dark:text-zinc-500"> · Edited</span>
                )}
              </p>
            </div>
          </div>
          {currentUserEmail === post.authorEmail && (
            <div className="flex items-center gap-1">
              <button
                onClick={openEdit}
                title="Edit post"
                className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
              >
                <FiEdit2 size={18} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete post"
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {post.category && post.category !== 'General' && (
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-semibold">
              {post.category}
            </span>
            {(post.tags || []).map((tag) => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md text-[10px] font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {post.text && (
          <div className="mb-4">
            <p
              ref={textRef}
              className={`text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-sm sm:text-base leading-relaxed ${
                isLongText && !textExpanded ? 'line-clamp-4' : ''
              }`}
            >
              {post.text}
            </p>
            {isLongText && (
              <button
                onClick={() => setTextExpanded(!textExpanded)}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mt-1 transition-colors"
              >
                {textExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        )}

        {post.images && post.images.length > 0 && (
          <div className={`grid gap-1.5 sm:gap-2 rounded-xl overflow-hidden ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.map((url, i) => (
              <button
                key={i}
                onClick={() => { setLightboxVideo(null); setLightboxIndex(i); }}
                className={`group relative block w-full overflow-hidden ${post.images.length === 1 ? '' : (post.images.length === 3 && i === 0 ? 'col-span-2' : '')}`}
                title="Click to view"
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                    post.images.length === 1
                      ? 'h-auto max-h-[520px] cursor-zoom-in'
                      : post.images.length === 3 && i === 0
                      ? 'h-48 sm:h-56 lg:h-72 cursor-zoom-in'
                      : 'h-48 sm:h-56 lg:h-64 cursor-zoom-in'
                  }`}
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <span className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <FiZoomIn className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        )}

        {post.videoUrl && (
          <button
            onClick={() => { setLightboxIndex(null); setLightboxVideo(post.videoUrl); }}
            className="group relative block w-full rounded-xl overflow-hidden bg-black mt-1.5 sm:mt-2"
            title="Click to view"
          >
            {getVideoEmbedUrl(post.videoUrl)?.includes('youtube.com/embed') || getVideoEmbedUrl(post.videoUrl)?.includes('player.vimeo.com') ? (
              <iframe
                src={getVideoEmbedUrl(post.videoUrl)}
                className="w-full h-56 sm:h-64 lg:h-72 pointer-events-none"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={post.videoUrl}
                className="w-full h-56 sm:h-64 lg:h-72 object-cover pointer-events-none"
                preload="metadata"
              />
            )}
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
            <span className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <FiZoomIn className="w-4 h-4" />
            </span>
          </button>
        )}
      </div>

      <div className="px-4 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
        {totalReactions > 0 ? (
          <div
            className="relative flex items-center"
            onMouseEnter={() => { setShowReactionPopover(true); loadReactionPeople(); }}
            onMouseLeave={() => setShowReactionPopover(false)}
          >
            <button className="flex items-center gap-1.5 group">
              <span className="flex -space-x-1.5">
                {usedReactions.slice(0, 4).map((r) => (
                  <span
                    key={r.type}
                    className="w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[11px] leading-none shadow-sm"
                    title={r.label}
                  >
                    {r.emoji}
                  </span>
                ))}
              </span>
              <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 underline-offset-2 group-hover:underline transition-colors">
                {totalReactions}
              </span>
            </button>

            {/* Who reacted popover */}
            <AnimatePresence>
              {showReactionPopover && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onMouseEnter={() => { setShowReactionPopover(true); loadReactionPeople(); }}
                  onMouseLeave={() => setShowReactionPopover(false)}
                  className="absolute bottom-full left-0 mb-2 w-60 sm:w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/15 border border-zinc-200 dark:border-zinc-700 z-30 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-800/50 dark:to-zinc-800/50">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Reactions</h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                      {totalReactions}
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {loadingReactionPeople ? (
                      <div className="space-y-2 p-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            <div className="flex-1 h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                          </div>
                        ))}
                      </div>
                    ) : reactionPeople.length === 0 ? (
                      <p className="text-sm text-zinc-400 text-center py-3">No reactions yet</p>
                    ) : (
                      reactionPeople.map((p) => (
                        <div
                          key={p.email}
                          className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                            {p.avatar ? (
                              <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              p.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <p className="flex-1 min-w-0 text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {p.email === currentUserEmail ? 'You' : p.name}
                          </p>
                          <span className="text-lg shrink-0" title={p.type}>
                            {reactionEmoji(p.type)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-4 ml-auto">
          {commentCount > 0 && (
            <span className="font-medium">{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
          )}
          {shares > 0 && (
            <span className="font-medium">{shares} share{shares !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className="px-3 sm:px-4 lg:px-5 py-1 flex items-center border-t border-zinc-100 dark:border-zinc-800">
        <div className="relative flex-1" onMouseLeave={() => setShowReactions(false)}>
          <button
            onClick={() => handleReaction(activeReaction?.type || 'like')}
            onMouseEnter={() => setShowReactions(true)}
            className={`flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold rounded-xl transition-colors ${
              activeReaction
                ? `${activeReaction.color}`
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {activeReaction ? (
              <span className="text-lg">{activeReaction.emoji}</span>
            ) : (
              <FiThumbsUp size={20} />
            )}
            <span>{activeReaction ? activeReaction.label : 'Like'}</span>
          </button>

          {/* Facebook-style reaction picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.6 }}
                transition={{ type: 'spring', damping: 16, stiffness: 320 }}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className="absolute bottom-full left-0 mb-2.5 flex items-end gap-0.5 sm:gap-1 bg-white dark:bg-zinc-800 rounded-full shadow-2xl shadow-black/20 border border-zinc-200 dark:border-zinc-700 px-3 py-2 z-20"
              >
                {REACTIONS.map((r, i) => (
                  <motion.button
                    key={r.type}
                    initial={{ opacity: 0, y: 26, scale: 0.4 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 26, scale: 0.4 }}
                    transition={{ delay: i * 0.045, type: 'spring', damping: 13, stiffness: 340 }}
                    whileHover={{ scale: 1.35, y: -7, rotate: -8 }}
                    onClick={() => handleReaction(r.type)}
                    className="relative text-2xl sm:text-3xl p-1 cursor-pointer will-change-transform"
                    title={r.label}
                  >
                    {r.emoji}
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-semibold rounded-md opacity-0 pointer-events-none whitespace-nowrap transition-opacity">
                      {r.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={loadComments}
          className="flex items-center justify-center gap-2 flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <FiMessageCircle size={20} />
          <span>Comments</span>
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center justify-center gap-2 flex-1 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
        >
          <FiShare2 size={20} />
          <span>Share</span>
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-100 dark:border-zinc-800 overflow-hidden"
          >
            <div className="p-4 sm:p-5">
              <div className="flex gap-3 mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {currentUserEmail?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm sm:text-base text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                  <button
                    onClick={handleComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="p-2.5 sm:p-3 bg-blue-600 text-white rounded-full disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <FiSend size={16} />
                  </button>
                </div>
              </div>

              {loadingComments ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      currentUserEmail={currentUserEmail}
                      onDelete={handleDeleteComment}
                      onReply={handleReply}
                    />
                  ))}
                  {comments.length === 0 && (
                    <p className="text-center text-sm text-zinc-400 py-4">No comments yet</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
            onClick={() => { setShowShareModal(false); setShareMessage(''); }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Share to...</h3>
                <button
                  onClick={() => { setShowShareModal(false); setShareMessage(''); }}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* User input */}
              <div className="p-4 sm:p-5">
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {currentUserEmail?.charAt(0).toUpperCase()}
                  </div>
                  <textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Say something about this..."
                    className="flex-1 min-h-[60px] resize-none bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 text-sm outline-none"
                  />
                </div>

                {/* Post preview */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 sm:p-4 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                      {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        post.authorName?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">{post.authorName}</p>
                      <p className="text-[10px] text-zinc-400">{timeAgo(post.createdAt)}</p>
                    </div>
                  </div>
                  {post.text && (
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-3 mb-2">{post.text}</p>
                  )}
                  {post.images && post.images.length > 0 && (
                    <img src={post.images[0]} alt="" className="w-full h-32 object-cover rounded-lg" />
                  )}
                  <p className="text-[10px] text-zinc-400 mt-2 truncate">{shareUrl}</p>
                </div>
              </div>

              {/* Share buttons */}
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2">
                <button
                  onClick={handleFacebookShare}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    f
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">Facebook</p>
                    <p className="text-[11px] text-zinc-400">Share on your timeline</p>
                  </div>
                </button>

                <button
                  onClick={handleTwitterShare}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-base shrink-0">
                    𝕏
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">Twitter</p>
                    <p className="text-[11px] text-zinc-400">Post a tweet</p>
                  </div>
                </button>

                <button
                  onClick={handleWhatsappShare}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    💬
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">WhatsApp</p>
                    <p className="text-[11px] text-zinc-400">Send to chat</p>
                  </div>
                </button>

                <button
                  onClick={handleLinkedinShare}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    in
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">LinkedIn</p>
                    <p className="text-[11px] text-zinc-400">Share on your feed</p>
                  </div>
                </button>

                <div className="border-t border-zinc-200 dark:border-zinc-700 my-2" />

                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                    <FiLink size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">Copy Link</p>
                    <p className="text-[11px] text-zinc-400">Copy to clipboard</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Post Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
            onClick={() => setShowEdit(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white">Edit Post</h3>
                <button
                  onClick={() => setShowEdit(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                >
                  <FiX size={22} />
                </button>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm overflow-hidden">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      post.authorName?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white">{post.authorName}</p>
                    <p className="text-xs text-zinc-400">
                      {post.category} · Edited just now
                    </p>
                  </div>
                </div>

                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full min-h-[120px] sm:min-h-[140px] resize-none bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-base sm:text-lg outline-none leading-relaxed"
                  autoFocus
                />

                {/* Media editor */}
                <div className="mt-4">
                  {/* Existing + new images */}
                  {(editImages.length > 0 || newImagePreviews.length > 0) && (
                    <div className={`grid gap-1.5 sm:gap-2 ${editImages.length + newImagePreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {editImages.map((url, i) => (
                        <div key={`e-${i}`} className="relative group">
                          <img src={url} alt="" className="w-full h-24 sm:h-28 object-cover rounded-lg" />
                          <button
                            onClick={() => removeEditImage(i)}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <FiX size={13} />
                          </button>
                        </div>
                      ))}
                      {newImagePreviews.map((src, i) => (
                        <div key={`n-${i}`} className="relative group">
                          <img src={src} alt="" className="w-full h-24 sm:h-28 object-cover rounded-lg" />
                          <button
                            onClick={() => removeNewImage(i)}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <FiX size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current / new video */}
                  {(editVideoUrl || (newVideoFile && newVideoPreview)) && (
                    <div className="relative mt-2">
                      <div className="rounded-xl overflow-hidden bg-black">
                        {newVideoFile ? (
                          <video src={newVideoPreview} className="w-full h-44 sm:h-52 object-cover pointer-events-none" />
                        ) : editVideoUrl.includes('youtube.com/embed') || editVideoUrl.includes('player.vimeo.com') ? (
                          <iframe
                            src={editVideoUrl}
                            className="w-full h-44 sm:h-52 pointer-events-none"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video src={editVideoUrl} className="w-full h-44 sm:h-52 object-cover pointer-events-none" />
                        )}
                      </div>
                      <button
                        onClick={removeEditVideo}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                        title="Remove video"
                      >
                        <FiX size={13} />
                      </button>
                    </div>
                  )}

                  {/* Add / replace media */}
                  {!editVideoUrl && !newVideoFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setEditMediaPicker(editMediaPicker ? false : 'menu')}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <FiImage size={15} className="text-green-500" />
                        Add Photo/Video
                      </button>
                    </div>
                  )}

                  {/* Edit media picker */}
                  <AnimatePresence>
                    {editMediaPicker === 'menu' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1.5 w-56"
                      >
                        <button
                          onClick={() => {
                            if (editImages.length + newImageFiles.length >= 4) {
                              toast.error('Maximum 4 images allowed');
                              setEditMediaPicker(false);
                              return;
                            }
                            editImageInputRef.current?.click();
                            setEditMediaPicker(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <FiImage size={16} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-left text-xs">
                            <p className="font-semibold">Image</p>
                            <p className="text-[10px] text-zinc-400">Add photos (max 4)</p>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setEditVideoUrl('');
                            setEditMediaPicker('url');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <FiLink size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-left text-xs">
                            <p className="font-semibold">Paste Video URL</p>
                            <p className="text-[10px] text-zinc-400">YouTube or Vimeo</p>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setEditMediaPicker(false);
                            editVideoInputRef.current?.click();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <FiVideo size={16} className="text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-left text-xs">
                            <p className="font-semibold">Upload Video</p>
                            <p className="text-[10px] text-zinc-400">MP4, MOV, WebM (max 50MB)</p>
                          </div>
                        </button>
                      </motion.div>
                    )}
                    {editMediaPicker === 'url' && !editVideoUrl && !newVideoFile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-2 flex gap-2"
                      >
                        <input
                          type="url"
                          value={editVideoUrl}
                          onChange={(e) => setEditVideoUrl(e.target.value)}
                          placeholder="Paste YouTube or Vimeo URL..."
                          className="flex-1 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleEditVideoUrlSubmit()}
                        />
                        <button
                          onClick={handleEditVideoUrlSubmit}
                          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input
                    ref={editImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditImageSelect}
                    className="hidden"
                  />
                  <input
                    ref={editVideoInputRef}
                    type="file"
                    accept="video/mp4,video/mov,video/webm,video/quicktime"
                    onChange={handleEditVideoFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="mt-4 relative">
                  <button
                    onClick={() => setShowEditCategoryPicker(!showEditCategoryPicker)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    📁 {editCategory}
                    <FiChevronDown size={14} />
                  </button>
                  {showEditCategoryPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-10 w-48 max-h-56 overflow-y-auto">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.name}
                          onClick={() => { setEditCategory(cat.name); setShowEditCategoryPicker(false); }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            editCategory === cat.name
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setShowEdit(false)}
                  disabled={savingEdit}
                  className="px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || (!editText.trim() && editImages.length === 0 && newImageFiles.length === 0 && !editVideoUrl && !newVideoFile)}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                >
                  {savingEdit ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {newImageFiles.length > 0 || newVideoFile ? 'Uploading...' : 'Saving...'}
                    </span>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FiAlertTriangle className="text-red-500" size={28} />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2">Delete Post?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete?.(post._id);
                  }}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    {/* Media Lightbox (Facebook-style fullscreen viewer) */}
      <AnimatePresence>
        {(lightboxIndex !== null || lightboxVideo) && (
          <MediaLightbox
            images={post.images || []}
            videoUrl={lightboxVideo}
            initialIndex={lightboxIndex || 0}
            onClose={() => { setLightboxIndex(null); setLightboxVideo(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
