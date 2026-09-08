'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiZoomIn } from 'react-icons/fi';
import { getVideoEmbedUrl } from '@/lib/upload';

export default function MediaLightbox({ images = [], videoUrl = null, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const hasImages = Array.isArray(images) && images.length > 0;
  const isEmbed = videoUrl && (getVideoEmbedUrl(videoUrl)?.includes('youtube.com/embed') || getVideoEmbedUrl(videoUrl)?.includes('player.vimeo.com'));

  const goPrev = useCallback(() => {
    setIndex((i) => (hasImages ? (i - 1 + images.length) % images.length : i));
  }, [hasImages, images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (hasImages ? (i + 1) % images.length : i));
  }, [hasImages, images.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
          aria-label="Close"
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Counter */}
        {hasImages && (
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-semibold z-20">
            {index + 1} / {images.length}
          </div>
        )}

        {/* Video */}
        {videoUrl && (
          <div className="w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
            {isEmbed ? (
              <iframe
                src={getVideoEmbedUrl(videoUrl)}
                className="w-full h-full aspect-video max-h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-auto max-h-full object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>
        )}

        {/* Images — shown at natural uploaded size */}
        {hasImages && !videoUrl && (
          <>
            <motion.img
              key={images[index]}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              src={images[index]}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none"
              draggable={false}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-20"
                  aria-label="Previous"
                >
                  <FiChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-20"
                  aria-label="Next"
                >
                  <FiChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </>
        )}

        {/* Hint */}
        {hasImages && images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs z-20">
            <FiZoomIn className="w-3.5 h-3.5" />
            Use arrow keys to navigate
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}