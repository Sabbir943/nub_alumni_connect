"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const colorVariants = {
  blue: {
    active: "bg-blue-50 border-blue-300 text-blue-700",
    hover: "hover:border-zinc-300 hover:bg-zinc-50",
    optionActive: "bg-blue-50 text-blue-700 font-medium",
    optionHover: "hover:bg-zinc-50",
  },
  emerald: {
    active: "bg-emerald-50 border-emerald-300 text-emerald-700",
    hover: "hover:border-zinc-300 hover:bg-zinc-50",
    optionActive: "bg-emerald-50 text-emerald-700 font-medium",
    optionHover: "hover:bg-zinc-50",
  },
};

export default function FilterDropdown({
  icon,
  options,
  value,
  onChange,
  placeholder,
  color = "blue",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const theme = colorVariants[color] || colorVariants.blue;

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const hasValue = value && value !== "All";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
          hasValue ? theme.active : `bg-white border-zinc-200 text-zinc-600 ${theme.hover}`
        }`}
      >
        <span className="text-zinc-400">{icon}</span>
        <span className="truncate max-w-[120px]">
          {hasValue ? value : placeholder}
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-56 sm:w-64 bg-white border border-zinc-200 rounded-xl shadow-xl z-[100] overflow-hidden"
          >
            <div className="p-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !hasValue
                    ? theme.optionActive
                    : `text-zinc-600 ${theme.optionHover}`
                }`}
              >
                All {placeholder}
              </button>
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    value === opt
                      ? theme.optionActive
                      : `text-zinc-600 ${theme.optionHover}`
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
