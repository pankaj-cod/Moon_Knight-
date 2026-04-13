import React, { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Slider from "../components/Slider";
import Histogram from "../components/Histogram";
import ToneCurveEditor from "../components/ToneCurveEditor";
import HSLPanel from "../components/HSLPanel";
import AICommandBar from "../components/AICommandBar";
import { useCanvasEditor } from "../hooks/useCanvasEditor";
import { ToneCurve } from "../utils/ToneCurve";
import { mergeAIEdit } from "../utils/mergeAIEdit";

const Editor = ({
    image,
    showBefore,
    setShowBefore,
    histogramData,
    setHistogramData,
    isAuthenticated,
    handleSaveEdit,
    handleDownload,
    setCurrentView,
    setImage,
    resetAdjustments,
    applyPreset,
    adjustments,
    setAdjustments,
    albums = [],
    undo,
    redo,
    canUndo = false,
    canRedo = false,
    historyLength = 0,
    apiUrl = "http://localhost:5001/api",
}) => {
    const container = useRef();
    const [selectedAlbum, setSelectedAlbum] = useState("");
    const [activeTab, setActiveTab] = useState("light");
    const [showHistogram, setShowHistogram] = useState(false);
    const [showAIBar, setShowAIBar] = useState(false);

    const { canvasRef, applyAdjustments, exportBlob, renderOriginal, getHistogramData } = useCanvasEditor(image);

    // applyAdjustments uses requestAnimationFrame internally — no debounce needed.
    // showHistogram is intentionally NOT a dep: it's only read inside the callback,
    // not a reason to re-trigger the pipeline.
    useEffect(() => {
        if (!adjustments?.basic) return;
        applyAdjustments(adjustments, () => {
            if (showHistogram) {
                const histData = getHistogramData();
                if (histData) setHistogramData(histData);
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adjustments]);

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isMac = navigator.platform.toUpperCase().includes("MAC");
            const modifier = isMac ? e.metaKey : e.ctrlKey;
            if (!modifier) return;

            if (e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) undo();
            } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
                e.preventDefault();
                if (canRedo) redo();
            } else if (e.key === "k") {
                // Cmd+K / Ctrl+K: toggle AI command bar
                e.preventDefault();
                setShowAIBar((v) => !v);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

    useGSAP(
        () => {
            gsap.from(".editor-sidebar", { x: 40, opacity: 0, duration: 0.6, ease: "power2.out" });
            gsap.from(".editor-toolbar", { y: -20, opacity: 0, duration: 0.5, ease: "power2.out" });
            gsap.from(".editor-canvas-area", { opacity: 0, duration: 0.8, ease: "power2.out" });
        },
        { scope: container, dependencies: [image] }
    );

    const updateAdjustment = (category, key, value) => {
        setAdjustments(prev => ({
            ...prev,
            [category]: { ...prev[category], [key]: value },
        }));
    };

    const updateBlur = (value) => {
        setAdjustments(prev => ({ ...prev, blur: value }));
    };

    /** Called by AICommandBar with the flat AI diff { key: value } */
    const handleAIApply = useCallback((flatDiff) => {
        setAdjustments(prev => mergeAIEdit(prev, flatDiff));
    }, [setAdjustments]);

    const handleDownloadClick = async () => {
        try {
            const blob = await exportBlob("image/png", 1.0);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "luminary-edit.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download image");
        }
    };

    const tabs = [
        { id: "light", label: "Light" },
        { id: "color", label: "Color" },
        { id: "curve", label: "Curve" },
        { id: "hsl", label: "HSL" },
        { id: "effects", label: "FX" },
    ];

    const presets = [
        { id: "vivid", label: "Vivid" },
        { id: "film", label: "Film" },
        { id: "portrait", label: "Portrait" },
        { id: "monochrome", label: "B&W" },
    ];

    return (
        <div ref={container} className="flex h-full overflow-hidden">

            {/* ── CANVAS AREA ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Top Toolbar */}
                <div className="editor-toolbar flex items-center justify-between px-5 py-3 bg-slate-900/80 border-b border-slate-800 shrink-0 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setImage(null);
                                resetAdjustments();
                                setCurrentView(isAuthenticated ? "dashboard" : "home");
                            }}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-sans group"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M9 2L4 7l5 5" />
                            </svg>
                            Back
                        </button>
                        <div className="h-4 w-px bg-slate-700" />
                        <span className="text-slate-500 text-xs font-sans hidden sm:block">Editing photo</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Undo / Redo */}
                        <div className="flex items-center rounded-md border border-slate-700 overflow-hidden">
                            <button
                                onClick={undo}
                                disabled={!canUndo}
                                title="Undo (Cmd+Z)"
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition font-sans border-r border-slate-700 ${
                                    canUndo
                                        ? "text-slate-200 hover:bg-slate-800 cursor-pointer"
                                        : "text-slate-600 cursor-not-allowed"
                                }`}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 6a4 4 0 1 0 4-4H2M2 2v4h4" />
                                </svg>
                                Undo
                            </button>
                            <button
                                onClick={redo}
                                disabled={!canRedo}
                                title="Redo (Cmd+Shift+Z)"
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition font-sans ${
                                    canRedo
                                        ? "text-slate-200 hover:bg-slate-800 cursor-pointer"
                                        : "text-slate-600 cursor-not-allowed"
                                }`}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 6a4 4 0 1 1-4-4h4M10 2v4H6" />
                                </svg>
                                Redo
                            </button>
                        </div>

                        {historyLength > 0 && (
                            <span className="text-[10px] text-slate-600 font-sans tabular-nums hidden sm:block">
                                {historyLength} step{historyLength !== 1 ? "s" : ""}
                            </span>
                        )}

                        <div className="h-4 w-px bg-slate-700" />

                        {/* Before / After */}
                        <button
                            onMouseDown={() => { setShowBefore(true); renderOriginal(); }}
                            onMouseUp={() => { setShowBefore(false); applyAdjustments(adjustments); }}
                            onMouseLeave={() => { if (showBefore) { setShowBefore(false); applyAdjustments(adjustments); } }}
                            className="px-3 py-1.5 text-xs rounded-md border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition font-sans select-none"
                        >
                            Hold: Before
                        </button>

                        {/* Histogram toggle */}
                        <button
                            onClick={() => setShowHistogram(!showHistogram)}
                            className={`px-3 py-1.5 text-xs rounded-md border transition font-sans ${
                                showHistogram
                                    ? "border-violet-500/60 text-violet-300 bg-violet-900/20"
                                    : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                            }`}
                        >
                            Histogram
                        </button>

                        {/* AI Edit toggle */}
                        <button
                            onClick={() => setShowAIBar((v) => !v)}
                            title="AI-powered editing (⌘K)"
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition font-sans ${
                                showAIBar
                                    ? "border-violet-500/60 text-violet-300 bg-violet-900/20"
                                    : "border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                            }`}
                        >
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M6 1l1.1 3.3L10.5 5.5 7.1 6.6 6 10l-1.1-3.4L1.5 5.5l3.4-1.2Z"/>
                            </svg>
                            AI Edit
                        </button>

                        <div className="h-4 w-px bg-slate-700" />

                        {/* Export */}
                        <button
                            onClick={handleDownloadClick}
                            className="px-4 py-1.5 text-xs rounded-md bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition font-sans"
                        >
                            ↓ Export PNG
                        </button>

                        {/* Save */}
                        {isAuthenticated && (
                            <button
                                onClick={() => handleSaveEdit(selectedAlbum)}
                                className="px-4 py-1.5 text-xs rounded-md bg-violet-600 hover:bg-violet-500 text-white font-semibold transition font-sans shadow-lg shadow-violet-600/20"
                            >
                                Save
                            </button>
                        )}
                    </div>
                </div>

                {/* Canvas */}
                <div className="editor-canvas-area flex-1 bg-[#0d0d12] flex items-center justify-center overflow-auto relative">
                    {/* Subtle grid pattern */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                            backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        className="relative max-w-full max-h-full object-contain rounded-lg shadow-[0_0_80px_rgba(0,0,0,0.8)]"
                        style={{ display: "block" }}
                    />

                    {/* ── AI Command Bar ── */}
                    {showAIBar && (
                        <AICommandBar
                            adjustments={adjustments}
                            onApply={handleAIApply}
                            apiUrl={apiUrl}
                        />
                    )}
                </div>

                {/* Histogram (toggleable strip) */}
                {showHistogram && (
                    <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-3 shrink-0">
                        <Histogram histogramData={histogramData} />
                    </div>
                )}
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="editor-sidebar w-72 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">

                {/* Presets */}
                <div className="p-4 border-b border-slate-800">
                    <p className="text-[10px] font-sans text-slate-500 uppercase tracking-widest mb-3">Quick Presets</p>
                    <div className="grid grid-cols-4 gap-1.5">
                        {presets.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => applyPreset(p.id)}
                                className="py-2 text-xs text-slate-300 bg-slate-800 hover:bg-violet-900/50 hover:text-violet-200 border border-slate-700 hover:border-violet-500/50 rounded-lg transition-all duration-200 font-sans font-medium"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-xs font-sans font-medium transition-all ${
                                activeTab === tab.id
                                    ? "text-violet-300 border-b-2 border-violet-500 bg-violet-900/10"
                                    : "text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Controls — Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">

                    {/* ── Light ── */}
                    {activeTab === "light" && (
                        <div className="space-y-3">
                            <Slider label="Exposure" value={adjustments.basic.exposure} onChange={(v) => updateAdjustment("basic", "exposure", v)} min={-2} max={2} step={0.01} icon="💡" />
                            <Slider label="Contrast" value={adjustments.basic.contrast} onChange={(v) => updateAdjustment("basic", "contrast", v)} min={-100} max={100} step={1} icon="▨" />
                            <Slider label="Highlights" value={adjustments.basic.highlights} onChange={(v) => updateAdjustment("basic", "highlights", v)} min={-100} max={100} step={1} icon="☀️" />
                            <Slider label="Shadows" value={adjustments.basic.shadows} onChange={(v) => updateAdjustment("basic", "shadows", v)} min={-100} max={100} step={1} icon="🌑" />
                            <Slider label="Whites" value={adjustments.basic.whites} onChange={(v) => updateAdjustment("basic", "whites", v)} min={-100} max={100} step={1} icon="⬜" />
                            <Slider label="Blacks" value={adjustments.basic.blacks} onChange={(v) => updateAdjustment("basic", "blacks", v)} min={-100} max={100} step={1} icon="⬛" />
                        </div>
                    )}

                    {/* ── Color ── */}
                    {activeTab === "color" && (
                        <div className="space-y-3">
                            <Slider label="Temperature" value={adjustments.color.temperature} onChange={(v) => updateAdjustment("color", "temperature", v)} min={-100} max={100} step={1} icon="🔥" />
                            <Slider label="Tint" value={adjustments.color.tint} onChange={(v) => updateAdjustment("color", "tint", v)} min={-100} max={100} step={1} icon="🎨" />
                            <Slider label="Vibrance" value={adjustments.color.vibrance} onChange={(v) => updateAdjustment("color", "vibrance", v)} min={-100} max={100} step={1} icon="💫" />
                            <Slider label="Saturation" value={adjustments.color.saturation} onChange={(v) => updateAdjustment("color", "saturation", v)} min={-100} max={100} step={1} icon="🌈" />
                        </div>
                    )}

                    {/* ── Tone Curve ── */}
                    {activeTab === "curve" && (
                        <div className="flex flex-col items-center gap-3">
                            <ToneCurveEditor
                                curve={adjustments.toneCurve}
                                onChange={(newCurve) =>
                                    setAdjustments(prev => ({ ...prev, toneCurve: newCurve }))
                                }
                            />
                            <button
                                onClick={() =>
                                    setAdjustments(prev => ({ ...prev, toneCurve: new ToneCurve() }))
                                }
                                className="px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition font-sans"
                            >
                                Reset Curve
                            </button>
                        </div>
                    )}

                    {/* ── HSL ── */}
                    {activeTab === "hsl" && (
                        <HSLPanel
                            hslAdjustments={adjustments.hsl}
                            onChange={(newHsl) =>
                                setAdjustments(prev => ({ ...prev, hsl: newHsl }))
                            }
                        />
                    )}

                    {/* ── FX ── */}
                    {activeTab === "effects" && (
                        <div className="space-y-3">
                            <Slider label="Clarity" value={adjustments.effects.clarity} onChange={(v) => updateAdjustment("effects", "clarity", v)} min={-100} max={100} step={1} icon="✨" />
                            <Slider label="Dehaze" value={adjustments.effects.dehaze} onChange={(v) => updateAdjustment("effects", "dehaze", v)} min={-100} max={100} step={1} icon="🌫️" />
                            <Slider label="Vignette" value={adjustments.effects.vignette} onChange={(v) => updateAdjustment("effects", "vignette", v)} min={0} max={100} step={1} icon="⭕" />
                            <Slider label="Grain" value={adjustments.effects.grain} onChange={(v) => updateAdjustment("effects", "grain", v)} min={0} max={100} step={1} icon="〰️" />
                            <Slider label="Blur" value={adjustments.blur} onChange={updateBlur} min={0} max={10} step={1} icon="🔵" />
                        </div>
                    )}
                </div>

                {/* Bottom Action Bar */}
                <div className="p-3 border-t border-slate-800 space-y-2 shrink-0">
                    {isAuthenticated && (
                        <select
                            value={selectedAlbum}
                            onChange={(e) => setSelectedAlbum(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-violet-500 transition font-sans"
                        >
                            <option value="">Save to album (optional)</option>
                            {albums.map((album) => (
                                <option key={album.id} value={album.id}>
                                    {album.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={resetAdjustments}
                        className="w-full py-2 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-lg transition font-sans"
                    >
                        Reset All Adjustments
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Editor;
