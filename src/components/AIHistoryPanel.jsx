import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const STYLES = [
  { icon: "🎬", label: "Cinematic",   prompt: "make it cinematic with deep shadows and strong contrast" },
  { icon: "🎞", label: "Film",        prompt: "warm film look with grain and vignette" },
  { icon: "🌙", label: "Moody",       prompt: "dark and moody with cool tones" },
  { icon: "🌅", label: "Golden Hr",   prompt: "golden hour warm tones and lifted shadows" },
  { icon: "⬛", label: "Noir",        prompt: "dramatic black and white noir" },
  { icon: "☁️", label: "Airy",        prompt: "bright airy soft look" },
  { icon: "💫", label: "Vivid",       prompt: "vibrant punchy colors with high clarity" },
  { icon: "🎨", label: "Vintage",     prompt: "faded vintage look with warm grain" },
];

const fmt = (k, v) => {
  const s = typeof v === "number" && !Number.isInteger(v) ? v.toFixed(2) : Math.round(v);
  return `${k} ${v > 0 ? "+" : ""}${s}`;
};

export default function AIHistoryPanel({ history = [], onSuggestionClick }) {
  return (
    <div
      className="w-56 shrink-0 flex flex-col border-r overflow-hidden"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2 shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60"/>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"/>
        </span>
        <span className="text-[11px] font-semibold font-sans text-slate-300 uppercase tracking-wider">AI Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Edit History ── */}
        <div className="p-3">
          <p className="text-[10px] text-slate-700 uppercase tracking-widest font-sans mb-2.5">Edit History</p>

          <AnimatePresence initial={false}>
            {history.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center py-6 text-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="rgb(100,116,139)">
                    <path d="M8 1 9.5 5.5 14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5Z"/>
                  </svg>
                </div>
                <p className="text-xs text-slate-600 font-sans">No AI edits yet</p>
                <p className="text-[10px] text-slate-700 font-sans mt-1">Type a command above ↑</p>
              </motion.div>
            ) : (
              <div className="space-y-1.5">
                {history.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-2.5 border transition-all"
                    style={{
                      background: idx === 0 ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.02)",
                      borderColor: idx === 0 ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${idx === 0 ? "bg-violet-400" : "bg-slate-700"}`}/>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-300 font-sans leading-snug line-clamp-2">{item.prompt}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {idx === 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-sans font-medium"
                              style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
                              latest
                            </span>
                          )}
                          <span className="text-[10px] text-slate-700 font-sans">
                            {Object.keys(item.adjustments).length} changes
                          </span>
                        </div>
                        {/* Adjustment pills */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {Object.entries(item.adjustments).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                              style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}>
                              {fmt(k, v)}
                            </span>
                          ))}
                          {Object.keys(item.adjustments).length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                              style={{ background: "rgba(255,255,255,0.04)", color: "#475569" }}>
                              +{Object.keys(item.adjustments).length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}/>

        {/* ── AI Styles ── */}
        <div className="p-3">
          <p className="text-[10px] text-slate-700 uppercase tracking-widest font-sans mb-2.5">AI Styles</p>
          <div className="grid grid-cols-2 gap-1.5">
            {STYLES.map(s => (
              <motion.button
                key={s.label}
                onClick={() => onSuggestionClick(s.prompt)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-slate-500 hover:text-violet-300 transition-all duration-200 font-sans"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)"; e.currentTarget.style.background = "rgba(139,92,246,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              >
                <span className="text-base leading-none">{s.icon}</span>
                <span className="text-[10px] font-medium">{s.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
