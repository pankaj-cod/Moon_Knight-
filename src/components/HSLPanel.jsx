import React, { useState } from 'react';
import Slider from './Slider';

const HSLPanel = ({ hslAdjustments, onChange }) => {
    const [expandedColor, setExpandedColor] = useState(null);

    const colors = [
        { name: 'red', label: 'Red', icon: '🔴' },
        { name: 'orange', label: 'Orange', icon: '🟠' },
        { name: 'yellow', label: 'Yellow', icon: '🟡' },
        { name: 'green', label: 'Green', icon: '🟢' },
        { name: 'aqua', label: 'Aqua', icon: '🔵' },
        { name: 'blue', label: 'Blue', icon: '🔵' },
        { name: 'purple', label: 'Purple', icon: '🟣' },
        { name: 'magenta', label: 'Magenta', icon: '🟣' }
    ];

    const handleAdjustment = (colorName, property, value) => {
        const newAdjustments = {
            ...hslAdjustments,
            [colorName]: {
                ...hslAdjustments[colorName],
                [property]: value
            }
        };
        onChange(newAdjustments);
    };

    return (
        <div className="hsl-panel space-y-2">
            {colors.map(({ name, label, icon }) => {
                const isExpanded = expandedColor === name;
                const adj = hslAdjustments[name] || { hue: 0, saturation: 0, luminance: 0 };
                const hasAdjustments = adj.hue !== 0 || adj.saturation !== 0 || adj.luminance !== 0;

                return (
                    <div key={name} className="border border-cyan-800/30 rounded">
                        <button
                            onClick={() => setExpandedColor(isExpanded ? null : name)}
                            className={`w-full px-4 py-2 flex items-center justify-between text-left transition ${isExpanded ? 'bg-cyan-900/20' : 'bg-slate-900/40 hover:bg-slate-900/60'
                                }`}
                        >
                            <span className="text-sm tracking-wider text-slate-300 font-display flex items-center gap-2">
                                <span>{icon}</span>
                                {label}
                                {hasAdjustments && (
                                    <span className="text-xs text-cyan-400">●</span>
                                )}
                            </span>
                            <span className="text-slate-400">
                                {isExpanded ? '▼' : '▶'}
                            </span>
                        </button>

                        {isExpanded && (
                            <div className="p-4 space-y-3 bg-slate-950/40">
                                <Slider
                                    label="Hue"
                                    value={adj.hue}
                                    onChange={(v) => handleAdjustment(name, 'hue', v)}
                                    min={-180}
                                    max={180}
                                    step={1}
                                    icon="🎨"
                                />
                                <Slider
                                    label="Saturation"
                                    value={adj.saturation}
                                    onChange={(v) => handleAdjustment(name, 'saturation', v)}
                                    min={-100}
                                    max={100}
                                    step={1}
                                    icon="💫"
                                />
                                <Slider
                                    label="Luminance"
                                    value={adj.luminance}
                                    onChange={(v) => handleAdjustment(name, 'luminance', v)}
                                    min={-100}
                                    max={100}
                                    step={1}
                                    icon="💡"
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default HSLPanel;
