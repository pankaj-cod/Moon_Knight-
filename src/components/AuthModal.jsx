import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const AuthModal = ({
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    authError,
    setAuthError,
    authLoading,
    handleAuth,
    setShowAuthModal,
}) => {
    const container = useRef();

    useGSAP(
        () => {
            gsap.from(".backdrop", {
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
            });

            gsap.from(".modal-content", {
                scale: 0.8,
                opacity: 0,
                duration: 0.5,
                ease: "back.out(1.7)",
                delay: 0.1,
            });
        },
        { scope: container }
    );

    return (
        <div
            ref={container}
            className="backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm"
        >
            <div className="modal-content bg-slate-900 border-2 border-cyan-800/40 p-8 max-w-md w-full mx-4">
                <h2
                    className="text-3xl font-bold tracking-widest text-cyan-50 mb-6 text-center font-display"
                >
                    {authMode === "login" ? "LOGIN" : "SIGN UP"}
                </h2>

                <div className="space-y-4">
                    {authMode === "signup" && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-950/60 border border-cyan-800/40 px-4 py-2 text-cyan-50 placeholder-slate-500 font-sans"
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/60 border border-cyan-800/40 px-4 py-2 text-cyan-50 placeholder-slate-500 font-sans"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950/60 border border-cyan-800/40 px-4 py-2 text-cyan-50 placeholder-slate-500 font-sans"
                    />

                    {authError && (
                        <p className="text-red-400 text-sm text-center font-sans">{authError}</p>
                    )}

                    <button
                        onClick={handleAuth}
                        disabled={authLoading}
                        className="w-full bg-cyan-900/20 hover:bg-cyan-900/40 border-2 border-cyan-800/40 text-cyan-50 py-3 tracking-widest transition disabled:opacity-50 font-display"
                    >
                        {authLoading
                            ? "LOADING..."
                            : authMode === "login"
                                ? "LOGIN"
                                : "SIGN UP"}
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => {
                            setAuthMode(authMode === "login" ? "signup" : "login");
                            setAuthError("");
                        }}
                        className="text-slate-400 hover:text-cyan-50 text-sm font-sans"
                    >
                        {authMode === "login"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Login"}
                    </button>
                </div>

                <button
                    onClick={() => setShowAuthModal(false)}
                    className="mt-4 w-full bg-red-950/20 hover:bg-red-950/30 border border-red-900/40 text-red-200 py-2 text-xs tracking-widest transition font-display"
                >
                    CLOSE
                </button>
            </div>
        </div>
    );
};

export default AuthModal;
