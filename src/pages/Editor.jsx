
import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Slider from "../components/Slider";
import Histogram from "../components/Histogram";

const Editor = ({
    image,
    imgRef,
    showBefore,
    setShowBefore,
    histogramData,
    isAuthenticated,
    handleSaveEdit,
    handleDownload,
    setCurrentView,
    setImage,
    resetAdjustments,
    applyPreset,
    brightness,
    setBrightness,
    contrast,
    setContrast,
    saturate,
    setSaturate,
    hue,
    setHue,
    temperature,
    setTemperature,
    blur,
    setBlur,
    getCssFilter,
    albums = [],
}) => {
    const container = useRef();
    const [selectedAlbum, setSelectedAlbum] = useState("");

    useGSAP(
        () => {
            gsap.from(".editor-panel", {
                opacity: 0,
                y: 20,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
            });
        },
        { scope: container, dependencies: [image] }
    );

    return (
        <div ref={container} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="editor-panel lg:col-span-3 space-y-4">
                <div className="relative bg-slate-950 border-2 border-cyan-800/40">
                    <img
                        ref={imgRef}
                        src={image}
                        alt="moon"
                        className="w-full h-auto"
                        style={{
                            filter: getCssFilter(),
                            display: showBefore ? "none" : "block",
                        }}
                    />
                    {showBefore && (
                        <img src={image} alt="original" className="w-full h-auto" />
                    )}

                    <button
                        onClick={() => setShowBefore(!showBefore)}
                        className="absolute top-6 right-6 bg-slate-900/80 px-6 py-2 text-xs tracking-widest border border-cyan-800/40 text-cyan-50 font-display"
                    >
                        {showBefore ? "AFTER" : "BEFORE"}
                    </button>
                </div>

                <Histogram histogramData={histogramData} />

                {/* Controls row with DOWNLOAD */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {isAuthenticated && (
                        <>
                            <div className="col-span-2 md:col-span-4 flex gap-2">
                                <select
                                    value={selectedAlbum}
                                    onChange={(e) => setSelectedAlbum(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-cyan-800/40 text-cyan-50 px-4 py-2 text-xs font-sans focus:outline-none"
                                >
                                    <option value="">Select Album (Optional)</option>
                                    {albums.map((album) => (
                                        <option key={album.id} value={album.id}>
                                            {album.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleSaveEdit(selectedAlbum)}
                                    className="bg-green-950/30 border-2 border-green-900/40 text-green-200 px-6 py-2 font-display text-xs"
                                >
                                    SAVE
                                </button>
                            </div>
                        </>
                    )}

                    <button
                        onClick={handleDownload}
                        className="bg-blue-950/30 border-2 border-blue-900/40 text-blue-200 py-3 font-display"
                    >
                        DOWNLOAD
                    </button>

                    <button
                        onClick={() =>
                            setCurrentView(isAuthenticated ? "dashboard" : "home")
                        }
                        className="bg-cyan-900/20 border-2 border-cyan-800/40 text-cyan-50 py-3 font-display"
                    >
                        BACK
                    </button>
                    <button
                        onClick={() => {
                            setImage(null);
                            resetAdjustments();
                            setCurrentView(isAuthenticated ? "dashboard" : "home");
                        }}
                        className="bg-red-950/30 border-2 border-red-900/40 text-red-200 py-3 font-display"
                    >
                        NEW
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="editor-panel bg-slate-900/60 border-2 border-cyan-800/30 p-6 space-y-3">
                    <h3
                        className="text-xs tracking-widest text-slate-400 uppercase font-display"
                    >
                        Presets
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => applyPreset("lunar-surface")}
                            className="bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-800/40 text-white text-xs py-2 font-sans"
                        >
                            Surface
                        </button>
                        <button
                            onClick={() => applyPreset("deep-crater")}
                            className="bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-800/40 text-white text-xs py-2 font-sans"
                        >
                            Crater
                        </button>
                        <button
                            onClick={() => applyPreset("bright-moon")}
                            className="bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-800/40 text-white text-xs py-2 font-sans"
                        >
                            Bright
                        </button>
                        <button
                            onClick={() => applyPreset("monochrome")}
                            className="bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-800/40 text-white text-xs py-2 font-sans"
                        >
                            B&W
                        </button>
                    </div>
                </div>

                <div className="editor-panel bg-slate-900/60 border-2 border-cyan-800/30 p-6 space-y-4">
                    <h3
                        className="text-xs tracking-widest text-slate-400 uppercase font-display"
                    >
                        Light
                    </h3>
                    <Slider
                        label="Brightness"
                        value={brightness}
                        onChange={setBrightness}
                        min={50}
                        max={200}
                        icon="✨"
                    />
                    <Slider
                        label="Contrast"
                        value={contrast}
                        onChange={setContrast}
                        min={50}
                        max={200}
                        icon="📊"
                    />
                </div>

                <div className="editor-panel bg-slate-900/60 border-2 border-cyan-800/30 p-6 space-y-4">
                    <h3
                        className="text-xs tracking-widest text-slate-400 uppercase font-display"
                    >
                        Color
                    </h3>
                    <Slider
                        label="Saturation"
                        value={saturate}
                        onChange={setSaturate}
                        min={0}
                        max={200}
                        icon="🌈"
                    />
                    <Slider
                        label="Hue"
                        value={hue}
                        onChange={setHue}
                        min={-180}
                        max={180}
                        icon="🎨"
                    />
                    <Slider
                        label="Temperature"
                        value={temperature}
                        onChange={setTemperature}
                        min={-50}
                        max={50}
                        icon="🔥"
                    />
                </div>

                <div className="editor-panel bg-slate-900/60 border-2 border-cyan-800/30 p-6 space-y-4">
                    <h3
                        className="text-xs tracking-widest text-slate-400 uppercase font-display"
                    >
                        Effects
                    </h3>
                    <Slider
                        label="Blur"
                        value={blur}
                        onChange={setBlur}
                        min={0}
                        max={10}
                        icon="🌫️"
                    />
                </div>

                <button
                    onClick={resetAdjustments}
                    className="editor-panel w-full bg-slate-800 border border-slate-700 text-white py-2 text-xs font-display"
                >
                    RESET
                </button>
            </div>
        </div>
    );
};

export default Editor;
