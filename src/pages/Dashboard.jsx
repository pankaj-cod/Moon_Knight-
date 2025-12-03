import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";

const Dashboard = ({
    savedEdits = [], // default to empty array
    loading = false,
    handleDeleteEdit,
    handleUpload,
    fetchEdits,
    pagination,
}) => {
    const containerRef = useRef(null);

    // Query Params State
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);

    // Fetch edits when query params change
    useEffect(() => {
        // ensure fetchEdits exists
        if (typeof fetchEdits === "function") {
            fetchEdits({ search, sortBy, order, page });
        }
    }, [search, sortBy, order, page, fetchEdits]);

    // GSAP animations scoped to this container using gsap.context
    useEffect(() => {
        if (!containerRef.current || loading) return;

        const ctx = gsap.context(() => {
            // Animate header only once
            gsap.fromTo(".header-content",
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
            );

            // Animate gallery items with stagger
            const items = gsap.utils.toArray(".gallery-item");
            if (items.length > 0) {
                gsap.fromTo(items,
                    { y: 30, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.6,
                        stagger: 0.1,
                        ease: "power2.out",
                        delay: 0.2,
                        clearProps: "all" // Clear inline styles after animation
                    }
                );
            }
        }, containerRef);

        // cleanup
        return () => ctx.revert();
    }, [savedEdits.length, loading]); // Only re-run when the number of items changes

    return (
        <div ref={containerRef} className="space-y-8">
            <div className="header-content flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-bold tracking-widest text-cyan-50 font-display">
                        YOUR GALLERY
                    </h2>
                    <p className="text-slate-400 mt-2 font-sans">
                        {pagination?.total ?? savedEdits.length} saved{" "}
                        {savedEdits.length === 1 ? "edit" : "edits"}
                    </p>
                </div>

                <label>
                    <div
                        className="px-6 py-3 bg-cyan-900/20 hover:bg-cyan-900/40 border-2 border-cyan-800/40 text-cyan-50 tracking-widest cursor-pointer transition font-display"
                        role="button"
                        tabIndex={0}
                    >
                        + NEW EDIT
                    </div>
                    <input
                        type="file"
                        onChange={handleUpload}
                        className="hidden"
                        accept="image/*"
                        aria-label="Upload new edit"
                    />
                </label>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 bg-slate-900/40 p-4 border border-cyan-800/30 rounded-lg">
                <input
                    type="text"
                    placeholder="Search edits..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-slate-950 border border-cyan-800/40 text-cyan-50 px-4 py-2 rounded focus:outline-none focus:border-cyan-500"
                />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-950 border border-cyan-800/40 text-cyan-50 px-4 py-2 rounded focus:outline-none focus:border-cyan-500"
                >
                    <option value="createdAt">Date Created</option>
                    <option value="presetName">Preset Name</option>
                </select>
                <select
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="bg-slate-950 border border-cyan-800/40 text-cyan-50 px-4 py-2 rounded focus:outline-none focus:border-cyan-500"
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-20 font-sans">Loading...</div>
            ) : savedEdits.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-cyan-800/30">
                    <p className="text-slate-400 text-xl mb-4 font-sans">No saved edits found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedEdits.map((edit) => {
                        const key = edit.id ?? edit._id;
                        const dateStr = edit.createdAt ? new Date(edit.createdAt).toLocaleDateString() : "";
                        return (
                            <div
                                key={key}
                                className="gallery-item border-2 border-cyan-800/40 bg-slate-900/40"
                            >
                                <div className="relative aspect-square bg-slate-950">
                                    <img
                                        src={edit.imageData}
                                        alt={edit.presetName ? `${edit.presetName} preview` : "Saved edit preview"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-cyan-50 font-display">
                                        {edit.presetName || "Custom"}
                                    </p>
                                    <p className="text-xs text-slate-500 font-sans">{dateStr}</p>
                                    <button
                                        onClick={() => handleDeleteEdit(edit.id ?? edit._id)}
                                        className="mt-2 text-red-400 text-xs font-sans hover:text-red-300"
                                        aria-label={`Delete edit ${edit.presetName || key}`}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-slate-900 border border-cyan-800/40 text-cyan-50 disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="px-4 py-2 text-cyan-50">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <button
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        className="px-4 py-2 bg-slate-900 border border-cyan-800/40 text-cyan-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
