import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const StockPhotosModal = ({
    stockPhotos,
    handleStockPhotoSelect,
    setShowStockPhotos,
}) => {
    const container = useRef();

    useGSAP(
        () => {
            const tl = gsap.timeline();
            tl.from(".spm-backdrop", { opacity: 0, duration: 0.4, ease: "power2.out" })
              .from(".spm-panel", { y: 30, opacity: 0, scale: 0.97, duration: 0.45, ease: "power3.out" }, "-=0.2")
              .from(".spm-photo", { y: 16, opacity: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" }, "-=0.2");
        },
        { scope: container }
    );

    return (
        <div
            ref={container}
            className="spm-backdrop fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(5,5,10,0.88)", backdropFilter: "blur(12px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowStockPhotos(false); }}
        >
            <div className="spm-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-white font-display">Sample Photos</h2>
                        <p className="text-slate-400 text-sm font-sans mt-0.5">
                            Pick a photo to start editing
                        </p>
                    </div>
                    <button
                        onClick={() => setShowStockPhotos(false)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M3 3l10 10M13 3L3 13" />
                        </svg>
                    </button>
                </div>

                {/* Grid */}
                <div className="overflow-y-auto p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {stockPhotos.map((photo) => (
                            <button
                                key={photo.id}
                                onClick={() => handleStockPhotoSelect(photo.url)}
                                className="spm-photo group relative aspect-square rounded-xl overflow-hidden border border-slate-800 hover:border-violet-500/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.title}
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.parentElement.style.background = "#1e293b";
                                    }}
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                    <p className="text-white text-sm font-semibold font-display">{photo.title}</p>
                                    <p className="text-violet-300 text-xs font-sans mt-0.5">Click to edit →</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-3 border-t border-slate-800">
                    <p className="text-xs text-slate-600 text-center font-sans">AI-generated sample photos for demonstration</p>
                </div>
            </div>
        </div>
    );
};

export default StockPhotosModal;
