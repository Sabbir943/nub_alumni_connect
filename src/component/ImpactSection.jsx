'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaGraduationCap, FaBriefcase, FaComments, FaAward, FaArrowRight, FaRocket } from 'react-icons/fa';
import { motion, useInView } from 'framer-motion';

function AnimatedCounter({ value, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const num = parseInt(value.replace(/,/g, ''));

  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const duration = 2000;
    const steps = 50;
    const increment = num / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setCount(num);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, num]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const statVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

export default function ImpactSection() {
  const stats = [
    {
      id: 1,
      icon: <FaGraduationCap className="w-6 h-6" />,
      value: '2500',
      display: '2,500+',
      label: 'Verified Alumni',
      description: 'Connected across 18 countries in top tech & corporate hubs.',
      gradient: 'from-blue-500 to-cyan-500',
      badgeBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      id: 2,
      icon: <FaBriefcase className="w-6 h-6" />,
      value: '450',
      display: '450+',
      label: 'Jobs & Internships',
      description: 'Exclusive refer-driven opportunities posted by NUB graduates.',
      gradient: 'from-emerald-500 to-teal-500',
      badgeBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      id: 3,
      icon: <FaComments className="w-6 h-6" />,
      value: '1200',
      display: '1,200+',
      label: 'Mentorship Hours',
      description: 'One-on-one resume reviews, mock interviews, and career guidance.',
      gradient: 'from-indigo-500 to-violet-500',
      badgeBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      id: 4,
      icon: <FaAward className="w-6 h-6" />,
      value: '94',
      display: '94%',
      label: 'Placement Support',
      description: 'Of active students secured interviews within 3 months of joining.',
      gradient: 'from-amber-500 to-orange-500',
      badgeBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  const getSuffix = (display) => {
    return display.replace(/[\d,]/g, '');
  };

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-slate-50">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/2 -right-1/4 w-[40rem] h-[40rem] bg-gradient-to-br from-blue-100/40 via-indigo-100/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/2 -left-1/4 w-[35rem] h-[35rem] bg-gradient-to-tr from-emerald-100/30 via-teal-100/20 to-transparent rounded-full blur-3xl"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100/50 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 text-blue-700 text-xs font-bold tracking-wide uppercase mb-5 shadow-sm">
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full bg-blue-600"
            />
            Empowering NUB Community
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Bridging the Gap Between{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Classroom & Industry
            </span>
          </h2>

          <p className="mt-4 text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            NUB Alumni Connect drives real outcomes for students through peer-to-peer mentoring, candidate referrals, and transparent career pathways.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.id}
              variants={statVariants}
              whileHover={{ y: -8, transition: { type: 'spring', stiffness: 200 } }}
              className="group relative p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-2xl transition-shadow duration-500"
            >
              {/* Gradient hover overlay */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />
              <div className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10 flex flex-col justify-between h-full">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${stat.badgeBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className={stat.iconColor}>
                    {stat.icon}
                  </span>
                </div>

                {/* Value */}
                <h3 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-1 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  <AnimatedCounter value={stat.value} suffix={getSuffix(stat.display)} />
                </h3>

                {/* Label */}
                <p className="text-sm font-bold text-slate-700 mb-3">
                  {stat.label}
                </p>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 mt-auto">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-14 sm:mt-16 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-indigo-600/20 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="p-3.5 bg-white/10 rounded-xl backdrop-blur-md hidden sm:block"
            >
              <FaRocket className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h4 className="text-lg font-bold">Ready to take the next step in your career?</h4>
              <p className="text-sm text-blue-100 mt-0.5">Join over 2,000+ active NUB students and alumni working at top tech firms.</p>
            </div>
          </div>

          <motion.a
            href="/signin"
            whileHover={{ scale: 1.03, gap: '12px' }}
            whileTap={{ scale: 0.98 }}
            className="whitespace-nowrap px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-md"
          >
            Create Your Account <FaArrowRight className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
