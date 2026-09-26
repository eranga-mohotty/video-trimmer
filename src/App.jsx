import { useState, useEffect, useCallback } from "react";
import "./App.css";

// Shared FFmpeg Hook
import { useFFmpeg } from "./hooks/useFFmpeg";

// Shell & Navigation Components
import { Header } from "./components/Header";
import { NavigationDrawer } from "./components/NavigationDrawer";
import { ROUTE_DEFS } from "./constants/routes";
import { FFmpegLoader } from "./components/FFmpegLoader";

// Page Views
import { TrimPage } from "./pages/TrimPage";
import { ExtractAudioPage } from "./pages/ExtractAudioPage";
import { RemoveStreamsPage } from "./pages/RemoveStreamsPage";
import { SwitchContainerPage } from "./pages/SwitchContainerPage";

function getRouteFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const found = ROUTE_DEFS.find((r) => r.id === hash);
  return found ? found.id : "trim";
}

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(getRouteFromHash);

  // Shared FFmpeg WebAssembly Engine (persists across page switches)
  const ffmpegEngine = useFFmpeg();

  // Listen to hashchange events for browser back/forward and direct linking
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = useCallback((routeId) => {
    window.location.hash = `#/${routeId}`;
    setCurrentRoute(routeId);
  }, []);

  const activeRouteDef = ROUTE_DEFS.find((r) => r.id === currentRoute);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center px-4 pb-12 selection:bg-blue-600 selection:text-white">
      {/* Collapsible Left Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentRoute={currentRoute}
        onNavigate={navigateTo}
      />

      {/* Top Header with Hamburger Button */}
      <Header
        onMenuClick={() => setIsDrawerOpen(true)}
        currentRouteName={activeRouteDef?.name}
      />

      {/* Main Content Area */}
      {!ffmpegEngine.isLoaded ? (
        <FFmpegLoader />
      ) : (
        <main className="w-full max-w-2xl flex flex-col items-center mt-2">
          {currentRoute === "trim" && (
            <TrimPage ffmpegEngine={ffmpegEngine} />
          )}
          {currentRoute === "extract-audio" && (
            <ExtractAudioPage />
          )}
          {currentRoute === "remove-streams" && (
            <RemoveStreamsPage />
          )}
          {currentRoute === "switch-container" && (
            <SwitchContainerPage />
          )}
        </main>
      )}
    </div>
  );
}
