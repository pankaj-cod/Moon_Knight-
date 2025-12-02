import React from "react";

const Histogram = ({ histogramData }) => {
    if (!histogramData) return null;

    return (
        <div className="bg-slate-900/60 border-2 border-cyan-800/30 p-6">
            <h3
                className="text-xs tracking-widest text-slate-400 uppercase mb-4 font-display"
            >
                Histogram
            </h3>
            <div className="h-32 bg-slate-950/80 border border-cyan-900/30 p-2 flex items-end">
                {Array.from({ length: 256 }, (_, idx) => {
                    const hR = (histogramData.r[idx] / histogramData.maxVal) * 100;
                    const hG = (histogramData.g[idx] / histogramData.maxVal) * 100;
                    const hB = (histogramData.b[idx] / histogramData.maxVal) * 100;

                    return (
                        <div key={idx} className="flex-1 relative h-full group">
                            <div
                                className="absolute bottom-0 w-full bg-red-500/60 mix-blend-screen"
                                style={{
                                    height: `${hR}%`,
                                    minHeight: hR > 0 ? "1px" : "0",
                                }}
                            />
                            <div
                                className="absolute bottom-0 w-full bg-green-500/60 mix-blend-screen"
                                style={{
                                    height: `${hG}%`,
                                    minHeight: hG > 0 ? "1px" : "0",
                                }}
                            />
                            <div
                                className="absolute bottom-0 w-full bg-blue-500/60 mix-blend-screen"
                                style={{
                                    height: `${hB}%`,
                                    minHeight: hB > 0 ? "1px" : "0",
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Histogram;
