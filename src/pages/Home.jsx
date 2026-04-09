import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const features = [
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 20 L8 12 L13 15 L18 6 L22 10" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="13" cy="15" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
            </svg>
        ),
        title: "Tone Curves",
        desc: "Precise luminosity control with an interactive bezier curve editor — just like Lightroom.",
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3 C8 3 3 7 3 12" stroke="#a78bfa" />
                <path d="M12 3 C16 3 21 7 21 12" stroke="#f472b6" />
                <path d="M3 12 C3 17 7 21 12 21" stroke="#34d399" />
                <path d="M21 12 C21 17 17 21 12 21" stroke="#fb923c" />
            </svg>
        ),
        title: "HSL Color Grading",
        desc: "Target individual hue ranges for surgical color correction across reds, greens, blues and more.",
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="12" cy="12" r="8" strokeDasharray="3 2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.5"/>
            </svg>
        ),
        title: "Vignette & Effects",
        desc: "Add film grain, clarity, dehaze, and vignette for a cinematic, professional finish.",
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" strokeLinejoin="round" />
            </svg>
        ),
        title: "Smart Presets",
        desc: "One-click starting points — Vivid, Film, Portrait, B&W — to jumpstart your creative edit.",
    },
];

const Home = ({
    isAuthenticated,
    setCurrentView,
    fileInputRef,
    handleUpload,
    setShowStockPhotos,
}) => {
    const container = useRef();

    useGSAP(
        () => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            tl.from(".hero-badge", { y: -16, opacity: 0, duration: 0.6 })
              .from(".hero-headline", { y: 40, opacity: 0, duration: 0.9 }, "-=0.3")
              .from(".hero-sub", { y: 20, opacity: 0, duration: 0.7 }, "-=0.5")
              .from(".hero-actions", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
              .from(".hero-preview", { x: 50, opacity: 0, duration: 1 }, "-=0.8")
              .from(".stat-item", { y: 16, opacity: 0, duration: 0.5, stagger: 0.1 }, "-=0.5")
              .from(".feature-card", { y: 30, opacity: 0, duration: 0.6, stagger: 0.12 }, "-=0.4");
        },
        { scope: container }
    );

    return (
        <div ref={container} className="min-h-screen">

            {/* ── HERO ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-64px)] max-w-screen-xl mx-auto px-8 pt-8 pb-12">

                {/* Left — Copy */}
                <div className="space-y-8 py-8">
                    <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-900/10 text-violet-300 text-xs tracking-widest font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
                        PRO PHOTO EDITOR · IN YOUR BROWSER
                    </div>

                    <h1 className="hero-headline text-6xl xl:text-7xl font-bold leading-[1.05] text-white font-display">
                        Edit Any Photo.
                        <br />
                        <span
                            style={{
                                background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fb923c 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            Like a Pro.
                        </span>
                    </h1>

                    <p className="hero-sub text-lg text-slate-400 leading-relaxed max-w-lg font-sans">
                        Exposure, tone curves, HSL color grading, clarity,
                        vignette — all the tools professionals use, running
                        entirely in your browser. No installs required.
                    </p>

                    {/* CTAs */}
                    <div className="hero-actions flex flex-col sm:flex-row gap-3">
                        <label className="cursor-pointer">
                            <div className="flex items-center justify-center gap-2.5 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-600/30 select-none font-sans text-sm">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 1v9M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 12h14" strokeLinecap="round"/></svg>
                                Upload Your Photo
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </label>

                        <button
                            onClick={() => setShowStockPhotos(true)}
                            className="flex items-center justify-center gap-2.5 px-7 py-3.5 text-white font-semibold rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 transition-all duration-300 font-sans text-sm"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="1" width="14" height="14" rx="2"/><path d="M1 11l4-4 3 3 2-2 5 5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="5" cy="5" r="1.5" fill="currentColor" stroke="none"/></svg>
                            Try Sample Photos
                        </button>
                    </div>

                    {/* Stats strip */}
                    <div className="flex items-center gap-8 pt-2">
                        {[
                            { value: "5+", label: "Edit Tools" },
                            { value: "4", label: "Presets" },
                            { value: "0", label: "Installs" },
                        ].map((s) => (
                            <div key={s.label} className="stat-item text-center">
                                <p className="text-2xl font-bold text-white font-display">{s.value}</p>
                                <p className="text-xs text-slate-500 font-sans mt-0.5">{s.label}</p>
                            </div>
                        ))}
                        {isAuthenticated && (
                            <button
                                onClick={() => setCurrentView("dashboard")}
                                className="stat-item ml-auto text-xs text-violet-400 hover:text-violet-300 font-sans transition flex items-center gap-1"
                            >
                                View my photos →
                            </button>
                        )}
                    </div>
                </div>

                {/* Right — Photo mosaic */}
                <div className="hero-preview hidden lg:block relative h-[520px]">
                    {/* Glow */}
                    <div className="absolute inset-0 rounded-3xl"
                        style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />

                    {/* Four staggered photo cards */}
                    <div className="absolute top-0 right-16 w-52 h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/5 rotate-2">
                        <img src="/moon_full.png" alt="Full Moon" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3">
                            <span className="text-xs text-white/70 font-sans bg-black/40 px-2 py-0.5 rounded-full">exposure +0.5</span>
                        </div>
                    </div>

                    <div className="absolute top-16 left-0 w-48 h-56 rounded-2xl overflow-hidden shadow-2xl border border-white/5 -rotate-2">
                        <img src="/moon_blood.png" alt="Blood Moon" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3">
                            <span className="text-xs text-white/70 font-sans bg-black/40 px-2 py-0.5 rounded-full">shadows +30</span>
                        </div>
                    </div>

                    <div className="absolute bottom-24 right-4 w-56 h-52 rounded-2xl overflow-hidden shadow-2xl border border-white/5 rotate-1">
                        <img src="/moon_half.png" alt="Half Moon" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3">
                            <span className="text-xs text-white/70 font-sans bg-black/40 px-2 py-0.5 rounded-full">clarity +20</span>
                        </div>
                    </div>

                    <div className="absolute bottom-4 left-12 w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/5 -rotate-3">
                        <img src="/moon_surface.png" alt="Lunar Surface" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3">
                            <span className="text-xs text-white/70 font-sans bg-black/40 px-2 py-0.5 rounded-full">saturation -80</span>
                        </div>
                    </div>

                    {/* Floating edit label */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 border border-violet-500/30 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl pointer-events-none">
                        <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-xs text-violet-200 font-sans font-medium">Live Canvas Editing</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FEATURES ── */}
            <div className="max-w-screen-xl mx-auto px-8 pb-24">
                <div className="text-center mb-12">
                    <p className="text-xs tracking-widest text-slate-500 uppercase mb-3 font-sans">What's included</p>
                    <h2 className="text-3xl font-bold text-white font-display">
                        Professional tools, zero friction
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="feature-card group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-violet-500/30 hover:bg-slate-900/80 transition-all duration-300"
                        >
                            <div className="text-slate-400 group-hover:text-violet-400 transition-colors duration-300 mb-4">
                                {f.icon}
                            </div>
                            <h3 className="text-white font-semibold mb-2 font-display">{f.title}</h3>
                            <p className="text-slate-400 text-sm font-sans leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
