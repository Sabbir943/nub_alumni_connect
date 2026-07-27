"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiUsers, FiBriefcase, FiUserPlus } from 'react-icons/fi';

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const slides = [
    {
      id: 1,
      tagline: "Welcome to NUB Nexus",
      title: "Bridging the Gap Between Students & Alumni",
      description: "Unlock professional growth, direct mentorship opportunities, and a powerful network built exclusively for the Northern University Bangladesh community.",
      ctaText: "Explore Platform",
      ctaLink: "/student-directory",
      ctaIcon: <FiUsers className="w-4 h-4" />,
      secondaryText: "Join Network",
      secondaryLink: "/signup",
      secondaryIcon: <FiUserPlus className="w-4 h-4" />,
      imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
      bgGradient: "from-blue-600 via-indigo-900 to-zinc-950",
      btnStyle: { background: "linear-gradient(to right, #3b82f6, #6366f1, #a855f7)" },
      btnHoverStyle: { background: "linear-gradient(to right, #2563eb, #4f46e5, #9333ea)" },
    },
    {
      id: 2,
      tagline: "Career Development",
      title: "Land Internships & Verified Tech Jobs",
      description: "Browse curated job postings, entry-level roles, and freelancing tracks submitted straight from established NUB graduates working across major tech firms.",
      ctaText: "Browse Listings",
      ctaLink: "/job-portal",
      ctaIcon: <FiBriefcase className="w-4 h-4" />,
      secondaryText: "Post Opportunity",
      secondaryLink: "/dashboard/alumni/jobPost",
      secondaryIcon: <FiArrowRight className="w-4 h-4" />,
      imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80",
      bgGradient: "from-indigo-800 via-purple-950 to-zinc-950",
      btnStyle: { background: "linear-gradient(to right, #8b5cf6, #a855f7, #d946ef)" },
      btnHoverStyle: { background: "linear-gradient(to right, #7c3aed, #9333ea, #c026d3)" },
    },
    {
      id: 3,
      tagline: "Knowledge Sharing",
      title: "1-on-1 Strategic Mentorship Network",
      description: "Accelerate your software engineering or technical track. Book review sessions with seniors who navigated your exact courses and cracked industry interviews.",
      ctaText: "Find Mentors",
      ctaLink: "/alumni-directory",
      ctaIcon: <FiUsers className="w-4 h-4" />,
      secondaryText: "Become a Mentor",
      secondaryLink: "/signup",
      secondaryIcon: <FiUserPlus className="w-4 h-4" />,
      imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
      bgGradient: "from-slate-900 via-blue-950 to-zinc-950",
      btnStyle: { background: "linear-gradient(to right, #10b981, #14b8a6, #06b6d4)" },
      btnHoverStyle: { background: "linear-gradient(to right, #059669, #0d9488, #0891b2)" },
    },
  ];

  // Auto-play timing set to 8000ms (8 seconds) for a relaxed layout pace
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[540px] md:h-[500px] bg-zinc-950 overflow-hidden">
      
      {/* Slides Viewport */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full flex items-center transition-all duration-1000 ease-in-out ${
              index === currentSlide 
                ? "opacity-100 translate-x-0 pointer-events-auto z-20" 
                : "opacity-0 translate-x-4 pointer-events-none z-10"
            }`}
          >
            {/* Dynamic Glass Gradient Background Layer */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-95`} />
            
            {/* Layout Grid Wrapper */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white">
              
              {/* Left Side: Typography Information */}
              <div className="space-y-4 max-w-xl">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md text-blue-300 border border-white/10 tracking-wider uppercase">
                  {slide.tagline}
                </span>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  {slide.title}
                </h1>

                <p className="text-zinc-300 text-sm md:text-base font-normal leading-relaxed">
                  {slide.description}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link 
                    href={slide.ctaLink} 
                    onMouseEnter={() => setHoveredBtn(`primary-${slide.id}`)}
                    onMouseLeave={() => setHoveredBtn(null)}
                    className="group relative inline-flex items-center gap-2.5 text-white text-sm font-bold px-7 py-3.5 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
                    style={hoveredBtn === `primary-${slide.id}` ? slide.btnHoverStyle : slide.btnStyle}
                  >
                    <span className="relative z-10">{slide.ctaIcon}</span>
                    <span className="relative z-10">{slide.ctaText}</span>
                    <FiArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  </Link>
                  <Link 
                    href={slide.secondaryLink} 
                    className="group relative inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white px-6 py-3.5 rounded-2xl border border-white/15 hover:border-white/30 bg-white/[0.05] hover:bg-white/[0.1] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <span className="group-hover:scale-110 transition-transform duration-300">{slide.secondaryIcon}</span>
                    <span>{slide.secondaryText}</span>
                  </Link>
                </div>
              </div>

              {/* Right Side: Showcase Image Block */}
              <div className="hidden md:block relative h-[320px] lg:h-[360px] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                <img 
                  src={slide.imageUrl} 
                  alt={slide.title} 
                  className="w-full h-full object-cover transform scale-100 transition-transform duration-1000 ease-in-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-zinc-950/20" />
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Manual Controller Navigation Arrows */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border border-white/5 transition-colors hidden lg:block"
        aria-label="Previous Slide"
      >
        <FiChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border border-white/5 transition-colors hidden lg:block"
        aria-label="Next Slide"
      >
        <FiChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom Progress Bars */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentSlide ? "w-6 bg-blue-500" : "w-1.5 bg-white/30"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default Banner;