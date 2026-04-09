import React, { useState, useRef, useEffect, useCallback } from "react";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import StockPhotosModal from "./components/StockPhotosModal";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Albums from "./pages/Albums";
import Editor from "./pages/Editor";
import Galaxy from "./components/Galaxy";
import { ToneCurve } from "./utils/ToneCurve";
import { useHistory } from "./hooks/useHistory";

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
  const [showBefore, setShowBefore] = useState(false);
  const [histogramData, setHistogramData] = useState(null);

  // Unified adjustments state with full undo/redo history
  const initialAdjustments = {
    basic: {
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0
    },
    color: {
      temperature: 0,
      tint: 0,
      vibrance: 0,
      saturation: 0
    },
    toneCurve: new ToneCurve(),
    hsl: {
      red: { hue: 0, saturation: 0, luminance: 0 },
      orange: { hue: 0, saturation: 0, luminance: 0 },
      yellow: { hue: 0, saturation: 0, luminance: 0 },
      green: { hue: 0, saturation: 0, luminance: 0 },
      aqua: { hue: 0, saturation: 0, luminance: 0 },
      blue: { hue: 0, saturation: 0, luminance: 0 },
      purple: { hue: 0, saturation: 0, luminance: 0 },
      magenta: { hue: 0, saturation: 0, luminance: 0 }
    },
    effects: {
      clarity: 0,
      dehaze: 0,
      vignette: 0,
      grain: 0
    },
    blur: 0
  };
  const { adjustments: _adjustments, setAdjustments, undo, redo, canUndo, canRedo, historyLength } = useHistory(initialAdjustments);
  // Guarantee adjustments is never null/undefined — prevents Editor from crashing mid-undo
  const adjustments = _adjustments ?? initialAdjustments;

  // Dashboard
  const [savedEdits, setSavedEdits] = useState([]);
  const [editsPagination, setEditsPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [showStockPhotos, setShowStockPhotos] = useState(false);

  // Albums
  const [albums, setAlbums] = useState([]);
  const [albumsPagination, setAlbumsPagination] = useState(null);

  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL =
    import.meta.env.VITE_APP_API_URL || "http://localhost:5001/api";

  // Sample Photos (served locally from /public folder)
  const stockPhotos = [
    {
      id: 1,
      url: "/moon_full.png",
      title: "Full Moon",
    },
    {
      id: 2,
      url: "/moon_crescent.png",
      title: "Crescent Moon",
    },
    {
      id: 3,
      url: "/moon_surface.png",
      title: "Lunar Surface",
    },
    {
      id: 4,
      url: "/moon_blood.png",
      title: "Blood Moon",
    },
    {
      id: 5,
      url: "/moon_half.png",
      title: "Half Moon",
    },
    {
      id: 6,
      url: "/moon_gibbous.png",
      title: "Gibbous Moon",
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
    img.crossOrigin = "anonymous";
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
        fetchSavedEdits();
        fetchAlbums(); // Fetch albums when user authenticates
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const fetchSavedEdits = useCallback(async (params = {}) => {
    setLoading(true);
    console.log("Fetching edits with params:", params);
    try {
      const token = localStorage.getItem("token");
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/edits?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched edits:", data);
        setSavedEdits(data.edits);
        setEditsPagination(data.pagination);
      } else {
        console.error("Failed response:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch edits:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchAlbums = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const query = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/albums?${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums);
        setAlbumsPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch albums:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const handleCreateAlbum = async (albumData) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Creating album with data:", albumData);
      const response = await fetch(`${API_URL}/albums`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(albumData),
      });
      const data = await response.json();
      console.log("Album creation response:", data);
      if (response.ok) {
        alert("Album created!");
        fetchAlbums();
      } else {
        console.error("Album creation failed:", data);
        alert(`Failed to create album: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Create album error:", error);
      alert(`Error creating album: ${error.message}`);
    }
  };

  const handleUpdateAlbum = async (id, albumData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/albums/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(albumData),
      });
      if (response.ok) {
        alert("Album updated!");
        fetchAlbums();
      } else {
        alert("Failed to update album");
      }
    } catch (error) {
      console.error("Update album error:", error);
    }
  };

  const handleDeleteAlbum = async (id) => {
    if (!confirm("Delete this album?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/albums/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        alert("Album deleted!");
        fetchAlbums();
      } else {
        alert("Failed to delete album");
      }
    } catch (error) {
      console.error("Delete album error:", error);
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
        fetchSavedEdits();
        fetchAlbums(); // Fetch albums on login
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
      case "vivid":
        setAdjustments({
          basic: { exposure: 0.15, contrast: 25, highlights: 10, shadows: 15, whites: 10, blacks: -5 },
          color: { temperature: 5, tint: 0, vibrance: 35, saturation: 20 },
          toneCurve: new ToneCurve(),
          hsl: adjustments.hsl,
          effects: { clarity: 15, dehaze: 5, vignette: 0, grain: 0 },
          blur: 0
        });
        break;
      case "film":
        setAdjustments({
          basic: { exposure: 0.10, contrast: 15, highlights: -20, shadows: 20, whites: -10, blacks: 10 },
          color: { temperature: 15, tint: 5, vibrance: -10, saturation: -5 },
          toneCurve: new ToneCurve(),
          hsl: adjustments.hsl,
          effects: { clarity: 5, dehaze: 0, vignette: 15, grain: 20 },
          blur: 0
        });
        break;
      case "portrait":
        setAdjustments({
          basic: { exposure: 0.20, contrast: 8, highlights: -15, shadows: 20, whites: 5, blacks: 0 },
          color: { temperature: 10, tint: 3, vibrance: 15, saturation: 5 },
          toneCurve: new ToneCurve(),
          hsl: adjustments.hsl,
          effects: { clarity: -5, dehaze: 0, vignette: 12, grain: 3 },
          blur: 0
        });
        break;
      case "monochrome":
        setAdjustments({
          basic: { exposure: 0.20, contrast: 35, highlights: 0, shadows: 0, whites: 0, blacks: 0 },
          color: { temperature: 0, tint: 0, vibrance: 0, saturation: -100 },
          toneCurve: new ToneCurve(),
          hsl: adjustments.hsl,
          effects: { clarity: 30, dehaze: 0, vignette: 15, grain: 5 },
          blur: 0
        });
        break;
      default:
        break;
    }
  };

  const handleSaveEdit = async (albumId = null) => {
    if (!image) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to save edits");
      return;
    }

    try {
      const payload = {
        imageData: image,
        settings: {
          ...adjustments,
          toneCurve: adjustments.toneCurve.toJSON()
        },
        presetName: "Custom Edit",
      };

      // Only add albumId if it's not empty string
      if (albumId && albumId !== "") {
        payload.albumId = albumId;
      }

      console.log("Saving edit with payload:", payload);

      const response = await fetch(`${API_URL}/edits/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Save edit response:", data);

      if (response.ok) {
        alert("✅ Edit saved successfully!");
        fetchSavedEdits();
      } else {
        console.error("Save edit failed:", data);
        alert(`Failed to save edit: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Save edit error:", error);
      alert(`Error saving edit: ${error.message}`);
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

  const handleStockPhotoSelect = (photoUrl) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImage(dataUrl);
        setCurrentView("editor");
        setShowStockPhotos(false);
      } catch (error) {
        console.error("Error converting stock photo:", error);
        alert("Failed to process stock photo.");
      }
    };
    img.onerror = () => {
      alert("Failed to load stock photo.");
    };
    img.src = photoUrl;
  };

  const resetAdjustments = () => {
    setAdjustments({
      basic: { exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0 },
      color: { temperature: 0, tint: 0, vibrance: 0, saturation: 0 },
      toneCurve: new ToneCurve(),
      hsl: {
        red: { hue: 0, saturation: 0, luminance: 0 },
        orange: { hue: 0, saturation: 0, luminance: 0 },
        yellow: { hue: 0, saturation: 0, luminance: 0 },
        green: { hue: 0, saturation: 0, luminance: 0 },
        aqua: { hue: 0, saturation: 0, luminance: 0 },
        blue: { hue: 0, saturation: 0, luminance: 0 },
        purple: { hue: 0, saturation: 0, luminance: 0 },
        magenta: { hue: 0, saturation: 0, luminance: 0 }
      },
      effects: { clarity: 0, dehaze: 0, vignette: 0, grain: 0 },
      blur: 0
    });
  };

  // Download edited image (handled by Editor component now)
  const handleDownload = () => {
    // This will be handled by the Editor component using Canvas export
  };

  return (
    <>
      <div className="min-h-screen text-slate-100 relative font-sans">
        <Galaxy className="fixed inset-0 -z-10 w-full h-full bg-black" />
        <Header
          isAuthenticated={isAuthenticated}
          user={user}
          currentView={currentView}
          setCurrentView={setCurrentView}
          handleLogout={handleLogout}
          setShowAuthModal={setShowAuthModal}
        />
        {showAuthModal && (
          <AuthModal
            authMode={authMode}
            setAuthMode={setAuthMode}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            name={name}
            setName={setName}
            authError={authError}
            setAuthError={setAuthError}
            authLoading={authLoading}
            handleAuth={handleAuth}
            setShowAuthModal={setShowAuthModal}
          />
        )}

        {showStockPhotos && (
          <StockPhotosModal
            stockPhotos={stockPhotos}
            handleStockPhotoSelect={handleStockPhotoSelect}
            setShowStockPhotos={setShowStockPhotos}
          />
        )}

        <div className={currentView === 'editor' ? 'mt-16 h-[calc(100vh-64px)] flex flex-col overflow-hidden' : 'pt-24 px-8 pb-8 max-w-screen-xl mx-auto'}>
          {currentView === "home" && (
            <Home
              isAuthenticated={isAuthenticated}
              setCurrentView={setCurrentView}
              fileInputRef={fileInputRef}
              handleUpload={handleUpload}
              setShowStockPhotos={setShowStockPhotos}
            />
          )}

          {currentView === "dashboard" && isAuthenticated && (
            <Dashboard
              savedEdits={savedEdits}
              loading={loading}
              handleDeleteEdit={handleDeleteEdit}
              handleUpload={handleUpload}
              fetchEdits={fetchSavedEdits}
              pagination={editsPagination}
            />

          )}

          {currentView === "albums" && isAuthenticated && (
            <Albums
              albums={albums}
              loading={loading}
              fetchAlbums={fetchAlbums}
              handleCreateAlbum={handleCreateAlbum}
              handleUpdateAlbum={handleUpdateAlbum}
              handleDeleteAlbum={handleDeleteAlbum}
              pagination={albumsPagination}
            />
          )}

          {currentView === "editor" && image && (
            <Editor
              image={image}
              showBefore={showBefore}
              setShowBefore={setShowBefore}
              histogramData={histogramData}
              setHistogramData={setHistogramData}
              isAuthenticated={isAuthenticated}
              handleSaveEdit={handleSaveEdit}
              handleDownload={handleDownload}
              setCurrentView={setCurrentView}
              setImage={setImage}
              resetAdjustments={resetAdjustments}
              applyPreset={applyPreset}
              adjustments={adjustments}
              setAdjustments={setAdjustments}
              albums={albums}
              undo={undo}
              redo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              historyLength={historyLength}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default App;
