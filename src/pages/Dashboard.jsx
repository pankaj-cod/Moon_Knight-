import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Dashboard = ({ savedEdits, loading, handleDeleteEdit, handleUpload }) => {
    const container = useRef();

    useGSAP(
        () => {
            gsap.from(".header-content", {
                y: -20,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
            });

            gsap.from(".gallery-item", {
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out",
                delay: 0.2,
            });
        },
        { scope: container, dependencies: [savedEdits, loading] }
    );

    return (
        <div ref={container} className="space-y-8">
            <div className="header-content flex justify-between items-center">
                <div>
                    <h2
                        className="text-4xl font-bold tracking-widest text-cyan-50 font-display"
                    >
                        YOUR GALLERY
                    </h2>
                    <p className="text-slate-400 mt-2 font-sans">
                        {savedEdits.length} saved {savedEdits.length === 1 ? "edit" : "edits"}
                    </p>
                </div>
                <label>
                    <div
                        className="px-6 py-3 bg-cyan-900/20 hover:bg-cyan-900/40 border-2 border-cyan-800/40 text-cyan-50 tracking-widest cursor-pointer transition font-display"
                    >
                        + NEW EDIT
                    </div>
                    <input
                        type="file"
                        onChange={handleUpload}
                        className="hidden"
                        accept="image/*"
                    />
                </label>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-20 font-sans">Loading...</div>
            ) : savedEdits.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-cyan-800/30">
                    <p className="text-slate-400 text-xl mb-4 font-sans">No saved edits yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedEdits.map((edit) => (
                        <div
                            key={edit.id || edit._id}
                            className="gallery-item border-2 border-cyan-800/40 bg-slate-900/40"
                        >
                            <div className="relative aspect-square bg-slate-950">
                                <img
                                    src={edit.imageData}
                                    alt="Saved"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-4">
                                <p
                                    className="text-sm text-cyan-50 font-display"
                                >
                                    {edit.presetName || "Custom"}
                                </p>
                                <p className="text-xs text-slate-500 font-sans">
                                    {new Date(edit.createdAt).toLocaleDateString()}
                                </p>
                                <button
                                    onClick={() => handleDeleteEdit(edit.id || edit._id)}
                                    className="mt-2 text-red-400 text-xs font-sans hover:text-red-300"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
