'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiThumbsUp, FiMessageCircle, FiShare2, FiTrash2, FiSend, FiAlertTriangle, FiLink } from 'react-icons/fi';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  { type: 'dislike', emoji: '👎', label: 'Dislike', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
  { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' },
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

export default function BlogPostCard({ post, currentUserEmail, onDelete }) {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/blog' : '';
  const shareText = `${post.authorName} posted on NUB Alumni Connect`;

  useEffect(() => {
    function handleClickOutside(e) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setShowShareMenu(false);
      }
    }
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

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

  const handleShare = async () => {
    try {
      const data = await apiFetch('/api/blog/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post._id }),
      });
      setShares(data.shares);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
      handleShare();
    } catch {
      toast.error('Failed to copy link');
    }
    setShowShareMenu(false);
  };

  const activeReaction = REACTIONS.find((r) => userReactions[r.type]);

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
              <p className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white">{post.authorName}</p>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          {currentUserEmail === post.authorEmail && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <FiTrash2 size={18} />
            </button>
          )}
        </div>

        {post.text && (
          <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-sm sm:text-base leading-relaxed mb-4">
            {post.text}
          </p>
        )}

        {post.images && post.images.length > 0 && (
          <div className={`grid gap-1.5 sm:gap-2 rounded-xl overflow-hidden ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                loading="lazy"
                className="w-full h-48 sm:h-56 lg:h-64 object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
        {totalReactions > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="text-base">
              {activeReaction ? activeReaction.emoji : '👍'}
            </span>
            <span className="font-medium">{totalReactions}</span>
          </span>
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
        <div className="relative flex-1">
          <button
            onClick={() => handleReaction(activeReaction?.type || 'like')}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
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

          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white dark:bg-zinc-800 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 z-10"
              >
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleReaction(r.type)}
                    className="text-2xl sm:text-3xl hover:scale-125 transition-transform p-1"
                    title={r.label}
                  >
                    {r.emoji}
                  </button>
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

        <div className="flex-1 relative" ref={shareMenuRef}>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <FiShare2 size={20} />
            <span>Share</span>
          </button>

          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-2 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-2 min-w-[180px] z-20"
              >
                <FacebookShareButton url={shareUrl} quote={shareText} onShareWindowClose={handleShare}>
                  <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors w-full text-left cursor-pointer">
                    <span className="text-blue-600 font-bold text-sm">f</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Facebook</span>
                  </div>
                </FacebookShareButton>
                <TwitterShareButton url={shareUrl} title={shareText} onShareWindowClose={handleShare}>
                  <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors w-full text-left cursor-pointer">
                    <span className="text-sky-500 font-bold text-sm">𝕏</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Twitter</span>
                  </div>
                </TwitterShareButton>
                <WhatsappShareButton url={shareUrl} title={shareText} onShareWindowClose={handleShare}>
                  <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors w-full text-left cursor-pointer">
                    <span className="text-green-500 font-bold text-sm">💬</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">WhatsApp</span>
                  </div>
                </WhatsappShareButton>
                <div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors w-full text-left"
                >
                  <FiLink size={14} className="text-zinc-500" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Copy Link</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
    </motion.div>
  );
}
