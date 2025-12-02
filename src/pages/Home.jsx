import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
            const tl = gsap.timeline();

            tl.from(".title-icon", {
                y: -50,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
            })
                .from(
                    ".main-title",
                    {
                        y: 50,
                        opacity: 0,
                        duration: 1,
                        ease: "power3.out",
                    },
                    "-=0.5"
                )
                .from(
                    ".subtitle",
                    {
                        y: 20,
                        opacity: 0,
                        duration: 0.8,
                        ease: "power2.out",
                    },
                    "-=0.5"
                )
                .from(
                    ".action-card",
                    {
                        y: 30,
                        opacity: 0,
                        duration: 0.8,
                        stagger: 0.2,
                        ease: "power2.out",
                    },
                    "-=0.3"
                )
                .from(
                    ".dashboard-btn",
                    {
                        y: 20,
                        opacity: 0,
                        duration: 0.5,
                        ease: "back.out(1.7)",
                    },
                    "-=0.2"
                );
        },
        { scope: container }
    );

    return (
        <div ref={container} className="text-center space-y-12 max-w-xl mx-auto mt-20">
            <div className="space-y-4">
                <div className="title-icon flex items-center justify-center gap-4 mb-6">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent to-cyan-900/50"></div>
                    <div className="text-6xl">🌙</div>
                    <div className="h-px w-24 bg-gradient-to-l from-transparent to-cyan-900/50"></div>
                </div>

                <h2
                    className="main-title text-5xl font-bold tracking-widest text-cyan-50 font-display"
                    style={{
                        letterSpacing: "0.2em",
                    }}
                >
                    LUNAR
                </h2>
                <div className="subtitle h-px w-48 mx-auto bg-gradient-to-r from-transparent via-cyan-800/60 to-transparent"></div>
                <h3
                    className="subtitle text-3xl tracking-widest text-cyan-100/80 font-display"
                    style={{
                        letterSpacing: "0.3em",
                    }}
                >
                    ATELIER
                </h3>
                <p className="subtitle text-lg text-slate-400 italic tracking-wide mt-6 font-sans">
                    Celestial Photography Enhancement
                </p>
            </div>

            <div className="space-y-4">
                <label className="action-card block">
                    <div className="relative group cursor-pointer">
                        <div className="relative border-2 border-cyan-800/40 bg-slate-900/40 p-12 transition duration-500 hover:border-cyan-400/60">
                            <div className="space-y-4">
                                <div className="text-5xl">📸</div>
                                <p
                                    className="text-xl tracking-widest text-cyan-50 font-display"
                                >
                                    UPLOAD IMAGE
                                </p>
                            </div>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleUpload}
                        className="hidden"
                        accept="image/*"
                    />
                </label>

                <div className="action-card flex items-center gap-4">
                    <div className="flex-1 h-px bg-cyan-900/30"></div>
                    <span className="text-slate-500 text-sm tracking-wider font-sans">OR</span>
                    <div className="flex-1 h-px bg-cyan-900/30"></div>
                </div>

                <button
                    onClick={() => setShowStockPhotos(true)}
                    className="action-card w-full border-2 border-cyan-800/40 bg-slate-900/40 p-8 transition duration-500 hover:border-cyan-400/60 hover:bg-slate-900/60"
                >
                    <div className="space-y-2">
                        <div className="text-4xl">🖼️</div>
                        <p
                            className="text-lg tracking-widest text-cyan-50 font-display"
                        >
                            STOCK PHOTOS
                        </p>
                        <p className="text-xs text-slate-400 font-sans">
                            Try our curated moon images
                        </p>
                    </div>
                </button>
            </div>

            {isAuthenticated && (
                <button
                    onClick={() => setCurrentView("dashboard")}
                    className="dashboard-btn px-8 py-3 bg-cyan-900/20 hover:bg-cyan-900/40 border-2 border-cyan-800/40 text-cyan-50 tracking-widest transition font-display"
                >
                    VIEW MY DASHBOARD
                </button>
            )}
        </div>
    );
};

export default Home;
