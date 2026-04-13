import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PLACEHOLDERS = [
  "Make this cinematic...",
  "Warm tones with soft highlights...",
  "Moody film look with high contrast...",
  "Dramatic noir with deep shadows...",
  "Golden hour vibes with lifted shadows...",
  "Airy and bright lifestyle look...",
];

const CHIPS = [
  { label: "Cinematic",    prompt: "make it cinematic with deep shadows and strong contrast" },
  { label: "Film",         prompt: "warm film look with grain and vignette" },
  { label: "Moody",        prompt: "dark and moody with cool tones and vignette" },
  { label: "Golden Hour",  prompt: "golden hour with warm tones and lifted shadows" },
  { label: "Noir",         prompt: "dramatic black and white noir" },
  { label: "Airy",         prompt: "bright airy soft look with open shadows" },
  { label: "Vivid",        prompt: "vibrant punchy colors with high clarity" },
  { label: "Vintage",      prompt: "faded vintage look with grain and warm tones" },
];

const AICommandBar = forwardRef(({ adjustments, onApply, apiUrl }, ref) => {
  const [prompt, setPrompt]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState(null);
  const [phIdx, setPhIdx]         = useState(0);
  const [focused, setFocused]     = useState(false);
  const inputRef    = useRef(null);
  const dismissRef  = useRef(null);

  // Cycle placeholder text
  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Auto-dismiss status
  useEffect(() => {
    if (!status) return;
    clearTimeout(dismissRef.current);
    dismissRef.current = setTimeout(() => setStatus(null), 3500);
    return () => clearTimeout(dismissRef.current);
  }, [status]);

  const runPrompt = useCallback(async (text) => {
    const t = text.trim();
    if (!t || loading) return;
    setLoading(true);
    setStatus(null);
    try {
      const res  = await fetch(`${apiUrl}/ai-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: t, currentAdjustments: adjustments }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus({ ok: false, msg: data.error || "Something went wrong" }); return; }
      if (data.adjustments && Object.keys(data.adjustments).length > 0) {
        onApply(data.adjustments, t);
        setStatus({ ok: true, msg: `✓  ${Object.keys(data.adjustments).length} adjustments applied` });
        setPrompt("");
      } else {
        setStatus({ ok: false, msg: "No adjustments matched — try a different command" });
      }
    } catch {
      setStatus({ ok: false, msg: "Cannot reach AI service — check connection" });
    } finally {
      setLoading(false);
    }
  }, [adjustments, apiUrl, onApply, loading]);

  // Expose runPrompt to parent via ref (for sidebar suggestion clicks)
  useImperativeHandle(ref, () => ({ runPrompt }), [runPrompt]);

  return (
    <div
      className="shrink-0 px-5 pt-3 pb-2.5 border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
    >
      {/* Input row */}
      <form onSubmit={e => { e.preventDefault(); runPrompt(prompt); }}>
        <motion.div
          animate={{ boxShadow: focused ? "0 0 0 1.5px rgba(139,92,246,0.55), 0 0 28px rgba(139,92,246,0.12)" : "0 0 0 1px rgba(255,255,255,0.08)" }}
          transition={{ duration: 0.2 }}
          className="flex items-center rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {/* Sparkle / spinner icon */}
          <div className="pl-4 pr-3 shrink-0 text-violet-400">
            {loading ? (
              <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <circle cx="8" cy="8" r="6" stroke="rgb(167,139,250)" strokeWidth="2"
                  strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
              </motion.svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1 9.5 5.5 14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5Z"/>
              </svg>
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={loading ? "AI is processing…" : PLACEHOLDERS[phIdx]}
            disabled={loading}
            autoComplete="off"
            className="flex-1 bg-transparent py-3.5 text-sm text-slate-100 placeholder-slate-600 outline-none font-sans"
          />

          {/* Inline status */}
          <AnimatePresence mode="wait">
            {status && (
              <motion.span
                key={status.msg}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`text-xs font-sans pr-3 shrink-0 ${status.ok ? "text-emerald-400" : "text-red-400"}`}
              >
                {status.msg}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Loading dots */}
          {loading && (
            <div className="flex gap-1 pr-4 shrink-0">
              {[0,1,2].map(i => (
                <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 block"
                  animate={{ y: [0,-4,0] }} transition={{ repeat: Infinity, duration: 0.75, delay: i*0.15 }}/>
              ))}
            </div>
          )}

          {/* Submit */}
          {!loading && (
            <div className="pr-2 shrink-0">
              <motion.button type="submit" disabled={!prompt.trim()}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-all ${
                  prompt.trim()
                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/25"
                    : "bg-white/5 text-slate-700 cursor-not-allowed"
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 6h8M7 2.5L10.5 6 7 9.5"/>
                </svg>
                Apply
              </motion.button>
            </div>
          )}
        </motion.div>
      </form>

      {/* Suggestion chips */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-[10px] text-slate-700 font-sans uppercase tracking-wider shrink-0">Try:</span>
        {CHIPS.map(c => (
          <motion.button
            key={c.label}
            onClick={() => runPrompt(c.prompt)}
            disabled={loading}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="px-2.5 py-0.5 text-[11px] font-sans rounded-full border transition-all duration-150 disabled:opacity-40"
            style={{ borderColor: "rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)", color: "#94a3b8" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.45)"; e.currentTarget.style.color = "#c4b5fd"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            {c.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
});

AICommandBar.displayName = "AICommandBar";
export default AICommandBar;
