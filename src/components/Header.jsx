import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const ApertureIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" stroke="#a78bfa" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="4.5" fill="#a78bfa" />
        <line x1="14" y1="1" x2="10" y2="9" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="27" y1="14" x2="19" y2="11" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="20" y1="26" x2="15" y2="19" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="26" x2="13" y2="19" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="1" y1="14" x2="9" y2="17" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="2" x2="13" y2="9" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
);

const Header = ({
    isAuthenticated,
    user,
    currentView,
    setCurrentView,
    handleLogout,
    setShowAuthModal,
}) => {
    const container = useRef();

    useGSAP(
        () => {
            gsap.from(container.current, {
                y: -60,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out",
            });
        },
        { scope: container }
    );

    return (
        <div
            ref={container}
            className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60 h-16"
        >
            <div className="flex justify-between items-center h-full max-w-screen-2xl mx-auto px-6">
                {/* Logo */}
                <button
                    onClick={() => setCurrentView("home")}
                    className="flex items-center gap-3 group"
                >
                    <ApertureIcon />
                    <span className="text-lg font-bold tracking-widest text-white font-display group-hover:text-violet-300 transition-colors duration-300">
                        LUMINARY
                    </span>
                    {/* AI pill */}
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-sans tracking-wider"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
                            <path d="M5 .5 6 3.5 9 4.5 6 5.5 5 8.5 4 5.5 1 4.5 4 3.5Z"/>
                        </svg>
                        AI
                    </span>
                </button>

                {/* Nav */}
                <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => setCurrentView("dashboard")}
                                className={`px-4 py-2 text-xs tracking-widest font-display rounded-md transition-all duration-200 ${
                                    currentView === "dashboard"
                                        ? "bg-violet-900/50 text-violet-200 border border-violet-600/40"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                            >
                                MY PHOTOS
                            </button>
                            <button
                                onClick={() => setCurrentView("albums")}
                                className={`px-4 py-2 text-xs tracking-widest font-display rounded-md transition-all duration-200 ${
                                    currentView === "albums"
                                        ? "bg-violet-900/50 text-violet-200 border border-violet-600/40"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                            >
                                ALBUMS
                            </button>

                            <div className="h-4 w-px bg-slate-700 mx-2" />

                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-violet-900/60 border border-violet-600/40 flex items-center justify-center">
                                    <span className="text-xs text-violet-300 font-semibold">
                                        {user?.name?.[0]?.toUpperCase() || "U"}
                                    </span>
                                </div>
                                <span className="text-sm text-slate-400 font-sans hidden sm:block">
                                    {user?.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-300 hover:bg-red-950/30 border border-slate-700 hover:border-red-900/40 rounded-md transition-all font-sans"
                                >
                                    Sign out
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/20"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;
