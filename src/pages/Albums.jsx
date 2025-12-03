import React, { useState, useEffect } from "react";

const Albums = ({
    albums,
    loading,
    fetchAlbums,
    handleCreateAlbum,
    handleUpdateAlbum,
    handleDeleteAlbum,
    pagination
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState(null);
    const [formData, setFormData] = useState({ name: "", description: "" });

    // Query Params State
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchAlbums({ search, sortBy, order, page });
    }, [search, sortBy, order, page]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingAlbum) {
            await handleUpdateAlbum(editingAlbum.id, formData);
        } else {
            await handleCreateAlbum(formData);
        }
        setShowCreateModal(false);
        setEditingAlbum(null);
        setFormData({ name: "", description: "" });
    };

    const openEditModal = (album) => {
        setEditingAlbum(album);
        setFormData({ name: album.name, description: album.description || "" });
        setShowCreateModal(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-bold tracking-widest text-cyan-50 font-display">
                        ALBUMS
                    </h2>
                    <p className="text-slate-400 mt-2 font-sans">
                        Organize your edits
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingAlbum(null);
                        setFormData({ name: "", description: "" });
                        setShowCreateModal(true);
                    }}
                    className="px-6 py-3 bg-cyan-900/20 hover:bg-cyan-900/40 border-2 border-cyan-800/40 text-cyan-50 tracking-widest cursor-pointer transition font-display"
                >
                    + NEW ALBUM
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 bg-slate-900/40 p-4 border border-cyan-800/30 rounded-lg">
                <input
                    type="text"
                    placeholder="Search albums..."
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
                    <option value="name">Name</option>
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
            ) : albums.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-cyan-800/30">
                    <p className="text-slate-400 text-xl mb-4 font-sans">No albums found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {albums.map((album) => (
                        <div
                            key={album.id}
                            className="border-2 border-cyan-800/40 bg-slate-900/40 p-6 relative group"
                        >
                            <h3 className="text-xl font-bold text-cyan-50 mb-2">{album.name}</h3>
                            <p className="text-slate-400 text-sm mb-2">{album.description}</p>
                            <p className="text-xs text-cyan-300 font-sans mb-2">
                                {album._count?.edits || 0} items
                            </p>
                            <p className="text-xs text-slate-500 font-sans mb-4">
                                Created: {new Date(album.createdAt).toLocaleDateString()}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(album)}
                                    className="text-cyan-400 text-xs hover:text-cyan-300"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteAlbum(album.id)}
                                    className="text-red-400 text-xs hover:text-red-300"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 bg-slate-900 border border-cyan-800/40 text-cyan-50 disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="px-4 py-2 text-cyan-50">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <button
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-slate-900 border border-cyan-800/40 text-cyan-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border-2 border-cyan-500/30 p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-cyan-50 mb-6">
                            {editingAlbum ? "Edit Album" : "New Album"}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-cyan-50 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-cyan-800/40 text-cyan-50 px-4 py-2 rounded focus:outline-none focus:border-cyan-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-cyan-50 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-cyan-800/40 text-cyan-50 px-4 py-2 rounded focus:outline-none focus:border-cyan-500"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                                >
                                    {editingAlbum ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Albums;
