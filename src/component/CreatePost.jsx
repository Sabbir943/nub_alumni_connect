'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImage, FiX, FiSend, FiChevronDown, FiLink, FiVideo } from 'react-icons/fi';
import { uploadImage, uploadVideo, getVideoEmbedUrl } from '@/lib/upload';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['General', 'Career Advice', 'Technology', 'Events', 'Job Opportunities', 'Academic', 'Networking'];

export default function CreatePost({ authorEmail, onPostCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [category, setCategory] = useState('General');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);
  const videoUrlRef = useRef(null);

  const displayName = authorEmail ? authorEmail.split('@')[0] : '';

  useEffect(() => {
    if (!authorEmail) return;
    apiFetch(`/api/alumni-directory/check/${encodeURIComponent(authorEmail)}`)
      .then((data) => {
        if (data.profile?.profilePictureUrl) {
          setProfileImage(data.profile.profilePictureUrl);
        } else {
          return apiFetch(`/api/students/check/${encodeURIComponent(authorEmail)}`);
        }
      })
      .then((data) => {
        if (data?.profile?.profilePictureUrl) {
          setProfileImage(data.profile.profilePictureUrl);
        }
      })
      .catch(() => {});
  }, [authorEmail]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (videoFile || videoUrl) {
      toast.error('Remove video first to add images');
      e.target.value = '';
      return;
    }
    if (images.length + files.length > 4) {
      toast.error('Maximum 4 images allowed');
      e.target.value = '';
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
    setMediaPickerOpen(false);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoUrlSubmit = () => {
    const url = videoUrl.trim();
    if (!url) return;

    const embedUrl = getVideoEmbedUrl(url);
    if (!embedUrl) {
      toast.error('Invalid video URL. Use YouTube or Vimeo links.');
      return;
    }

    if (images.length > 0) {
      toast.error('Remove images first to add a video');
      return;
    }

    setVideoUrl(embedUrl);
    setMediaPickerOpen(false);
    toast.success('Video link added!');
  };

  const handleVideoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length > 0) {
      toast.error('Remove images first to add a video');
      e.target.value = '';
      return;
    }

    if (videoUrl) {
      toast.error('Remove video URL first to upload a file');
      e.target.value = '';
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Video must be under 50MB');
      e.target.value = '';
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setMediaPickerOpen(false);
    toast.success('Video selected! Will upload when you post.');
    e.target.value = '';
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview('');
    setVideoUrl('');
  };

  const handleSubmit = async () => {
    if (!text.trim() && images.length === 0 && !videoUrl && !videoFile) {
      toast.error('Write something or add media');
      return;
    }

    setPosting(true);
    try {
      let uploadedImages = [];
      if (images.length > 0) {
        setUploading(true);
        uploadedImages = await Promise.all(images.map((img) => uploadImage(img)));
      }

      let finalVideoUrl = videoUrl;
      if (videoFile) {
        setUploading(true);
        const result = await uploadVideo(videoFile);
        finalVideoUrl = result.url;
      }

      setUploading(false);

      const data = await apiFetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail,
          text: text.trim(),
          images: uploadedImages,
          videoUrl: finalVideoUrl || '',
          category,
        }),
      });

      toast.success('Post published!');
      setText('');
      setImages([]);
      setPreviews([]);
      removeVideo();
      setCategory('General');
      setIsOpen(false);
      if (onPostCreated) onPostCreated(data.post);
    } catch (error) {
      toast.error(error.message || 'Failed to create post');
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  const avatar = (size = 'normal') => {
    const sizeClass = size === 'small'
      ? 'w-10 h-10 sm:w-11 sm:h-11'
      : 'w-11 h-11 sm:w-12 sm:h-12';

    if (profileImage) {
      return (
        <img
          src={profileImage}
          alt=""
          className={`${sizeClass} rounded-full object-cover shadow-sm shrink-0`}
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
        {authorEmail?.charAt(0).toUpperCase()}
      </div>
    );
  };

  const hasMedia = images.length > 0 || videoUrl || videoFile;

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            {avatar('small')}
            <button
              onClick={() => setIsOpen(true)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full px-4 py-2.5 sm:py-3 text-left text-zinc-500 dark:text-zinc-400 text-sm sm:text-base transition-colors"
            >
              What&apos;s on your mind, {displayName}?
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
            onClick={() => setIsOpen(false)}
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
                <h3 className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white">Create Post</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                >
                  <FiX size={22} />
                </button>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  {avatar()}
                  <div>
                    <p className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-white">{displayName}</p>
                    <p className="text-xs text-zinc-400">Posting publicly</p>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`What's on your mind, ${displayName}?`}
                  className="w-full min-h-[120px] sm:min-h-[140px] resize-none bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-base sm:text-lg outline-none leading-relaxed"
                  autoFocus
                />

                <div className="mt-3 relative">
                  <button
                    onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    📁 {category}
                    <FiChevronDown size={14} />
                  </button>
                  {showCategoryPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-10 w-48">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { setCategory(cat); setShowCategoryPicker(false); }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            category === cat
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Previews */}
                {previews.length > 0 && (
                  <div className={`grid gap-2 mt-4 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {previews.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt="" className="w-full h-36 sm:h-44 object-cover rounded-xl" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Video URL Preview */}
                {videoUrl && !videoFile && (
                  <div className="mt-4 relative">
                    <div className="rounded-xl overflow-hidden bg-black">
                      {videoUrl.includes('youtube.com/embed') || videoUrl.includes('player.vimeo.com') ? (
                        <iframe
                          src={videoUrl}
                          className="w-full h-48 sm:h-56"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video src={videoUrl} controls className="w-full h-48 sm:h-56 object-cover" />
                      )}
                    </div>
                    <button
                      onClick={removeVideo}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                )}

                {/* Video File Preview */}
                {videoFile && videoPreview && (
                  <div className="mt-4 relative">
                    <div className="rounded-xl overflow-hidden bg-black">
                      <video src={videoPreview} controls className="w-full h-48 sm:h-56 object-cover" />
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-white text-[10px]">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </div>
                    <button
                      onClick={removeVideo}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                )}

                {/* Video URL Input */}
                {mediaPickerOpen === 'url' && !videoUrl && !videoFile && (
                  <div className="mt-4 flex gap-2">
                    <input
                      ref={videoUrlRef}
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Paste YouTube or Vimeo URL..."
                      className="flex-1 px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleVideoUrlSubmit()}
                    />
                    <button
                      onClick={handleVideoUrlSubmit}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Bar */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800">
                {/* Media Picker Button */}
                <div className="relative">
                  <button
                    onClick={() => setMediaPickerOpen(mediaPickerOpen ? false : 'menu')}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <FiImage size={20} className="text-green-500" />
                    <span className="hidden sm:inline">Photo/Video</span>
                  </button>

                  {/* Media Picker Dropdown */}
                  <AnimatePresence>
                    {mediaPickerOpen === 'menu' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 py-2 w-56 z-10"
                      >
                        <button
                          onClick={() => {
                            if (videoUrl || videoFile) {
                              toast.error('Remove video first to add images');
                              setMediaPickerOpen(false);
                              return;
                            }
                            imageInputRef.current?.click();
                            setMediaPickerOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <FiImage size={18} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">Image</p>
                            <p className="text-[11px] text-zinc-400">Upload photos (max 4)</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            if (images.length > 0) {
                              toast.error('Remove images first to add video');
                              setMediaPickerOpen(false);
                              return;
                            }
                            setMediaPickerOpen('url');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <FiLink size={18} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">Paste Video URL</p>
                            <p className="text-[11px] text-zinc-400">YouTube or Vimeo link</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            if (images.length > 0) {
                              toast.error('Remove images first to upload video');
                              setMediaPickerOpen(false);
                              return;
                            }
                            videoInputRef.current?.click();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <FiVideo size={18} className="text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">Upload Video</p>
                            <p className="text-[11px] text-zinc-400">MP4, MOV, WebM (max 50MB)</p>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/mov,video/webm,video/quicktime"
                  onChange={handleVideoFileSelect}
                  className="hidden"
                />

                {/* Post Button */}
                <button
                  onClick={handleSubmit}
                  disabled={posting || (!text.trim() && !hasMedia)}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                >
                  {posting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {uploading ? 'Uploading...' : 'Posting...'}
                    </span>
                  ) : (
                    <>
                      <FiSend size={16} />
                      Post
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
