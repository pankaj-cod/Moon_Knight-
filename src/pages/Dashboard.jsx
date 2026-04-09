import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";

const Dashboard = ({
    savedEdits = [],
    loading = false,
    handleDeleteEdit,
    handleUpload,
    fetchEdits,
    pagination,
}) => {
    const containerRef = useRef(null);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (typeof fetchEdits === "function") {
            fetchEdits({ search, sortBy, order, page });
        }
    }, [search, sortBy, order, page, fetchEdits]);

    useEffect(() => {
        if (!containerRef.current || loading) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(".gallery-item",
                { y: 24, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.1, clearProps: "all" }
            );
        }, containerRef);
        return () => ctx.revert();
    }, [savedEdits.length, loading]);

    return (
        <div ref={containerRef} className="space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-sans">Your workspace</p>
                    <h2 className="text-4xl font-bold text-white font-display">My Photos</h2>
                    <p className="text-slate-400 mt-1.5 font-sans text-sm">
                        {pagination?.total ?? savedEdits.length} saved {savedEdits.length === 1 ? "edit" : "edits"}
                    </p>
                </div>

                <label className="shrink-0 cursor-pointer">
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-violet-600/25 font-sans select-none">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1v8M3 5l4-4 4 4"/><path d="M1 11h12"/></svg>
                        New Edit
                    </div>
                    <input type="file" onChange={handleUpload} className="hidden" accept="image/*" />
                </label>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex-1 min-w-48 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l3 3" strokeLinecap="round"/></svg>
                    <input
                        type="text"
                        placeholder="Search photos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:border-violet-500 transition font-sans placeholder:text-slate-600"
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:border-violet-500 transition font-sans"
                >
                    <option value="createdAt">Date Created</option>
                    <option value="presetName">Preset Name</option>
                </select>
                <select
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 text-sm rounded-xl focus:outline-none focus:border-violet-500 transition font-sans"
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>

            {/* Gallery */}
            {loading ? (
                <div className="flex items-center justify-center py-20 gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    <span className="text-slate-400 font-sans text-sm">Loading your photos...</span>
                </div>
            ) : savedEdits.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-slate-800 rounded-2xl">
                    <div className="text-5xl mb-4">📷</div>
                    <p className="text-slate-400 text-lg mb-2 font-sans">No saved edits yet</p>
                    <p className="text-slate-600 text-sm font-sans">Upload a photo and save your first edit</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {savedEdits.map((edit) => {
                        const key = edit.id ?? edit._id;
                        const dateStr = edit.createdAt ? new Date(edit.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
                        return (
                            <div key={key} className="gallery-item group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-900/10">
                                <div className="aspect-square bg-slate-950 overflow-hidden">
                                    <img
                                        src={edit.imageData}
                                        alt={edit.presetName ? `${edit.presetName} preview` : "Saved edit"}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <button
                                        onClick={() => handleDeleteEdit(edit.id ?? edit._id)}
                                        className="self-start px-3 py-1 bg-red-900/60 hover:bg-red-700/80 text-red-200 text-xs rounded-lg transition font-sans border border-red-800/40"
                                    >
                                        Delete
                                    </button>
                                </div>

                                {/* Card footer */}
                                <div className="p-3">
                                    <p className="text-sm text-white font-medium font-display truncate">
                                        {edit.presetName || "Custom Edit"}
                                    </p>
                                    <p className="text-xs text-slate-500 font-sans mt-0.5">{dateStr}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl disabled:opacity-40 hover:bg-slate-700 transition font-sans"
                    >
                        ← Prev
                    </button>
                    <span className="px-4 py-2 text-slate-400 text-sm font-sans">
                        {page} / {pagination.totalPages}
                    </span>
                    <button
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl disabled:opacity-40 hover:bg-slate-700 transition font-sans"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
