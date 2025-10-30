import { useState, useRef, useEffect } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [vibrance, setVibrance] = useState(0);
  const [showBefore, setShowBefore] = useState(false);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);
  const [histogramData, setHistogramData] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!image) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const histR = new Array(256).fill(0);
        const histG = new Array(256).fill(0);
        const histB = new Array(256).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
          histR[data[i]]++;
          histG[data[i + 1]]++;
          histB[data[i + 2]]++;
        }
        
        setHistogramData({ r: histR, g: histG, b: histB });
      } catch (err) {
        console.error("Histogram error:", err);
      }
    };
    img.onerror = () => {
      console.error("Image failed to load");
    };
    img.src = image;
  }, [image]);

  const handleDownload = () => {
    if (!imgRef.current) return;
    const link = document.createElement("a");
    link.href = imgRef.current.src;
    link.download = "moon_enhanced.png";
    link.click();
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHue(0);
    setTemperature(0);
    setVibrance(0);
  };

  const getFilterStyle = () => {
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hue}deg) sepia(${Math.max(0, temperature / 100)}) invert(${Math.max(0, -temperature / 100)}) drop-shadow(0 0 ${vibrance}px rgba(255, 200, 100, ${vibrance / 100}))`;
  };

  const Slider = ({ label, value, onChange, min, max, icon }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{icon} {label}</label>
        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-hidden">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {!image ? (
          <div className="text-center space-y-8 max-w-md">
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🌙 Moon_Knight
              </h1>
              <p className="text-gray-400 text-lg">Enhance your astrophotography</p>
            </div>

            <label className="block">
              <div className="p-8 border-2 border-dashed border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition duration-300 cursor-pointer group">
                <div className="space-y-3">
                  <div className="text-5xl group-hover:scale-110 transition duration-300">📸</div>
                  <p className="text-lg font-semibold text-white">Upload Moon Photo</p>
                  <p className="text-sm text-gray-400">JPG, PNG or any image format</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                className="hidden"
                accept="image/*"
              />
            </label>
          </div>
        ) : (
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="relative bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                  <img
                    ref={imgRef}
                    src={image}
                    alt="moon"
                    className="w-full h-auto"
                    style={{
                      filter: getFilterStyle(),
                      display: showBefore ? "none" : "block",
                      transition: "filter 0.1s"
                    }}
                  />

                  {showBefore && (
                    <img
                      src={image}
                      alt="original"
                      className="w-full h-auto"
                    />
                  )}

                  <button
                    onClick={() => setShowBefore(!showBefore)}
                    className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm hover:bg-black/80 px-4 py-2 rounded-lg text-sm font-medium transition duration-300 border border-gray-700"
                  >
                    {showBefore ? "📸 After" : "👁️ Before"}
                  </button>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-blue-500/50"
                >
                  ⬇️ Download Enhanced Image
                </button>

                {histogramData && (
                  <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50 shadow-xl">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-4">Histogram</h3>
                    <div className="h-32 bg-black rounded-lg p-2 flex items-end gap-0.5 overflow-hidden">
                      {histogramData.r.map((val, idx) => {
                        const maxVal = Math.max(...histogramData.r, ...histogramData.g, ...histogramData.b);
                        const heightR = (histogramData.r[idx] / maxVal) * 100;
                        const heightG = (histogramData.g[idx] / maxVal) * 100;
                        const heightB = (histogramData.b[idx] / maxVal) * 100;
                        
                        return (
                          <div key={idx} className="flex-1 flex items-end gap-px h-full">
                            <div
                              className="flex-1 bg-red-500/70 rounded-t-sm opacity-60"
                              style={{ height: `${heightR}%`, minHeight: heightR > 0 ? "1px" : "0" }}
                            />
                            <div
                              className="flex-1 bg-green-500/70 rounded-t-sm opacity-60"
                              style={{ height: `${heightG}%`, minHeight: heightG > 0 ? "1px" : "0" }}
                            />
                            <div
                              className="flex-1 bg-blue-500/70 rounded-t-sm opacity-60"
                              style={{ height: `${heightB}%`, minHeight: heightB > 0 ? "1px" : "0" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 justify-center mt-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        <span className="text-gray-400">Red</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                        <span className="text-gray-400">Green</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <span className="text-gray-400">Blue</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6 max-h-[90vh] overflow-y-auto pr-2">
                <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Light</h3>
                  <Slider label="Brightness" value={brightness} onChange={setBrightness} min={50} max={200} icon="✨" />
                  <Slider label="Contrast" value={contrast} onChange={setContrast} min={50} max={200} icon="📊" />
                </div>

                <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Color</h3>
                  <Slider label="Hue" value={hue} onChange={setHue} min={-180} max={180} icon="🎨" />
                  <Slider label="Saturation" value={saturate} onChange={setSaturate} min={0} max={200} icon="🌈" />
                  <Slider label="Vibrance" value={vibrance} onChange={setVibrance} min={0} max={50} icon="⚡" />
                  <Slider label="Temperature" value={temperature} onChange={setTemperature} min={-50} max={50} icon="🔥" />
                </div>

                <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50 space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Effects</h3>
                  <Slider label="Blur" value={blur} onChange={setBlur} min={0} max={10} icon="🌫️" />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={resetAdjustments}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-xl transition duration-300 border border-gray-700"
                  >
                    🔄 Reset All
                  </button>

                  <button
                    onClick={() => {
                      setImage(null);
                      resetAdjustments();
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-300 font-semibold py-2 px-4 rounded-xl transition duration-300 border border-red-900/50"
                  >
                    🗑️ New Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}

export default App;