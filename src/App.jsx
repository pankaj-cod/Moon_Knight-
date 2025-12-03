import React, { useState, useRef, useEffect, useCallback } from "react";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import StockPhotosModal from "./components/StockPhotosModal";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Albums from "./pages/Albums";
import Editor from "./pages/Editor";
import Galaxy from "./components/Galaxy";

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
      const response = await fetch(`${API_URL}/albums`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(albumData),
      });
      if (response.ok) {
        alert("Album created!");
        fetchAlbums();
      } else {
        alert("Failed to create album");
      }
    } catch (error) {
      console.error("Create album error:", error);
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

  const handleSaveEdit = async (albumId = null) => {
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
          albumId
        }),
      });

      if (response.ok) {
        alert("✅ Edit saved successfully!");
        fetchSavedEdits();
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
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHue(0);
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

        <div className="pt-24 px-8 pb-8 max-w-7xl mx-auto">
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
              imgRef={imgRef}
              showBefore={showBefore}
              setShowBefore={setShowBefore}
              histogramData={histogramData}
              isAuthenticated={isAuthenticated}
              handleSaveEdit={handleSaveEdit}
              handleDownload={handleDownload}
              setCurrentView={setCurrentView}
              setImage={setImage}
              resetAdjustments={resetAdjustments}
              applyPreset={applyPreset}
              brightness={brightness}
              setBrightness={setBrightness}
              contrast={contrast}
              setContrast={setContrast}
              saturate={saturate}
              setSaturate={setSaturate}
              hue={hue}
              setHue={setHue}
              temperature={temperature}
              setTemperature={setTemperature}
              blur={blur}
              setBlur={setBlur}
              getCssFilter={getCssFilter}
              albums={albums}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default App;
