import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

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
                y: -100,
                opacity: 0,
                duration: 1,
                ease: "power3.out",
            });
        },
        { scope: container }
    );

    return (
        <div
            ref={container}
            className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800/40 px-8 py-4"
        >
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <h1
                    className="text-2xl font-bold tracking-widest text-cyan-50 cursor-pointer font-display"
                    onClick={() => setCurrentView("home")}
                >
                    🌙 LUNAR ATELIER
                </h1>

                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => setCurrentView("dashboard")}
                                className={`px-4 py-2 border border-cyan-800/40 text-xs tracking-widest transition font-display ${currentView === "dashboard"
                                    ? "bg-cyan-900/40 text-cyan-50"
                                    : "bg-slate-800/20 hover:bg-slate-800/40 text-slate-300"
                                    }`}
                            >
                                DASHBOARD
                            </button>
                            <span className="text-sm text-slate-400 font-sans">
                                Hi, {user?.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 text-red-200 text-xs tracking-widest transition font-display"
                            >
                                LOGOUT
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-4 py-2 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-50 text-xs tracking-widest transition font-display"
                        >
                            LOGIN / SIGNUP
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;
