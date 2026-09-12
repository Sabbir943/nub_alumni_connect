"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMessageCircle,
  FiSend,
  FiCpu,
  FiUser,
  FiMinimize2,
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiBookOpen,
  FiStar,
  FiExternalLink,
} from "react-icons/fi";
import { authClient } from "@/lib/auth-client";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "Hello! I'm your NUB AI Assistant. I can help you find alumni, students, or job opportunities. Try asking me to search for something!",
  },
];

const SUGGESTIONS = [
  "Find software engineers",
  "Search React developers",
  "Find internship jobs",
  "Show me CSE students",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-zinc-400"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="text-[10px] text-zinc-400 ml-1.5">AI is thinking...</span>
    </div>
  );
}

function VerifiedBadge({ level }) {
  if (level === "high") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
        <FiStar className="w-2.5 h-2.5" /> Verified
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
        Partial
      </span>
    );
  }
  return null;
}

function AlumniCard({ item }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-zinc-900 truncate">
            {item.name}
          </h4>
          {item.jobTitle && item.organization && (
            <p className="text-xs text-zinc-600 truncate flex items-center gap-1 mt-0.5">
              <FiBriefcase className="w-3 h-3 shrink-0" />
              {item.jobTitle} at {item.organization}
            </p>
          )}
        </div>
        <VerifiedBadge level={item.verified} />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {item.degree && (
          <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <FiBookOpen className="w-2.5 h-2.5" />
            {item.degree}
            {item.graduationYear ? ` '${String(item.graduationYear).slice(-2)}` : ""}
          </span>
        )}
        {item.location && (
          <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <FiMapPin className="w-2.5 h-2.5" />
            {item.location}
          </span>
        )}
      </div>
      {item.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.skills.slice(0, 4).map((s, i) => (
            <span
              key={i}
              className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
          {item.skills.length > 4 && (
            <span className="text-[10px] text-zinc-400">
              +{item.skills.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function StudentCard({ item }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-zinc-900 truncate">
            {item.name}
          </h4>
          {item.department && (
            <p className="text-xs text-zinc-600 truncate flex items-center gap-1 mt-0.5">
              <FiBookOpen className="w-3 h-3 shrink-0" />
              {item.department}
              {item.batch ? ` - Batch ${item.batch}` : ""}
            </p>
          )}
        </div>
        <VerifiedBadge level={item.verified} />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {item.semester && (
          <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
            Semester {item.semester}
          </span>
        )}
        {item.location && (
          <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <FiMapPin className="w-2.5 h-2.5" />
            {item.location}
          </span>
        )}
      </div>
      {item.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.skills.slice(0, 4).map((s, i) => (
            <span
              key={i}
              className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
          {item.skills.length > 4 && (
            <span className="text-[10px] text-zinc-400">
              +{item.skills.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function JobCard({ item }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-zinc-900 truncate">
            {item.title}
          </h4>
          {item.company && (
            <p className="text-xs text-zinc-600 truncate flex items-center gap-1 mt-0.5">
              <FiBriefcase className="w-3 h-3 shrink-0" />
              {item.company}
            </p>
          )}
        </div>
        {item.jobType && (
          <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            {item.jobType}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {item.location && (
          <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <FiMapPin className="w-2.5 h-2.5" />
            {item.location}
          </span>
        )}
        {item.workplaceType && (
          <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
            {item.workplaceType}
          </span>
        )}
        {item.salary && (
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {item.salary}
          </span>
        )}
      </div>
      {item.id && (
        <a
          href={`/job-portal/${item.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details <FiExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function ResultCards({ results }) {
  if (!results) return null;
  const { type, data } = results;
  if (!data || data.length === 0) return null;

  const Card = type === "alumni" ? AlumniCard : type === "student" ? StudentCard : JobCard;
  const label = type === "alumni" ? "Alumni" : type === "student" ? "Students" : "Jobs";

  return (
    <div className="mt-2">
      <p className="text-[11px] font-medium text-zinc-500 mb-1.5">
        {data.length} {label} Found
      </p>
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {data.map((item, i) => (
          <Card key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### "))
      return (
        <h3 key={i} className="text-xs font-bold text-zinc-800 mt-2 mb-1">
          {line.slice(4)}
        </h3>
      );
    if (line.startsWith("## "))
      return (
        <h2 key={i} className="text-xs font-bold text-zinc-800 mt-2 mb-1">
          {line.slice(3)}
        </h2>
      );
    if (line.startsWith("# "))
      return (
        <h1 key={i} className="text-xs font-bold text-zinc-800 mt-2 mb-1">
          {line.slice(2)}
        </h1>
      );
    if (line.match(/^[-*] /))
      return (
        <li key={i} className="text-[13px] text-zinc-700 ml-3 list-disc">
          {line.slice(2)}
        </li>
      );
    if (line.match(/^\d+\. /))
      return (
        <li key={i} className="text-[13px] text-zinc-700 ml-3 list-decimal">
          {line.replace(/^\d+\. /, "")}
        </li>
      );
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} className="text-[13px] text-zinc-700 leading-relaxed">
        {line}
      </p>
    );
  });
}

export default function AIChatbot() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    const userMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            userName: user?.name || "",
            userEmail: user?.email || "",
          },
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const textRef = { current: "" };

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                textRef.current += parsed.content;
                const snapshot = textRef.current;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: snapshot,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }

        if (!textRef.current) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "I received an empty response. Please try again.",
            };
            return updated;
          });
        }
      } else {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message || "I couldn't process that request.",
            results: data.results || null,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Please check your internet and try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-blue-500/40 transition-shadow"
          >
            <FiMessageCircle className="w-6 h-6" />
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-[400px] h-[calc(100vh-6rem)] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FiCpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    NUB AI Assistant
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-blue-100">
                      Search Alumni, Students & Jobs
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <FiMinimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <FiCpu className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md"
                        : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <div>{renderMarkdown(msg.content)}</div>
                        {msg.results && <ResultCards results={msg.results} />}
                      </>
                    ) : (
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0 ml-2 mt-0.5">
                      <FiUser className="w-3 h-3 text-zinc-500" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mr-2">
                    <FiCpu className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-zinc-100 rounded-2xl rounded-bl-md">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-[11px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
                  >
                    <FiSearch className="w-3 h-3" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-zinc-100 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search alumni, students, jobs..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-shadow"
                >
                  <FiSend className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-[9px] text-zinc-400 text-center mt-1.5">
                Searches alumni, students & jobs in real-time
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
