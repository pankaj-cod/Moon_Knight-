import { useState, useRef, useEffect } from "react";

function App() {
  // Auth & Navigation
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Editor
  const [image, setImage] = useState(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [showBefore, setShowBefore] = useState(false);
  const [histogramData, setHistogramData] = useState(null);

  // Dashboard
  const [savedEdits, setSavedEdits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [showStockPhotos, setShowStockPhotos] = useState(false);

  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL =
    import.meta.env.VITE_APP_API_URL || "http://localhost:5000/api";

  // Stock Moon Photos (using Unsplash)
  const stockPhotos = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=800",
      title: "Full Moon",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=800",
      title: "Crescent Moon",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?w=800",
      title: "Moon Surface",
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1446941611757-91d2c3bd3d45?w=800",
      title: "Blood Moon",
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1520034475321-cbe63696469a?w=800",
      title: "Half Moon",
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1517699418036-fb5d179fef0c?w=800",
      title: "Lunar Eclipse",
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserProfile(token);
    }
  }, []);

  useEffect(() => {
    if (!image) {
      setHistogramData(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 800 / Math.max(img.width, img.height));
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

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

        const maxVal = Math.max(...histR, ...histG, ...histB);

        setHistogramData({ r: histR, g: histG, b: histB, maxVal });
      } catch (err) {
        console.error("Histogram error:", err);
      }
    };
    img.src = image;
  }, [image]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setIsAuthenticated(true);
        fetchSavedEdits(token);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const fetchSavedEdits = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/edits`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSavedEdits(data.edits);
      }
    } catch (error) {
      console.error("Failed to fetch edits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint = authMode === "login" ? "login" : "signup";
      const body =
        authMode === "login" ? { email, password } : { email, password, name };

      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setEmail("");
        setPassword("");
        setName("");
        fetchSavedEdits(data.token);
        setCurrentView("dashboard");
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (error) {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    setSavedEdits([]);
    setImage(null);
    setCurrentView("home");
  };

  const applyPreset = (preset) => {
    switch (preset) {
      case "lunar-surface":
        setBrightness(120);
        setContrast(140);
        setSaturate(80);
        setBlur(0);
        setHue(0);
        setTemperature(5);
        break;
      case "deep-crater":
        setBrightness(110);
        setContrast(160);
        setSaturate(90);
        setBlur(0);
        setHue(-5);
        setTemperature(-10);
        break;
      case "bright-moon":
        setBrightness(140);
        setContrast(110);
        setSaturate(100);
        setBlur(0);
        setHue(10);
        setTemperature(15);
        break;
      case "monochrome":
        setBrightness(115);
        setContrast(135);
        setSaturate(0);
        setBlur(0);
        setHue(0);
        setTemperature(0);
        break;
      default:
        break;
    }
  };

  const handleSaveEdit = async () => {
    if (!image) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to save edits");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/edits/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageData: image,
          settings: {
            brightness,
            contrast,
            saturate,
            blur,
            hue,
            temperature,
          },
          presetName: "Custom Edit",
        }),
      });

      if (response.ok) {
        alert("✅ Edit saved successfully!");
        fetchSavedEdits(token);
      } else {
        alert("Failed to save edit");
      }
    } catch (error) {
      alert("Error saving edit");
    }
  };

  const handleDeleteEdit = async (editId) => {
    if (!confirm("Delete this edit?")) return;

    try {
      const response = await fetch(`${API_URL}/edits/${editId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.ok) {
        alert("Deleted successfully!");
        fetchSavedEdits();
      }
    } catch (error) {
      alert("Failed to delete");
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setCurrentView("editor");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStockPhotoSelect = async (photoUrl) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setCurrentView("editor");
        setShowStockPhotos(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error loading stock photo:", error);
      alert("Failed to load stock photo. Please try another one.");
    }
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHue(0);
    setTemperature(0);
  };

  // CSS filter for on-screen preview
  const getCssFilter = () => {
    const tempEffect =
      temperature > 0
        ? `sepia(${temperature / 100})`
        : `hue-rotate(${temperature * 2}deg)`;
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hue}deg) ${tempEffect}`;
  };

  // Canvas-friendly filter (uses unitless numbers where possible)
  const getCanvasFilter = () => {
    const tempEffect =
      temperature > 0
        ? `sepia(${temperature / 100})`
        : `hue-rotate(${temperature * 2}deg)`;
    const b = brightness / 100; // 0.5–2
    const c = contrast / 100; // 0.5–2
    const s = saturate / 100; // 0–2
    return `brightness(${b}) contrast(${c}) saturate(${s}) blur(${blur}px) hue-rotate(${hue}deg) ${tempEffect}`;
  };

  // Download edited image (applies canvas filter)
  const handleDownload = () => {
    if (!image) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      ctx.filter = getCanvasFilter();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert("Failed to create image blob");
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "lunar-edit.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
        "image/png",
        1.0
      );
    };

    img.src = image;
  };

  const Slider = ({ label, value, onChange, min, max, icon }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label
          className="text-sm tracking-widest text-amber-100/70 uppercase"
          style={{ fontFamily: "Cinzel, serif", letterSpacing: "0.15em" }}
        >
          {icon} {label}
        </label>
        <span className="text-xs text-amber-200/90 font-mono bg-black/40 px-3 py-1 rounded-sm border border-amber-800/30">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-amber-900/30 rounded appearance-none cursor-pointer"
        style={{ accentColor: "#d4af37" }}
      />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;500&display=swap');
      `}</style>

      <div
        className="min-h-screen bg-black text-amber-50"
        style={{ fontFamily: "Cormorant Garamond, serif" }}
      >
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-amber-800/40 px-8 py-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <h1
              className="text-2xl font-bold tracking-widest text-amber-100 cursor-pointer"
              style={{ fontFamily: "Cinzel, serif" }}
              onClick={() => setCurrentView("home")}
            >
              🌙 LUNAR ATELIER
            </h1>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setCurrentView("dashboard")}
                    className={`px-4 py-2 border border-amber-800/60 text-xs tracking-widest transition ${
                      currentView === "dashboard"
                        ? "bg-amber-800/40 text-amber-100"
                        : "bg-amber-900/20 hover:bg-amber-800/30 text-amber-100"
                    }`}
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    DASHBOARD
                  </button>
                  <span className="text-sm text-amber-200/70">
                    Hi, {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/60 text-red-200 text-xs tracking-widest transition"
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-amber-900/30 hover:bg-amber-800/40 border border-amber-800/60 text-amber-100 text-xs tracking-widest transition"
                  style={{ fontFamily: "Cinzel, serif" }}
                >
                  LOGIN / SIGNUP
                </button>
              )}
            </div>
          </div>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="bg-black border-2 border-amber-800/60 p-8 max-w-md w-full mx-4">
              <h2
                className="text-3xl font-bold tracking-widest text-amber-100 mb-6 text-center"
                style={{ fontFamily: "Cinzel, serif" }}
              >
                {authMode === "login" ? "LOGIN" : "SIGN UP"}
              </h2>

              <div className="space-y-4">
                {authMode === "signup" && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/60 border border-amber-800/60 px-4 py-2 text-amber-100 placeholder-amber-200/40"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-amber-800/60 px-4 py-2 text-amber-100 placeholder-amber-200/40"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-amber-800/60 px-4 py-2 text-amber-100 placeholder-amber-200/40"
                />

                {authError && (
                  <p className="text-red-400 text-sm text-center">
                    {authError}
                  </p>
                )}

                <button
                  onClick={handleAuth}
                  disabled={authLoading}
                  className="w-full bg-amber-900/30 hover:bg-amber-800/40 border-2 border-amber-800/60 text-amber-100 py-3 tracking-widest transition disabled:opacity-50"
                  style={{ fontFamily: "Cinzel, serif" }}
                >
                  {authLoading
                    ? "LOADING..."
                    : authMode === "login"
                    ? "LOGIN"
                    : "SIGN UP"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "signup" : "login");
                    setAuthError("");
                  }}
                  className="text-amber-200/70 hover:text-amber-100 text-sm"
                >
                  {authMode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Login"}
                </button>
              </div>

              <button
                onClick={() => setShowAuthModal(false)}
                className="mt-4 w-full bg-red-900/20 hover:bg-red-900/30 border border-red-800/50 text-red-200 py-2 text-xs tracking-widest transition"
                style={{ fontFamily: "Cinzel, serif" }}
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        {/* Stock Photos Modal */}
        {showStockPhotos && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
            <div className="bg-black border-2 border-amber-800/60 p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2
                  className="text-3xl font-bold tracking-widest text-amber-100"
                  style={{ fontFamily: "Cinzel, serif" }}
                >
                  STOCK MOON PHOTOS
                </h2>
                <button
                  onClick={() => setShowStockPhotos(false)}
                  className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800/60 text-red-200 text-xs tracking-widest transition"
                  style={{ fontFamily: "Cinzel, serif" }}
                >
                  CLOSE
                </button>
              </div>

              <p className="text-amber-200/70 mb-6 text-center">
                Select a moon photo to start editing
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stockPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handleStockPhotoSelect(photo.url)}
                    className="relative aspect-square border-2 border-amber-800/60 overflow-hidden cursor-pointer group hover:border-amber-600/80 transition"
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p
                          className="text-amber-100 text-sm font-bold tracking-wider"
                          style={{ fontFamily: "Cinzel, serif" }}
                        >
                          {photo.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-amber-200/50 text-center mt-6">
                Photos provided by Unsplash
              </p>
            </div>
          </div>
        )}

        <div className="pt-24 px-8 pb-8 max-w-7xl mx-auto">
          {currentView === "home" && (
            <div className="text-center space-y-12 max-w-xl mx-auto mt-20">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent to-amber-700/50"></div>
                  <div className="text-6xl">🌙</div>
                  <div className="h-px w-24 bg-gradient-to-l from-transparent to-amber-700/50"></div>
                </div>

                <h2
                  className="text-5xl font-bold tracking-widest text-amber-100"
                  style={{
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.2em",
                  }}
                >
                  LUNAR
                </h2>
                <div className="h-px w-48 mx-auto bg-gradient-to-r from-transparent via-amber-700/60 to-transparent"></div>
                <h3
                  className="text-3xl tracking-widest text-amber-200/80"
                  style={{
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.3em",
                  }}
                >
                  ATELIER
                </h3>
                <p className="text-lg text-amber-100/60 italic tracking-wide mt-6">
                  Celestial Photography Enhancement
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <div className="relative group cursor-pointer">
                    <div className="relative border-2 border-amber-800/60 bg-black/40 p-12 transition duration-500 hover:border-amber-600/80">
                      <div className="space-y-4">
                        <div className="text-5xl">📸</div>
                        <p
                          className="text-xl tracking-widest text-amber-100"
                          style={{ fontFamily: "Cinzel, serif" }}
                        >
                          UPLOAD IMAGE
                        </p>
                      </div>
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

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-amber-700/30"></div>
                  <span className="text-amber-200/50 text-sm tracking-wider">
                    OR
                  </span>
                  <div className="flex-1 h-px bg-amber-700/30"></div>
                </div>

                <button
                  onClick={() => setShowStockPhotos(true)}
                  className="w-full border-2 border-amber-800/60 bg-black/40 p-8 transition duration-500 hover:border-amber-600/80 hover:bg-black/60"
                >
                  <div className="space-y-2">
                    <div className="text-4xl">🖼️</div>
                    <p
                      className="text-lg tracking-widest text-amber-100"
                      style={{ fontFamily: "Cinzel, serif" }}
                    >
                      STOCK PHOTOS
                    </p>
                    <p className="text-xs text-amber-200/60">
                      Try our curated moon images
                    </p>
                  </div>
                </button>
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className="px-8 py-3 bg-amber-900/30 hover:bg-amber-800/40 border-2 border-amber-800/60 text-amber-100 tracking-widest transition"
                  style={{ fontFamily: "Cinzel, serif" }}
                >
                  VIEW MY DASHBOARD
                </button>
              )}
            </div>
          )}

          {currentView === "dashboard" && isAuthenticated && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2
                    className="text-4xl font-bold tracking-widest text-amber-100"
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    YOUR GALLERY
                  </h2>
                  <p className="text-amber-200/70 mt-2">
                    {savedEdits.length} saved{" "}
                    {savedEdits.length === 1 ? "edit" : "edits"}
                  </p>
                </div>
                <label>
                  <div
                    className="px-6 py-3 bg-amber-900/30 hover:bg-amber-800/40 border-2 border-amber-800/60 text-amber-100 tracking-widest cursor-pointer transition"
                    style={{ fontFamily: "Cinzel, serif" }}
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
                <div className="text-center text-amber-200/70 py-20">
                  Loading...
                </div>
              ) : savedEdits.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-amber-800/40">
                  <p className="text-amber-200/70 text-xl mb-4">
                    No saved edits yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedEdits.map((edit) => (
                    <div
                      key={edit.id || edit._id}
                      className="border-2 border-amber-800/60 bg-black/40"
                    >
                      <div className="relative aspect-square bg-black">
                        <img
                          src={edit.imageData}
                          alt="Saved"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p
                          className="text-sm text-amber-100"
                          style={{ fontFamily: "Cinzel, serif" }}
                        >
                          {edit.presetName || "Custom"}
                        </p>
                        <p className="text-xs text-amber-200/50">
                          {new Date(edit.createdAt).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() =>
                            handleDeleteEdit(edit.id || edit._id)
                          }
                          className="mt-2 text-red-400 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentView === "editor" && image && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-4">
                <div className="relative bg-black border-2 border-amber-800/60">
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
                    className="absolute top-6 right-6 bg-black/80 px-6 py-2 text-xs tracking-widest border border-amber-800/60 text-amber-100"
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    {showBefore ? "AFTER" : "BEFORE"}
                  </button>
                </div>

                {histogramData && (
                  <div className="bg-black/60 border-2 border-amber-800/40 p-6">
                    <h3
                      className="text-xs tracking-widest text-amber-100/70 uppercase mb-4"
                      style={{ fontFamily: "Cinzel, serif" }}
                    >
                      Histogram
                    </h3>
                    <div className="h-32 bg-black/80 border border-amber-900/30 p-2 flex items-end">
                      {Array.from({ length: 256 }, (_, idx) => {
                        const hR =
                          (histogramData.r[idx] / histogramData.maxVal) * 100;
                        const hG =
                          (histogramData.g[idx] / histogramData.maxVal) * 100;
                        const hB =
                          (histogramData.b[idx] / histogramData.maxVal) * 100;

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col justify-end h-full"
                          >
                            <div
                              className="w-full bg-red-500/70"
                              style={{
                                height: `${hR}%`,
                                minHeight: hR > 0 ? "2px" : "0",
                              }}
                            />
                            <div
                              className="w-full bg-green-500/70"
                              style={{
                                height: `${hG}%`,
                                minHeight: hG > 0 ? "2px" : "0",
                              }}
                            />
                            <div
                              className="w-full bg-blue-500/70"
                              style={{
                                height: `${hB}%`,
                                minHeight: hB > 0 ? "2px" : "0",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Controls row with DOWNLOAD */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {isAuthenticated && (
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-900/30 border-2 border-green-800/60 text-green-100 py-3"
                      style={{ fontFamily: "Cinzel, serif" }}
                    >
                      SAVE
                    </button>
                  )}

                  <button
                    onClick={handleDownload}
                    className="bg-blue-900/30 border-2 border-blue-800/60 text-blue-100 py-3"
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    DOWNLOAD
                  </button>

                  <button
                    onClick={() =>
                      setCurrentView(isAuthenticated ? "dashboard" : "home")
                    }
                    className="bg-amber-900/30 border-2 border-amber-800/60 text-amber-100 py-3"
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    BACK
                  </button>
                  <button
                    onClick={() => {
                      setImage(null);
                      resetAdjustments();
                      setCurrentView(
                        isAuthenticated ? "dashboard" : "home"
                      );
                    }}
                    className="bg-red-900/30 border-2 border-red-800/60 text-red-200 py-3"
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    NEW
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-black/60 border-2 border-amber-800/40 p-6 space-y-3">
                  <h3
                    className="text-xs tracking-widest text-amber-100/70 uppercase"
                    style={{ fontFamily: "Cinzel, serif" }}
                  >
                    Presets
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyPreset("lunar-surface")}
                      className="bg-amber-900/20 hover:bg-amber-800/30 border border-amber-800/50 text-white text-xs py-2"
                    >
                      Surface
                    </button>
                    <button
                      onClick={() => applyPreset("deep-crater")}
                      className="bg-amber-900/20 hover:bg-amber-800/30 border border-amber-800/50 text-white text-xs py-2"
                    >
                      Crater
                    </button>
                    <button
                      onClick={() => applyPreset("bright-moon")}
                      className="bg-amber-900/20 hover:bg-amber-800/30 border border-amber-800/50 text-white text-xs py-2"
                    >
                      Bright
                    </button>
                    <button
                      onClick={() => applyPreset("monochrome")}
                      className="bg-amber-900/20 hover:bg-amber-800/30 border border-amber-800/50 text-white text-xs py-2"
                    >
                      B&amp;W
                    </button>
                  </div>
                </div>

                <div className="bg-black/60 border-2 border-amber-800/40 p-6 space-y-4">
                  <h3
                    className="text-xs tracking-widest text-amber-100/70 uppercase"
                    style={{ fontFamily: "Cinzel, serif" }}
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

                <div className="bg-black/60 border-2 border-amber-800/40 p-6 space-y-4">
                  <h3
                    className="text-xs tracking-widest text-amber-100/70 uppercase"
                    style={{ fontFamily: "Cinzel, serif" }}
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

                <div className="bg-black/60 border-2 border-amber-800/40 p-6 space-y-4">
                  <h3
                    className="text-xs tracking-widest text-amber-100/70 uppercase"
                    style={{ fontFamily: "Cinzel, serif" }}
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
                  className="w-full bg-gray-800 border border-gray-700 text-white py-2 text-xs"
                  style={{ fontFamily: "Cinzel, serif" }}
                >
                  RESET
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
