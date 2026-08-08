'use client';

import React from 'react';
import { FaStar, FaQuoteLeft, FaCheckCircle, FaBuilding, FaGraduationCap } from 'react-icons/fa';
import { MdVerifiedUser } from "react-icons/md";
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.3 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.92 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 20 }
  }
};

const starVariants = {
  rest: { rotate: 0 },
  wiggle: (i) => ({
    rotate: [0, -12, 12, -6, 0],
    transition: { delay: i * 0.04, duration: 0.45 }
  })
};

export default function HighlightReviews() {
  const reviews = [
    {
      name: 'Tanvir Hossain',
      role: 'Software Engineer',
      company: 'Brain Station 23',
      type: 'Alumni',
      batch: 'Batch 42 (CSE)',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&auto=format&fit=crop&q=80',
      comment:
        'Being able to mentor NUB juniors has been deeply rewarding. The direct resume review feature allowed me to shortlist two qualified interns in under a week!',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      name: 'Anika Rahman',
      role: 'Frontend Student',
      company: 'NUB Undergraduate',
      type: 'Student',
      batch: 'Batch 51 (CSE)',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&auto=format&fit=crop&q=80',
      comment:
        'I submitted my CV to the Resume Critiques workspace and got feedback from an alumnus in Canada. Fixed my tech stack formatting and landed my first remote internship!',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      gradient: 'from-blue-400 to-indigo-500',
    },
    {
      name: 'Mahmudul Hasan',
      role: 'Product Designer',
      company: 'Pathao',
      type: 'Alumni',
      batch: 'Batch 38 (EEE)',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&auto=format&fit=crop&q=80',
      comment:
        'The Alumni Directory search filters made finding my old batchmates effortless. The community feed keeps us genuinely connected to campus news.',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      gradient: 'from-violet-400 to-purple-500',
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-blue-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -left-40 w-[25rem] h-[25rem] bg-indigo-200/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 15, -15, 0], y: [0, 15, -15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan-200/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 text-blue-700 text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
            <MdVerifiedUser className="w-4 h-4 text-blue-600" />
            <span>Community Stories</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Loved by NUB{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Students & Alumni
            </span>
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Discover real stories of career breakthroughs and mentorship formed on NUB Alumni Connect.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -10, transition: { type: 'spring', stiffness: 200 } }}
              className="group relative flex flex-col justify-between rounded-2xl p-6 bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-2xl transition-shadow duration-500"
            >
              {/* Gradient accent lines */}
              <div className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className={`absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${review.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />

              <div className="relative z-10">
                {/* User info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-shrink-0">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${review.gradient} opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-500`}
                    />
                    <img
                      src={review.image}
                      alt={review.name}
                      className="relative w-12 h-12 rounded-full object-cover border-2 border-white group-hover:border-blue-500/50 transition-colors duration-300"
                    />
                    <FaCheckCircle className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-emerald-500 bg-white rounded-full drop-shadow-sm" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                      {review.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{review.role}</p>
                  </div>
                </div>

                {/* Quote */}
                <div className="relative mb-6">
                  <FaQuoteLeft className="w-5 h-5 text-blue-200/80 mb-2 group-hover:text-blue-400/60 transition-colors duration-500" />
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed italic">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="relative z-10 pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border ${review.badgeColor}`}>
                  {review.type === 'Alumni' ? <FaBuilding className="w-3 h-3" /> : <FaGraduationCap className="w-3 h-3" />}
                  {review.company !== 'NUB Undergraduate' ? review.company : review.batch}
                </span>
                <motion.div
                  className="flex gap-0.5 text-amber-400"
                  initial="rest"
                  whileHover="wiggle"
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.span key={i} variants={starVariants} custom={i}>
                      <FaStar className="w-3.5 h-3.5 fill-current" />
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
