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

            tl.from(".backdrop", {
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
            })
                .from(
                    ".modal-content",
                    {
                        scale: 0.9,
                        opacity: 0,
                        duration: 0.5,
                        ease: "power2.out",
                    },
                    "-=0.3"
                )
                .from(
                    ".photo-item",
                    {
                        y: 20,
                        opacity: 0,
                        duration: 0.5,
                        stagger: 0.1,
                        ease: "power2.out",
                    },
                    "-=0.2"
                );
        },
        { scope: container }
    );

    return (
        <div
            ref={container}
            className="backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm p-4"
        >
            <div className="modal-content bg-slate-900 border-2 border-cyan-800/40 p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2
                        className="text-3xl font-bold tracking-widest text-cyan-50 font-display"
                    >
                        STOCK MOON PHOTOS
                    </h2>
                    <button
                        onClick={() => setShowStockPhotos(false)}
                        className="px-4 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 text-red-200 text-xs tracking-widest transition font-display"
                    >
                        CLOSE
                    </button>
                </div>

                <p className="text-slate-400 mb-6 text-center font-sans">
                    Select a moon photo to start editing
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stockPhotos.map((photo) => (
                        <div
                            key={photo.id}
                            onClick={() => handleStockPhotoSelect(photo.url)}
                            className="photo-item relative aspect-square border-2 border-cyan-800/40 overflow-hidden cursor-pointer group hover:border-cyan-400/60 transition"
                        >
                            <img
                                src={photo.url}
                                alt={photo.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <p
                                        className="text-cyan-50 text-sm font-bold tracking-wider font-display"
                                    >
                                        {photo.title}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-slate-500 text-center mt-6 font-sans">
                    Photos provided by Unsplash
                </p>
            </div>
        </div>
    );
};

export default StockPhotosModal;
