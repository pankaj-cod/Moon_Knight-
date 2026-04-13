import React, { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const DEMO_COMMANDS = [
  { prompt: "Make this cinematic", tags: ["contrast +35", "vignette 30", "shadows +15"] },
  { prompt: "Warm golden hour tones", tags: ["temperature +35", "vibrance +25", "shadows +20"] },
  { prompt: "Dramatic noir style",   tags: ["saturation -100", "contrast +45", "grain 20"] },
];

const CHIPS = ["Cinematic", "Moody", "Golden Hour", "Film Look", "Noir", "Airy", "Vivid", "Vintage"];

const AI_FEATURES = [
  {
    icon: "✦",
    title: "Describe Your Edit",
    desc: "Type what you want in plain English. AI translates it to precise adjustments instantly.",
  },
  {
    icon: "⟳",
    title: "Iterative Commands",
    desc: "Say 'reduce it a bit' or 'make it warmer' — AI remembers context and refines continuously.",
  },
  {
    icon: "◈",
    title: "Style Intelligence",
    desc: "One word like 'cinematic' or 'film' maps to a curated set of professional adjustments.",
  },
  {
    icon: "◎",
    title: "Full Manual Control",
    desc: "AI edits are non-destructive. Fine-tune any parameter manually, undo at any time.",
  },
];

export default function Home({ isAuthenticated, setCurrentView, fileInputRef, handleUpload, setShowStockPhotos }) {
  const container = useRef();

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".h-badge",   { y: -14, opacity: 0, duration: 0.5 })
      .from(".h-head",    { y: 36,  opacity: 0, duration: 0.8 }, "-=0.25")
      .from(".h-sub",     { y: 20,  opacity: 0, duration: 0.6 }, "-=0.45")
      .from(".h-input",   { y: 20,  opacity: 0, duration: 0.6 }, "-=0.35")
      .from(".h-chips",   { y: 14,  opacity: 0, duration: 0.5 }, "-=0.3")
      .from(".h-cta",     { y: 14,  opacity: 0, duration: 0.5 }, "-=0.3")
      .from(".h-demo",    { x: 40,  opacity: 0, duration: 0.8 }, "-=0.6")
      .from(".h-feat",    { y: 24,  opacity: 0, duration: 0.5, stagger: 0.1 }, "-=0.4");
  }, { scope: container });

  return (
    <div ref={container} className="min-h-screen">

      {/* ══════════════════ HERO ══════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center min-h-[calc(100vh-64px)] max-w-screen-xl mx-auto px-8 pt-8 pb-16">

        {/* Left — Copy */}
        <div className="space-y-7 py-8">

          {/* Badge */}
          <div className="h-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-sans tracking-widest"
            style={{ borderColor: "rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.08)", color: "#c4b5fd" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60"/>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"/>
            </span>
            AI-POWERED PHOTO EDITOR
          </div>

          {/* Headline */}
          <h1 className="h-head text-5xl xl:text-6xl font-bold leading-[1.08] text-white font-display">
            Edit photos by<br/>
            <span style={{
              background: "linear-gradient(135deg,#a78bfa 0%,#e879f9 50%,#fb923c 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              describing them.
            </span>
          </h1>

          {/* Sub */}
          <p className="h-sub text-base text-slate-400 leading-relaxed max-w-md font-sans">
            Luminary is an AI-first photo editor. Just type what you want —
            <em className="text-slate-300 not-italic"> "warm cinematic tones"</em> or{" "}
            <em className="text-slate-300 not-italic">"dramatic noir with grain"</em> — and watch it happen.
          </p>

          {/* Hero AI input mockup */}
          <div className="h-input space-y-2.5">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(139,92,246,0.4)",
                boxShadow: "0 0 0 1px rgba(139,92,246,0.15), 0 0 28px rgba(139,92,246,0.08)",
              }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="rgb(167,139,250)">
                <path d="M8 1 9.5 5.5 14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5Z"/>
              </svg>
              <span className="text-sm text-slate-500 font-sans flex-1">Describe your edit...</span>
              <span className="text-xs px-3 py-1.5 rounded-xl font-semibold font-sans"
                style={{ background: "rgba(124,58,237,0.8)", color: "#fff" }}>Apply</span>
            </div>

            {/* Chips */}
            <div className="h-chips flex flex-wrap gap-1.5">
              {CHIPS.map(c => (
                <span key={c}
                  className="px-2.5 py-1 text-[11px] rounded-full border font-sans cursor-default select-none"
                  style={{ borderColor: "rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)", color: "#94a3b8" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="h-cta flex flex-col sm:flex-row gap-3">
            <label className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold font-sans text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 1v9M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 12h14" strokeLinecap="round"/>
                </svg>
                Upload Photo & Try AI
              </div>
              <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" accept="image/*"/>
            </label>

            <button onClick={() => setShowStockPhotos(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border text-sm font-semibold font-sans text-slate-400 hover:text-white transition-all"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="1" width="14" height="14" rx="2"/>
                <path d="M1 11l4-4 3 3 2-2 5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Try Sample Photos
            </button>
          </div>

          {isAuthenticated && (
            <button onClick={() => setCurrentView("dashboard")}
              className="text-xs text-violet-400 hover:text-violet-300 font-sans transition flex items-center gap-1">
              View my saved photos →
            </button>
          )}
        </div>

        {/* Right — Live demo cards */}
        <div className="h-demo hidden lg:flex flex-col gap-3">
          {DEMO_COMMANDS.map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="rounded-2xl border p-4"
              style={{
                background: i === 0 ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.025)",
                borderColor: i === 0 ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.07)",
              }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(139,92,246,0.2)" }}>
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="rgb(167,139,250)">
                    <path d="M7 1 8.3 5 12 6.3 8.3 7.7 7 12 5.7 7.7 2 6.3 5.7 5Z"/>
                  </svg>
                </div>
                <span className="text-sm text-slate-200 font-sans">"{item.prompt}"</span>
                {i === 0 && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-sans font-medium"
                    style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}>
                    ✓ AI Applied
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map(t => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}>
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Bottom accent */}
          <div className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="rgb(167,139,250)" strokeWidth="1.5">
                <path d="M8 1v14M1 8h14" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-300 font-sans font-medium">14 controls, zero sliders to drag</p>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">AI sets them all from one sentence</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <div className="max-w-screen-xl mx-auto px-8 pb-24">
        <div className="text-center mb-10">
          <p className="text-[11px] tracking-widest text-slate-600 uppercase mb-3 font-sans">How it works</p>
          <h2 className="text-3xl font-bold text-white font-display">AI does the heavy lifting</h2>
          <p className="text-sm text-slate-500 font-sans mt-3 max-w-md mx-auto">
            Manual sliders are still there — but you'll rarely need them.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_FEATURES.map((f, i) => (
            <div key={i} className="h-feat group p-5 rounded-2xl border transition-all duration-300"
              style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)"; e.currentTarget.style.background = "rgba(139,92,246,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
              <div className="text-2xl mb-4 text-slate-500 group-hover:text-violet-400 transition-colors duration-300 font-mono">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2 font-display text-sm">{f.title}</h3>
              <p className="text-slate-500 text-xs font-sans leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
