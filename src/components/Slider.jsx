import React from "react";

const Slider = ({ label, value, onChange, min, max, icon }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label
                className="text-sm tracking-widest text-slate-400 uppercase font-display"
                style={{ letterSpacing: "0.15em" }}
            >
                {icon} {label}
            </label>
            <span className="text-xs text-cyan-200 font-mono bg-slate-900/40 px-3 py-1 rounded-sm border border-cyan-800/30">
                {value}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1 bg-cyan-900/30 rounded appearance-none cursor-pointer"
            style={{ accentColor: "#22d3ee" }}
        />
    </div>
);

export default Slider;
