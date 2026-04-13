import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * AICommandBar — floating NLP command bar for the Luminary editor.
 *
 * Props:
 *   adjustments   {object}   current editor adjustments (sent as context to the LLM)
 *   onApply       {function} called with the flat AI diff { key: value }
 *   apiUrl        {string}   backend API base URL
 */

const SUGGESTIONS = [
  { label: "✦ Cinematic",   prompt: "make it cinematic with deep shadows and contrast" },
  { label: "🎞 Film Look",  prompt: "add a warm film look with grain and vignette" },
  { label: "🌙 Moody",      prompt: "make it dark and moody with cool tones" },
  { label: "🌅 Golden Hour",prompt: "golden hour warm tones with lifted shadows" },
  { label: "⬛ Noir",       prompt: "dramatic black and white noir style" },
  { label: "🌫 Airy",       prompt: "bright and airy soft look" },
];

const AICommandBar = ({ adjustments, onApply, apiUrl }) => {
  const [isOpen, setIsOpen]         = useState(false);
  const [prompt, setPrompt]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [status, setStatus]         = useState(null); // { type: 'success'|'error', message }
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef      = useRef(null);
  const barRef        = useRef(null);
  const dismissTimer  = useRef(null);

  // Auto-focus input when bar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setStatus(null);
      setPrompt("");
    }
  }, [isOpen]);

  // Auto-dismiss status toasts
  useEffect(() => {
    if (status) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => setStatus(null), 4000);
    }
    return () => clearTimeout(dismissTimer.current);
  }, [status]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const runPrompt = useCallback(async (text) => {
    const cleaned = text.trim();
    if (!cleaned) return;

    setLoading(true);
    setStatus(null);
    setShowSuggestions(false);

    try {
      const res = await fetch(`${apiUrl}/ai-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleaned,
          currentAdjustments: adjustments,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Something went wrong." });
        return;
      }

      if (data.adjustments && Object.keys(data.adjustments).length > 0) {
        onApply(data.adjustments);
        const count = Object.keys(data.adjustments).length;
        setStatus({
          type: "success",
          message: `Applied ${count} adjustment${count !== 1 ? "s" : ""} ✓`,
        });
        setPrompt("");
      } else {
        setStatus({ type: "error", message: "No adjustments matched your command." });
      }
    } catch {
      setStatus({ type: "error", message: "Could not reach AI service. Check your connection." });
    } finally {
      setLoading(false);
    }
  }, [adjustments, apiUrl, onApply]);

  const handleSubmit = (e) => {
    e.preventDefault();
    runPrompt(prompt);
  };

  const handleSuggestionClick = (s) => {
    setPrompt(s.prompt);
    runPrompt(s.prompt);
  };

  return (
    <div
      ref={barRef}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
      style={{ width: isOpen ? "min(680px, calc(100% - 32px))" : "auto" }}
    >
      {/* ── Suggestion chips (visible when open + not loading) ── */}
      {isOpen && !loading && !status && (
        <div
          className="flex flex-wrap justify-center gap-1.5 w-full animate-fadeIn"
          style={{ animation: "fadeUp 0.2s ease-out" }}
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSuggestionClick(s)}
              className="px-2.5 py-1 text-[11px] font-sans rounded-full border border-violet-500/30 bg-violet-900/20 text-violet-300 hover:bg-violet-800/40 hover:border-violet-400/60 transition-all duration-150 backdrop-blur-md whitespace-nowrap"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Status toast ── */}
      {status && (
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-medium backdrop-blur-md border shadow-lg transition-all duration-300 ${
            status.type === "success"
              ? "bg-emerald-900/70 border-emerald-500/40 text-emerald-300"
              : "bg-red-900/70 border-red-500/40 text-red-300"
          }`}
          style={{ animation: "fadeUp 0.2s ease-out" }}
        >
          <span>{status.type === "success" ? "✓" : "✕"}</span>
          <span>{status.message}</span>
          <button
            onClick={() => setStatus(null)}
            className="ml-1 opacity-60 hover:opacity-100 transition"
          >×</button>
        </div>
      )}

      {/* ── Main bar ── */}
      <div
        className="relative w-full"
        style={{
          filter: "drop-shadow(0 8px 32px rgba(139, 92, 246, 0.25))",
        }}
      >
        {isOpen ? (
          /* Expanded command input */
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 w-full rounded-2xl border px-4 py-3 backdrop-blur-xl"
            style={{
              background: "rgba(15, 10, 30, 0.85)",
              borderColor: loading
                ? "rgba(139, 92, 246, 0.6)"
                : "rgba(139, 92, 246, 0.35)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
              animation: "expandBar 0.2s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Sparkle icon */}
            <span
              className="shrink-0 text-violet-400"
              style={{
                animation: loading ? "spinPulse 1s linear infinite" : "none",
              }}
            >
              {loading ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin">
                  <circle cx="8" cy="8" r="6" stroke="rgb(167,139,250)" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5Z"/>
                </svg>
              )}
            </span>

            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setShowSuggestions(e.target.value.length === 0);
              }}
              onFocus={() => setShowSuggestions(prompt.length === 0)}
              placeholder={loading ? "AI is thinking…" : "Describe how to edit this photo…"}
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none font-sans min-w-0"
              autoComplete="off"
            />

            {/* Loading dots */}
            {loading && (
              <div className="flex gap-1 shrink-0">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-violet-400"
                    style={{ animation: `bounce 1s ${i * 0.15}s infinite` }}
                  />
                ))}
              </div>
            )}

            {/* Submit / Close */}
            {!loading && (
              <div className="flex items-center gap-1.5 shrink-0">
                {prompt.trim() && (
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold font-sans transition-all duration-150 shadow-md shadow-violet-600/30"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M1.5 6h9M7 2.5l3.5 3.5L7 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                    Apply
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M2 2l8 8M10 2l-8 8"/>
                  </svg>
                </button>
              </div>
            )}
          </form>
        ) : (
          /* Collapsed pill trigger */
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-sans font-semibold transition-all duration-200 group"
            style={{
              background: "rgba(15,10,30,0.80)",
              border: "1px solid rgba(139,92,246,0.45)",
              color: "rgb(196,181,253)",
              boxShadow: "0 0 20px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
            title="AI-powered photo editing"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
              className="group-hover:scale-110 transition-transform duration-150"
            >
              <path d="M7 0.5l1.4 4.1L12.5 6l-4.1 1.4L7 11.5l-1.4-4.1L1.5 6l4.1-1.4Z"/>
            </svg>
            <span>AI Edit</span>
            <kbd className="ml-0.5 text-[10px] text-violet-400/60 font-mono hidden sm:block">⌘K</kbd>
          </button>
        )}
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes expandBar {
          from { opacity: 0; transform: scaleX(0.92) scaleY(0.88); }
          to   { opacity: 1; transform: scaleX(1)    scaleY(1);    }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%       { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AICommandBar;
