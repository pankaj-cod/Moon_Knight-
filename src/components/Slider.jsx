import React from "react";

const Slider = ({ label, value, onChange, min, max, step = 1, icon }) => {
    const formatValue = (val) => {
        // Format based on step size
        if (step < 1) {
            return val.toFixed(2);
        }
        return Math.round(val);
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label
                    className="text-sm tracking-widest text-slate-400 uppercase font-display"
                    style={{ letterSpacing: "0.15em" }}
                >
                    {icon} {label}
                </label>
                <span className="text-xs text-cyan-200 font-mono bg-slate-900/40 px-3 py-1 rounded-sm border border-cyan-800/30">
                    {formatValue(value)}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-cyan-900/30 rounded appearance-none cursor-pointer"
                style={{ accentColor: "#22d3ee" }}
            />
        </div>
    );
};

export default Slider;
