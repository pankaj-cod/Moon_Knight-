import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import Slider         from "../components/Slider";
import Histogram      from "../components/Histogram";
import ToneCurveEditor from "../components/ToneCurveEditor";
import HSLPanel        from "../components/HSLPanel";
import AICommandBar   from "../components/AICommandBar";
import AIHistoryPanel from "../components/AIHistoryPanel";

import { useCanvasEditor } from "../hooks/useCanvasEditor";
import { ToneCurve }       from "../utils/ToneCurve";
import { mergeAIEdit }     from "../utils/mergeAIEdit";

// ── Slider that flashes a violet highlight when AI changes it ──
const SmartSlider = ({ highlight, ...props }) => (
  <motion.div
    animate={highlight ? { backgroundColor: ["rgba(139,92,246,0.18)", "rgba(139,92,246,0)"] } : {}}
    transition={{ duration: 1.4 }}
    className="rounded-lg px-2 py-1 -mx-2"
  >
    <Slider {...props} />
  </motion.div>
);

const TABS    = ["Light","Color","Curve","HSL","FX"];
const PRESETS = [
  { id: "vivid",      label: "Vivid" },
  { id: "film",       label: "Film"  },
  { id: "portrait",   label: "Portrait" },
  { id: "monochrome", label: "B&W"  },
];

export default function Editor({
  image,
  showBefore, setShowBefore,
  histogramData, setHistogramData,
  isAuthenticated, handleSaveEdit, handleDownload,
  setCurrentView, setImage, resetAdjustments, applyPreset,
  adjustments, setAdjustments,
  albums = [], undo, redo,
  canUndo = false, canRedo = false, historyLength = 0,
  apiUrl = "http://localhost:5001/api",
}) {
  const container     = useRef();
  const aiBarRef      = useRef();          // ref to AICommandBar to call runPrompt directly

  const [tab,           setTab]           = useState("Light");
  const [showHistogram, setShowHistogram] = useState(false);
  const [showControls,  setShowControls]  = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [aiHistory,     setAiHistory]     = useState([]);
  const [highlightKeys, setHighlightKeys] = useState(new Set());

  const { canvasRef, applyAdjustments, exportBlob, renderOriginal, getHistogramData } =
    useCanvasEditor(image);

  // Re-render canvas on adjustments change
  useEffect(() => {
    if (!adjustments?.basic) return;
    applyAdjustments(adjustments, () => {
      if (showHistogram) {
        const d = getHistogramData();
        if (d) setHistogramData(d);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustments]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      const mod = navigator.platform.toUpperCase().includes("MAC") ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); if (canUndo) undo(); }
      else if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); if (canRedo) redo(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo, canUndo, canRedo]);

  useGSAP(() => {
    gsap.from(".ed-toolbar", { y: -12, opacity: 0, duration: 0.45, ease: "power2.out" });
    gsap.from(".ed-left",    { x: -16, opacity: 0, duration: 0.45, ease: "power2.out", delay: 0.08 });
    gsap.from(".ed-canvas",  { opacity: 0,          duration: 0.55, ease: "power2.out", delay: 0.05 });
    gsap.from(".ed-right",   { x:  16, opacity: 0, duration: 0.45, ease: "power2.out", delay: 0.08 });
  }, { scope: container, dependencies: [image] });

  // ── Adjustments helpers ──
  const setAdj = useCallback((cat, key, val) =>
    setAdjustments(p => ({ ...p, [cat]: { ...p[cat], [key]: val } })), [setAdjustments]);

  const setBlur = useCallback(val =>
    setAdjustments(p => ({ ...p, blur: val })), [setAdjustments]);

  // ── AI apply callback (called by AICommandBar) ──
  const handleAIApply = useCallback((flatDiff, promptText) => {
    setAdjustments(prev => mergeAIEdit(prev, flatDiff));
    setAiHistory(prev => [{
      id: Date.now(), prompt: promptText || "AI Edit",
      adjustments: flatDiff, timestamp: new Date(),
    }, ...prev].slice(0, 25));
    // Highlight changed sliders briefly
    const keys = new Set(Object.keys(flatDiff));
    setHighlightKeys(keys);
    setTimeout(() => setHighlightKeys(new Set()), 1600);
  }, [setAdjustments]);

  // ── Sidebar style button → delegate to AICommandBar.runPrompt ──
  const handleSuggestion = useCallback((prompt) => {
    aiBarRef.current?.runPrompt(prompt);
  }, []);

  // ── Export ──
  const handleExport = useCallback(async () => {
    try {
      const blob = await exportBlob("image/png", 1.0);
      const url  = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "luminary-edit.png";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { alert("Export failed"); }
  }, [exportBlob]);

  // ── Panel border / bg tokens ──
  const panelBorder = "rgba(255,255,255,0.06)";
  const panelBg     = "rgba(255,255,255,0.015)";

  return (
    <div ref={container} className="flex flex-col h-full overflow-hidden" style={{ background: "#07070f" }}>

      {/* ═══════════════════ TOP TOOLBAR ═══════════════════ */}
      <div className="ed-toolbar flex items-center justify-between px-4 py-2 shrink-0 border-b"
        style={{ borderColor: panelBorder, background: panelBg }}>

        {/* Left: Back + brand pulse */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setImage(null); resetAdjustments(); setCurrentView(isAuthenticated ? "dashboard" : "home"); }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-sans transition"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 2L4 7l5 5"/>
            </svg>
            Back
          </button>
          <div className="w-px h-3.5 bg-white/8"/>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-violet-400 opacity-60"/>
              <span className="relative rounded-full h-1.5 w-1.5 bg-violet-500"/>
            </span>
            <span className="text-[11px] text-slate-600 font-sans">Luminary AI</span>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5">
          {/* Undo/Redo */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: panelBorder }}>
            {[
              { fn: undo, can: canUndo, title: "⌘Z",  path: "M2 6a4 4 0 1 0 4-4H2M2 2v4h4" },
              { fn: redo, can: canRedo, title: "⌘⇧Z", path: "M10 6a4 4 0 1 1-4-4h4M10 2v4H6" },
            ].map((b, i) => (
              <button key={i} onClick={b.fn} disabled={!b.can} title={b.title}
                className={`px-2.5 py-1.5 text-xs font-sans transition ${i === 0 ? "border-r" : ""} ${b.can ? "text-slate-300 hover:bg-white/5" : "text-slate-700 cursor-not-allowed"}`}
                style={i === 0 ? { borderColor: panelBorder } : {}}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={b.path}/>
                </svg>
              </button>
            ))}
          </div>

          {historyLength > 0 && <span className="text-[10px] text-slate-700 font-mono hidden sm:block">{historyLength}s</span>}

          <div className="w-px h-4 bg-white/8"/>

          {/* Before/After */}
          <button
            onMouseDown={() => { setShowBefore(true); renderOriginal(); }}
            onMouseUp={() => { setShowBefore(false); applyAdjustments(adjustments); }}
            onMouseLeave={() => { if (showBefore) { setShowBefore(false); applyAdjustments(adjustments); } }}
            className="px-2.5 py-1.5 text-xs rounded-lg border font-sans text-slate-500 hover:text-slate-300 transition select-none"
            style={{ borderColor: panelBorder, background: panelBg }}
          >Before</button>

          {/* Histogram */}
          <button onClick={() => setShowHistogram(v => !v)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border font-sans transition ${showHistogram ? "text-violet-300 border-violet-500/40 bg-violet-900/15" : "text-slate-500 hover:text-slate-300 border-white/8 bg-white/2"}`}>
            Histogram
          </button>

          {/* Toggle controls */}
          <button onClick={() => setShowControls(v => !v)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border font-sans transition ${showControls ? "text-violet-300 border-violet-500/40 bg-violet-900/15" : "text-slate-500 hover:text-slate-300 border-white/8 bg-white/2"}`}>
            Controls
          </button>

          <div className="w-px h-4 bg-white/8"/>

          {/* Export */}
          <button onClick={handleExport}
            className="px-3 py-1.5 text-xs rounded-lg border font-sans text-slate-400 hover:text-white transition"
            style={{ borderColor: panelBorder, background: panelBg }}>
            ↓ Export
          </button>

          {/* Save */}
          {isAuthenticated && (
            <button onClick={() => handleSaveEdit(selectedAlbum)}
              className="px-3 py-1.5 text-xs rounded-lg font-semibold font-sans text-white transition"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 2px 14px rgba(124,58,237,0.35)" }}>
              Save
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════ AI COMMAND BAR (HERO) ═══════════════════ */}
      <AICommandBar ref={aiBarRef} adjustments={adjustments} onApply={handleAIApply} apiUrl={apiUrl}/>

      {/* ═══════════════════ 3-PANEL LAYOUT ═══════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: AI History Panel ── */}
        <div className="ed-left">
          <AIHistoryPanel history={aiHistory} onSuggestionClick={handleSuggestion}/>
        </div>

        {/* ── CENTER: Canvas ── */}
        <div className="ed-canvas flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 flex items-center justify-center overflow-auto relative" style={{ background: "#080810" }}>
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ backgroundImage: "radial-gradient(circle,#334155 1px,transparent 1px)", backgroundSize: "28px 28px" }}/>
            <canvas
              ref={canvasRef}
              className="relative max-w-full max-h-full object-contain rounded-xl"
              style={{ display: "block", boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 160px rgba(0,0,0,0.5)" }}
            />
          </div>
          {showHistogram && (
            <div className="border-t shrink-0 px-4 py-3" style={{ borderColor: panelBorder, background: panelBg }}>
              <Histogram histogramData={histogramData}/>
            </div>
          )}
        </div>

        {/* ── RIGHT: Manual Controls (collapsible) ── */}
        <AnimatePresence initial={false}>
          {showControls && (
            <motion.div
              className="ed-right shrink-0 flex flex-col border-l overflow-hidden"
              style={{ borderColor: panelBorder, background: panelBg, width: 272 }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 272, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {/* Presets */}
              <div className="p-3 border-b shrink-0" style={{ borderColor: panelBorder }}>
                <p className="text-[10px] text-slate-700 uppercase tracking-widest font-sans mb-2">Quick Presets</p>
                <div className="grid grid-cols-4 gap-1">
                  {PRESETS.map(p => (
                    <button key={p.id} onClick={() => applyPreset(p.id)}
                      className="py-1.5 text-[11px] rounded-lg border font-sans text-slate-500 hover:text-violet-300 transition-all"
                      style={{ borderColor: panelBorder, background: "rgba(255,255,255,0.02)" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)"; e.currentTarget.style.background = "rgba(139,92,246,0.08)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = panelBorder; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b shrink-0" style={{ borderColor: panelBorder }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 text-[11px] font-sans font-medium transition-all ${tab === t ? "text-violet-300 border-b-2 border-violet-500" : "text-slate-600 hover:text-slate-400"}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Slider panels */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {tab === "Light" && (
                  <div className="space-y-2.5">
                    {[
                      { label:"Exposure",   cat:"basic",  key:"exposure",   min:-2,   max:2,   step:0.01, icon:"💡" },
                      { label:"Contrast",   cat:"basic",  key:"contrast",   min:-100, max:100, step:1,    icon:"▨"  },
                      { label:"Highlights", cat:"basic",  key:"highlights", min:-100, max:100, step:1,    icon:"☀️" },
                      { label:"Shadows",    cat:"basic",  key:"shadows",    min:-100, max:100, step:1,    icon:"🌑" },
                      { label:"Whites",     cat:"basic",  key:"whites",     min:-100, max:100, step:1,    icon:"⬜" },
                      { label:"Blacks",     cat:"basic",  key:"blacks",     min:-100, max:100, step:1,    icon:"⬛" },
                    ].map(s => (
                      <SmartSlider key={s.key} label={s.label} icon={s.icon} step={s.step}
                        value={adjustments.basic[s.key]}
                        onChange={v => setAdj(s.cat, s.key, v)}
                        min={s.min} max={s.max}
                        highlight={highlightKeys.has(s.key)}/>
                    ))}
                  </div>
                )}
                {tab === "Color" && (
                  <div className="space-y-2.5">
                    {[
                      { label:"Temperature", key:"temperature", icon:"🔥" },
                      { label:"Tint",        key:"tint",        icon:"🎨" },
                      { label:"Vibrance",    key:"vibrance",    icon:"💫" },
                      { label:"Saturation",  key:"saturation",  icon:"🌈" },
                    ].map(s => (
                      <SmartSlider key={s.key} label={s.label} icon={s.icon} step={1}
                        value={adjustments.color[s.key]}
                        onChange={v => setAdj("color", s.key, v)}
                        min={-100} max={100}
                        highlight={highlightKeys.has(s.key)}/>
                    ))}
                  </div>
                )}
                {tab === "Curve" && (
                  <div className="flex flex-col items-center gap-3">
                    <ToneCurveEditor
                      curve={adjustments.toneCurve}
                      onChange={c => setAdjustments(p => ({ ...p, toneCurve: c }))}/>
                    <button onClick={() => setAdjustments(p => ({ ...p, toneCurve: new ToneCurve() }))}
                      className="px-3 py-1.5 text-xs rounded-lg border font-sans text-slate-400 hover:text-white transition"
                      style={{ borderColor: panelBorder, background: "rgba(255,255,255,0.03)" }}>
                      Reset Curve
                    </button>
                  </div>
                )}
                {tab === "HSL" && (
                  <HSLPanel hslAdjustments={adjustments.hsl}
                    onChange={h => setAdjustments(p => ({ ...p, hsl: h }))}/>
                )}
                {tab === "FX" && (
                  <div className="space-y-2.5">
                    {[
                      { label:"Clarity",  key:"clarity",  cat:"effects", min:-100, max:100, icon:"✨" },
                      { label:"Dehaze",   key:"dehaze",   cat:"effects", min:-100, max:100, icon:"🌫️"},
                      { label:"Vignette", key:"vignette", cat:"effects", min:0,    max:100, icon:"⭕" },
                      { label:"Grain",    key:"grain",    cat:"effects", min:0,    max:100, icon:"〰️"},
                    ].map(s => (
                      <SmartSlider key={s.key} label={s.label} icon={s.icon} step={1}
                        value={adjustments.effects[s.key]}
                        onChange={v => setAdj(s.cat, s.key, v)}
                        min={s.min} max={s.max}
                        highlight={highlightKeys.has(s.key)}/>
                    ))}
                    <SmartSlider label="Blur" icon="🔵" step={1}
                      value={adjustments.blur} onChange={setBlur}
                      min={0} max={10} highlight={false}/>
                  </div>
                )}
              </div>

              {/* Bottom */}
              <div className="p-3 border-t shrink-0 space-y-2" style={{ borderColor: panelBorder }}>
                {isAuthenticated && (
                  <select value={selectedAlbum} onChange={e => setSelectedAlbum(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-xs font-sans outline-none text-slate-500"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: panelBorder }}>
                    <option value="">Save to album (optional)</option>
                    {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
                <button onClick={resetAdjustments}
                  className="w-full py-2 text-xs rounded-lg border font-sans text-slate-600 hover:text-slate-300 transition"
                  style={{ borderColor: panelBorder, background: "rgba(255,255,255,0.02)" }}>
                  Reset All Adjustments
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
